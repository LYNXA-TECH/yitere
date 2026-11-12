// YITERE, fiche d'un service : GET /api/v1/services/{cle}.
// Forme : DetailService de web/lib/donnees/types.ts, en snake_case (ecarts notes dans le contrat).
// Les statuts, la valeur habituelle et le repere viennent du verdict, pour qu'une fiche ne
// contredise jamais le tableau des services ni la carte.
'use strict';
const verdicts = require('./verdicts.js');
const { reussie, valeurDe, estObjet, arrondi, numeroter } = verdicts.outils;

const CLE_VALIDE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const HEURE = 3600e3;
const PAS_24H = { nombre: 24, duree: HEURE };       // 24 pas d'une heure
const PAS_7J = { nombre: 28, duree: 6 * HEURE };    // 28 pas de six heures

/** Les heures de fin des pas, du plus ancien au plus recent : le dernier finit maintenant. */
function finsDePas({ nombre, duree }, maintenant) {
  return Array.from({ length: nombre }, (_, i) => new Date(+maintenant - (nombre - 1 - i) * duree));
}

/** Une valeur par pas : la mediane des mesures reussies du pas, null s'il n'y en a aucune. */
function courbe(mesures, cible, pas, maintenant) {
  const debut = +maintenant - pas.nombre * pas.duree;
  const cases = Array.from({ length: pas.nombre }, () => []);
  for (const m of mesures) {
    if (!reussie(m, cible)) continue;
    const t = +new Date(m.mesure_le);
    if (t <= debut || t > +maintenant) continue;
    // Le pas i couvre ]debut + i * duree ; debut + (i + 1) * duree].
    const i = Math.min(pas.nombre - 1, Math.ceil((t - debut) / pas.duree) - 1);
    cases[i].push(valeurDe(m, cible));
  }
  const d = estObjet(cible) ? 2 : 0;
  return cases.map((v) => (v.length ? arrondi(verdicts.mediane(v), d) : null));
}

/**
 * Ou part le temps d'un passage. La sonde note quatre instants depuis le depart (DNS resolu,
 * connexion ouverte, chiffrement etabli, premier octet recu) : on rend les quatre durees
 * qui les separent. Leur somme est le temps au premier octet.
 */
function decomposer(m) {
  const t = [m.dns_ms, m.tcp_ms, m.tls_ms, m.ttfb_ms];
  if (t.some((x) => x === null || x === undefined)) return null;
  if (!(t[0] >= 0 && t[1] >= t[0] && t[2] >= t[1] && t[3] >= t[2])) return null;
  return {
    dns: arrondi(t[0]), connexion: arrondi(t[1] - t[0]), tls: arrondi(t[2] - t[1]),
    attente: arrondi(t[3] - t[2]), premier_octet: arrondi(t[3]),
  };
}

/**
 * donnees : celles de verdicts.lire(), plus
 *   semaine  : mesures de la cible sur 7 jours [{ probe_id, mesure_le, ttfb_ms, debit_bps, code_http, erreur }]
 *   passages : dernier passage reussi et complet de chaque sonde pour la cible
 *              [{ probe_id, mesure_le, dns_ms, tcp_ms, tls_ms, ttfb_ms }]
 * Rend null quand la cle ne designe aucune cible mesuree (inconnue, inactive ou de reference).
 */
