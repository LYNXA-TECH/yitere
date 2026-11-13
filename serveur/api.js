// YITERE, API. Ecritures : l'ingestion des mesures, authentifiee par jeton de sonde, et le
// depot d'une publication, sans compte, masquee jusqu'a relecture par l'equipe.
// Lecture publique, sans jeton : cibles, verdicts, sondes, services, fiche d'un service, publications
// (docs/CONTRAT-API-INTERFACE.md).
// Aucune adresse IP n'est lue ni stockee.
'use strict';
const http = require('node:http');
const crypto = require('node:crypto');
const { Client } = require('pg');
const verdicts = require('./verdicts.js');
const services = require('./services.js');
const publications = require('./publications.js');
const detail = require('./detail.js');

const PORT = Number(process.env.PORT || 8787);
const DB = process.env.YITERE_DB_URL;
if (!DB) { console.error('YITERE_DB_URL manquant'); process.exit(1); }

const db = new Client({ connectionString: DB });
const hache = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

const CHAMPS = ['dns_ms','tcp_ms','tls_ms','ttfb_ms','octets','duree_ms','debit_bps','code_http'];

function entier(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

async function sondeDuJeton(jeton) {
  const r = await db.query(
    'SELECT id, active FROM probes WHERE jeton_hache = $1', [hache(jeton)]);
  return r.rows[0] || null;
}

async function inserer(sondeId, mesures) {
  let poses = 0, ignorees = 0;
  for (const m of mesures) {
    const t = await db.query('SELECT id FROM targets WHERE cle = $1 AND active', [m.cible]);
    if (!t.rows[0]) { ignorees++; continue; }
    const v = Object.fromEntries(CHAMPS.map(c => [c, entier(m[c])]));
    await db.query(
      `INSERT INTO measurements
         (probe_id, target_id, mesure_le, dns_ms, tcp_ms, tls_ms, ttfb_ms,
          octets, duree_ms, debit_bps, code_http, erreur)
       VALUES ($1,$2, now(), $3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [sondeId, t.rows[0].id, v.dns_ms, v.tcp_ms, v.tls_ms, v.ttfb_ms,
       v.octets, v.duree_ms, v.debit_bps, v.code_http,
       m.erreur ? String(m.erreur).slice(0, 120) : null]);
    poses++;
  }
  await db.query('UPDATE probes SET vue_le = now() WHERE id = $1', [sondeId]);
  return { poses, ignorees };
}

// Les lectures calculees sont gardees 30 secondes : un visiteur presse ne fait pas travailler la base.
const GARDE_MS = 30e3;
const garde = new Map();
async function avecGarde(cle, produire) {
  const g = garde.get(cle);
  if (g && Date.now() - g.le < GARDE_MS) return g.valeur;
  const valeur = await produire();
  garde.set(cle, { le: Date.now(), valeur });
  return valeur;
}

// Le guichet des depots : un plafond par heure, sans lire aucune adresse IP.
const depots = publications.guichet();

const serveur = http.createServer((req, res) => {
  const repondre = (code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
  };
  const chemin = (req.url || '').split('?')[0];
  if (req.method === 'GET' && chemin === '/sante') return repondre(200, { ok: true });

  // Lectures publiques, sans jeton. Les verdicts sont calcules ici, jamais stockes.
  if (req.method === 'GET' && chemin === '/api/v1/verdicts') {
    return avecGarde('verdicts', async () => verdicts.calculer(await verdicts.lire(db)))
      .then(v => repondre(200, v))
      .catch(() => repondre(500, { erreur: 'base injoignable' }));
  }
  if (req.method === 'GET' && chemin === '/api/v1/services') {
    return avecGarde('services', async () => services.resumer(await services.lire(db)))
      .then(v => repondre(200, v))
      .catch(() => repondre(500, { erreur: 'base injoignable' }));
  }
  // La fiche d'un service. La cle est verifiee avant tout calcul : une adresse au hasard
  // ne fait ni travailler la base ni grossir la garde.
  const fiche = /^\/api\/v1\/services\/([^/]+)$/.exec(chemin);
  if (req.method === 'GET' && fiche) {
    const cle = fiche[1];
    return detail.existe(db, cle)
      .then(ok => ok
        ? avecGarde(`detail:${cle}`, async () => detail.detailler(await detail.lire(db, cle), cle))
        : null)
      .then(v => v ? repondre(200, v) : repondre(404, { erreur: 'service inconnu' }))
      .catch(() => repondre(500, { erreur: 'base injoignable' }));
  }

  if (req.method === 'GET' && chemin === '/api/v1/sondes') {
    return avecGarde('sondes', async () => verdicts.listerSondes(await verdicts.lireSondes(db)))
      .then(v => repondre(200, v))
      .catch(() => repondre(500, { erreur: 'base injoignable' }));
  }

  // Publications : lecture seule tant que la connexion GitHub n'existe pas.
  if (req.method === 'GET' && chemin === '/api/v1/publications') {
    let cle;
    try { cle = new URL(req.url, 'http://local').searchParams.get('cible') ?? undefined; }
    catch { return repondre(400, { erreur: 'adresse invalide' }); }
    return publications.lire(db, cle)
      .then(lignes => lignes === null
        ? repondre(404, { erreur: 'cible inconnue' })
        : repondre(200, publications.lister(lignes)))
      .catch(() => repondre(500, { erreur: 'base injoignable' }));
  }

  // Lecture publique, sans jeton : la liste des cibles mesurees.
  if (req.method === 'GET' && chemin === '/api/v1/cibles') {
    return db.query(
      `SELECT cle, nom, famille, url, methode, cadence_minutes,
              taille_attendue, code_attendu
         FROM targets WHERE active ORDER BY famille, cle`)
      .then(r => repondre(200, { cibles: r.rows }))
      .catch(() => repondre(500, { erreur: 'base injoignable' }));
  }

  // Depot d'une publication, sans compte : elle nait masquee et attend une relecture.
  if (req.method === 'POST' && chemin === '/api/v1/publications') {
    if (!/^application\/json\b/i.test(req.headers['content-type'] || ''))
      return repondre(415, { erreur: 'envoyer du JSON (content-type: application/json)' });
    let recu = '';
    let lourd = false;
    req.on('data', (c) => {
      recu += c;
      if (Buffer.byteLength(recu) > publications.CORPS_MAX && !lourd) {
        lourd = true;
        repondre(413, { erreur: 'depot trop long' });
        req.destroy();
      }
    });
    req.on('end', async () => {
      if (lourd) return;
      let corps;
      try { corps = JSON.parse(recu || 'null'); } catch { return repondre(400, { erreur: 'corps invalide' }); }
      const v = publications.valider(corps);
      if (!v.ok) return repondre(400, { erreur: v.erreur, champ: v.champ });
      if (!depots.ouvert()) return repondre(429, { erreur: 'trop de depots cette heure-ci, reessayez plus tard' });
      try {
        const r = await publications.deposer(db, v.valeurs);
        if (!r.ok) return repondre(r.code, { erreur: r.erreur });
        depots.noter();
        repondre(201, { statut: 'en-attente', message: 'Merci. Votre publication sera visible apres relecture par l\'equipe.' });
      } catch {
        repondre(500, { erreur: 'base injoignable' });
      }
    });
    return;
  }

  if (req.method !== 'POST' || chemin !== '/api/v1/mesures')
    return repondre(404, { erreur: 'route inconnue' });

  const auth = req.headers.authorization || '';
  const jeton = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!jeton) return repondre(401, { erreur: 'jeton manquant' });

  let brut = '';
  let trop = false;
  req.on('data', (c) => {
    brut += c;
    if (brut.length > 512 * 1024) { trop = true; req.destroy(); }
  });
  req.on('end', async () => {
    if (trop) return;
    try {
      const sonde = await sondeDuJeton(jeton);
      if (!sonde) return repondre(401, { erreur: 'jeton inconnu' });
      if (!sonde.active) return repondre(403, { erreur: 'sonde desactivee' });
      const corps = JSON.parse(brut || '{}');
      const mesures = Array.isArray(corps.mesures) ? corps.mesures : [];
      if (mesures.length === 0) return repondre(400, { erreur: 'aucune mesure' });
      if (mesures.length > 200) return repondre(413, { erreur: 'lot trop grand' });
      const bilan = await inserer(sonde.id, mesures);
      repondre(201, bilan);
    } catch (e) {
      repondre(400, { erreur: 'corps invalide' });
    }
  });
});

db.connect()
  .then(() => serveur.listen(PORT, '127.0.0.1',
    () => console.log('ingestion YITERE sur 127.0.0.1:' + PORT)))
  .catch((e) => { console.error('base injoignable:', e.message); process.exit(1); });
