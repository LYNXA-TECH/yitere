// YITERE, ingestion. Une seule route, authentifiee par jeton de sonde.
// Aucune adresse IP n'est lue ni stockee.
'use strict';
const http = require('node:http');
const crypto = require('node:crypto');
const { Client } = require('pg');

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

const serveur = http.createServer((req, res) => {
  const repondre = (code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
  };
  if (req.method === 'GET' && req.url === '/sante') return repondre(200, { ok: true });

  // Lecture publique, sans jeton : la liste des cibles mesurees.
  if (req.method === 'GET' && req.url === '/api/v1/cibles') {
    return db.query(
      `SELECT cle, nom, famille, url, methode, cadence_minutes,
              taille_attendue, code_attendu
         FROM targets WHERE active ORDER BY famille, cle`)
      .then(r => repondre(200, { cibles: r.rows }))
      .catch(() => repondre(500, { erreur: 'base injoignable' }));
  }

  if (req.method !== 'POST' || req.url !== '/api/v1/mesures')
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