function detailler(donnees, cle, maintenant = new Date()) {
  const { cibles, sondes, mesures, semaine = [], passages = [] } = donnees;
  const cible = cibles.find((c) => c.cle === cle && c.famille !== 'Reference');
  if (!cible) return null;
  const verdict = verdicts.calculer(donnees, maintenant).verdicts.find((v) => v.cle === cle);
  const jugee = new Map(verdict.preuves.sondes.map((s) => [s.pseudonyme, s]));
  const numeros = numeroter(sondes);
  const d = estObjet(cible) ? 2 : 0;

  const designer = (s) => {
    const j = jugee.get(s.pseudonyme);
    return {
      sonde: {
        pseudonyme: s.pseudonyme,
        operateur: s.asn ? `AS${s.asn}` : null,
        ville: s.ville,
        numero: numeros.get(s.id),
      },
      statut: j ? j.statut : 'rodage',
    };
  };
  const de = (liste, id) => liste.filter((m) => m.probe_id === id && (m.target_id === undefined || m.target_id === cible.id));

  // Une courbe par sonde developpeur qui a mesure la cible ; le repere de Madrid est a part.
  const series24 = [], series7j = [];
  for (const s of sondes) {
    if (s.type === 'datacenter') continue;
    const jour = courbe(de(mesures, s.id), cible, PAS_24H, maintenant);
    const sept = courbe(de(semaine, s.id), cible, PAS_7J, maintenant);
    if (jour.every((x) => x === null) && sept.every((x) => x === null)) continue;
    const qui = designer(s);
    series24.push({ ...qui, points: jour });
    series7j.push({ ...qui, points: sept });
  }

  // La bande des valeurs habituelles : celles des sondes jugees. Sans sonde jugee, pas de bande.
  const habituels = verdict.preuves.sondes.map((s) => s.habituel).filter((x) => x !== null && x !== undefined);
  const fins24 = finsDePas(PAS_24H, maintenant);
  let debutIncident = null;
  if (verdict.etat === 'degrade' && verdict.depuis) {
    const i = fins24.findIndex((f) => +f > +new Date(verdict.depuis));
    debutIncident = i >= 0 ? i : null;
  }

  // Le repere : mediane de ses mesures reussies sur la periode du verdict.
  const debutPeriode = +maintenant - verdict.preuves.periode_minutes * 60e3;
  const duRepere = [];
  for (const s of sondes) {
    if (s.type !== 'datacenter') continue;
    for (const m of de(mesures, s.id))
      if (+new Date(m.mesure_le) >= debutPeriode && reussie(m, cible)) duRepere.push(valeurDe(m, cible));
  }

  // Ou part le temps : une sonde touchee et une epargnee au plus, sur leur dernier passage.
  const cascades = [];
  if (!estObjet(cible)) {
    for (const statut of ['touchee', 'epargnee']) {
      for (const s of sondes) {
        const j = jugee.get(s.pseudonyme);
        if (s.type === 'datacenter' || !j || j.statut !== statut) continue;
        const p = passages.find((x) => x.probe_id === s.id);
        const temps = p && decomposer(p);
        if (!temps) continue;
        cascades.push({ ...designer(s), mesure_le: new Date(p.mesure_le).toISOString(), ...temps });
        break;
      }
    }
  }

  return {
    calcule_le: maintenant.toISOString(),
    cle: cible.cle,
    unite: estObjet(cible) ? 'mbps' : 'ms',
    heures_24: fins24.map((f) => f.toISOString()),
    heures_7j: finsDePas(PAS_7J, maintenant).map((f) => f.toISOString()),
    series_24: series24,
    series_7j: series7j,
    habituel: habituels.length ? { min: Math.min(...habituels), max: Math.max(...habituels) } : null,
    debut_incident_24: debutIncident,
    repere: {
      valeur: duRepere.length ? arrondi(verdicts.mediane(duRepere), d) : null,
      etat: verdict.preuves.repere,
    },
    cascades,
  };
}

/** Vrai si la cle designe une cible mesuree : une requete courte, avant tout calcul. */
async function existe(db, cle) {
  if (typeof cle !== 'string' || !CLE_VALIDE.test(cle)) return false;
  const r = await db.query(
    "SELECT 1 FROM targets WHERE cle = $1 AND active AND famille <> 'Reference'", [cle]);
  return r.rows.length > 0;
}

async function lire(db, cle, maintenant = new Date()) {
  const donnees = await verdicts.lire(db, maintenant);
  donnees.semaine = (await db.query(
    `SELECT m.probe_id, m.mesure_le, m.ttfb_ms, m.debit_bps, m.code_http, m.erreur
       FROM measurements m
       JOIN probes p ON p.id = m.probe_id AND p.active
       JOIN targets t ON t.id = m.target_id AND t.active AND t.cle = $2
      WHERE m.mesure_le > $1::timestamptz - interval '7 days' AND m.mesure_le <= $1
      ORDER BY m.mesure_le`, [maintenant, cle])).rows;
  donnees.passages = (await db.query(
    `SELECT DISTINCT ON (m.probe_id) m.probe_id, m.mesure_le, m.dns_ms, m.tcp_ms, m.tls_ms, m.ttfb_ms
       FROM measurements m
       JOIN probes p ON p.id = m.probe_id AND p.active
       JOIN targets t ON t.id = m.target_id AND t.active AND t.cle = $2
      WHERE m.mesure_le > $1::timestamptz - interval '24 hours' AND m.mesure_le <= $1
        AND m.erreur IS NULL AND m.code_http = t.code_attendu
        AND m.dns_ms IS NOT NULL AND m.tcp_ms IS NOT NULL AND m.tls_ms IS NOT NULL AND m.ttfb_ms IS NOT NULL
      ORDER BY m.probe_id, m.mesure_le DESC`, [maintenant, cle])).rows;
  for (const m of [...donnees.semaine, ...donnees.passages]) {
    m.probe_id = Number(m.probe_id);
    if ('debit_bps' in m) m.debit_bps = m.debit_bps === null ? null : Number(m.debit_bps);
  }
  return donnees;
}

module.exports = { detailler, lire, existe, courbe, decomposer, finsDePas, CLE_VALIDE, PAS_24H, PAS_7J };
