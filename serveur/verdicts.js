// YITERE, verdicts. Calcules a la lecture, jamais stockes (methodologie, section 7).
// Ce fichier separe deux choses : lire() interroge la base, calculer() applique les regles.
// calculer() est une fonction pure, testee sans base : serveur/verdicts.test.js.
'use strict';

// Les seuils. Ils sont publies tels quels dans la section 7 de la methodologie.
const SEUILS = {
  facteur: 2,          // degradation : mediane de la periode au-dela de 2 fois la valeur habituelle
  partEchecs: 0.5,     // ou plus de la moitie des mesures de la periode en echec
  rodageHeures: 24,    // une sonde ne compte pas pendant ses 24 premieres heures
  minHabitude: 12,     // ni tant qu'elle n'a pas 12 mesures anterieures de la cible
  minSondesCause: 3,   // aucune cause proposee en dessous de 3 sondes jugees
  periodeMinutes: 60,  // fenetre de calcul, allongee a la cadence des cibles plus lentes
  retourAuCalme: 3,    // 3 bonnes mesures de suite ferment une degradation
  partLocale: 0.5,     // une sonde touchee sur plus de la moitie des services : sa connexion est en cause
  minCiblesLocale: 3,  // a condition d'avoir ete jugee sur 3 services au moins
};

const mediane = (v) => {
  if (v.length === 0) return null;
  const t = [...v].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
};
const arrondi = (x, d = 0) => { const p = 10 ** d; return Math.round(x * p) / p; };

// Une cible « objet » se juge a son debit, les autres au temps du premier octet.
const estObjet = (cible) => cible.methode === 'objet';
const reussie = (m, cible) => !m.erreur && m.code_http === cible.code_attendu;
const valeurDe = (m, cible) => (estObjet(cible) ? m.debit_bps / 1e6 : m.ttfb_ms);
const pire = (valeur, habituel, cible) =>
  estObjet(cible) ? valeur < habituel / SEUILS.facteur : valeur > habituel * SEUILS.facteur;

const operateurDe = (sonde) => (sonde.asn ? `AS${sonde.asn}` : null);

// « Operateur A · Conakry · 1 » : le numero distingue les sondes d'un meme operateur et d'une meme ville.
function numeroter(sondes) {
  const compte = new Map();
  const numeros = new Map();
  for (const s of [...sondes].sort((a, b) => a.id - b.id)) {
    const cle = `${operateurDe(s)}|${s.ville}`;
    compte.set(cle, (compte.get(cle) || 0) + 1);
    numeros.set(s.id, compte.get(cle));
  }
  return numeros;
}

function enRodage(sonde, maintenant) {
  return maintenant - new Date(sonde.creee_le) < SEUILS.rodageHeures * 3600e3;
}

// Ce qu'une sonde montre pour une cible sur la periode : null si elle n'a rien mesure.
function jugerSonde(mesures, habitude, cible, debutPeriode) {
  const periode = mesures.filter((m) => new Date(m.mesure_le) >= debutPeriode);
  if (periode.length === 0) return null;
  const bonnes = periode.filter((m) => reussie(m, cible));
  const echecs = periode.length - bonnes.length;
  const enEchec = echecs / periode.length > SEUILS.partEchecs;
  // En echec, la valeur affichee est le temps perdu a attendre (ou un debit nul), pas la
  // mediane des rares mesures reussies : elle ferait passer la sonde pour bien portante.
  const valeur = enEchec || bonnes.length === 0
    ? (estObjet(cible) ? 0 : mediane(periode.map((m) => m.duree_ms || 0)))
    : mediane(bonnes.map((m) => valeurDe(m, cible)));
  const habituel = habitude && habitude.n >= SEUILS.minHabitude ? habitude.valeur : null;
  if (habituel === null) return { juge: false, mesures: periode.length };
  const touchee = enEchec || pire(valeur, habituel, cible);
  return { juge: true, touchee, valeur, habituel, mesures: periode.length, echecs };
}

// Debut de la degradation : on remonte les mesures jusqu'a trois bonnes de suite.
function debutDegradation(mesures, habituel, cible) {
  let debut = null, calme = 0;
  for (let i = mesures.length - 1; i >= 0 && calme < SEUILS.retourAuCalme; i--) {
    const m = mesures[i];
    const mauvaise = !reussie(m, cible) || pire(valeurDe(m, cible), habituel, cible);
    if (mauvaise) { debut = m.mesure_le; calme = 0; } else calme++;
  }
  return debut;
}

function proposerCause(jugees, repere, locales) {
  if (jugees.length < SEUILS.minSondesCause) return null;
  const touchees = jugees.filter((j) => j.touchee);
  const epargnees = jugees.filter((j) => !j.touchee);
  if (touchees.length === 0) return null;
  if (epargnees.length === 0) return repere === 'degrade' ? { cause: 'service' } : null;
  // Les sondes touchees le sont sur la plupart des services, les autres sondes non :
  // le probleme est chez l'hote, pas chez ce service.
  if (touchees.every((j) => locales.has(j.sonde.id))) return { cause: 'connexion-locale' };
  const operateurs = new Set(touchees.map((j) => operateurDe(j.sonde)));
  const [operateur] = operateurs;
  if (operateurs.size === 1 && operateur &&
      !epargnees.some((j) => operateurDe(j.sonde) === operateur)) {
    const villes = new Set(touchees.map((j) => j.sonde.ville));
    const h = { cause: 'operateur', operateur };
    if (villes.size === 1 && [...villes][0]) h.ville = [...villes][0];
    return h;
  }
  return null;
}

/**
 * donnees : { cibles, sondes, mesures (24 h, triees par date), habitudes }
 * habitudes : [{ probe_id, target_id, n, ttfb_ms, debit_bps }] sur 7 jours, hors periode.
 */
function calculer(donnees, maintenant = new Date()) {
  const { cibles, sondes, mesures, habitudes } = donnees;
  const numeros = numeroter(sondes);
  const parPaire = new Map();
  for (const m of mesures) {
    const k = `${m.probe_id}|${m.target_id}`;
    if (!parPaire.has(k)) parPaire.set(k, []);
    parPaire.get(k).push(m);
  }
  const habitudeDe = new Map(habitudes.map((h) => [`${h.probe_id}|${h.target_id}`, h]));

  const etapes = cibles.filter((c) => c.famille !== 'Reference').map((cible) => {
    const periodeMinutes = Math.max(SEUILS.periodeMinutes, cible.cadence_minutes);
    const debut = new Date(maintenant - periodeMinutes * 60e3);
    let repere = 'exclu', enRodageN = 0, derniere = null;
    const jugees = [];

    for (const sonde of sondes) {
      const k = `${sonde.id}|${cible.id}`;
      const ms = parPaire.get(k) || [];
      const h = habitudeDe.get(k);
      const habitude = h && { n: Number(h.n), valeur: estObjet(cible) ? h.debit_bps / 1e6 : h.ttfb_ms };
      const j = jugerSonde(ms, habitude && habitude.valeur != null ? habitude : null, cible, debut);
      if (sonde.type === 'datacenter') {          // le repere de Madrid : affiche a part, hors calcul
        if (j && j.juge) repere = j.touchee ? 'degrade' : 'normal';
        continue;
      }
      if (ms.length) {
        const t = ms[ms.length - 1].mesure_le;
        if (!derniere || new Date(t) > new Date(derniere)) derniere = t;
      }
      if (!j) continue;                            // rien mesure sur la periode
      if (enRodage(sonde, maintenant) || !j.juge) { enRodageN++; continue; }
      jugees.push({ ...j, sonde, toutes: ms });
    }

    return { cible, periodeMinutes, repere, enRodageN, derniere, jugees };
  });

  // Une sonde touchee sur plus de la moitie des services qu'elle mesure : connexion locale.
  const bilan = new Map();
  for (const e of etapes) for (const j of e.jugees) {
    const b = bilan.get(j.sonde.id) || { jugee: 0, touchee: 0 };
    b.jugee++; if (j.touchee) b.touchee++;
    bilan.set(j.sonde.id, b);
  }
  const locales = new Set([...bilan].filter(([, b]) =>
    b.jugee >= SEUILS.minCiblesLocale && b.touchee / b.jugee > SEUILS.partLocale).map(([id]) => id));

  const verdicts = etapes.map(({ cible, periodeMinutes, repere, enRodageN, derniere, jugees }) => {
    const touchees = jugees.filter((j) => j.touchee);
    const etat = jugees.length === 0 ? 'pas-de-donnee' : touchees.length ? 'degrade' : 'normal';
    let depuis = null;
    if (etat === 'degrade') {
      const debuts = touchees.map((j) => debutDegradation(j.toutes, j.habituel, cible)).filter(Boolean);
      depuis = debuts.length ? new Date(Math.min(...debuts.map((d) => +new Date(d)))).toISOString() : null;
    } else if (etat === 'pas-de-donnee' && derniere) {
      depuis = new Date(derniere).toISOString();
    }

    const unite = estObjet(cible) ? 'mbps' : 'ms';
    const d = estObjet(cible) ? 2 : 0;
    return {
      cle: cible.cle,
      nom: cible.nom,
      etat,
      depuis,
      hypothese: proposerCause(jugees, repere, locales),
      preuves: {
        sondes_touchees: touchees.length,
        sondes_epargnees: jugees.length - touchees.length,
        sondes_en_rodage: enRodageN,
        mesures: jugees.reduce((n, j) => n + j.mesures, 0),
        periode_minutes: periodeMinutes,
        repere,
        sondes: [...touchees, ...jugees.filter((j) => !j.touchee)].map((j) => ({
          pseudonyme: j.sonde.pseudonyme,
          operateur: operateurDe(j.sonde),
          ville: j.sonde.ville,
          numero: numeros.get(j.sonde.id),
          statut: j.touchee ? 'touchee' : 'epargnee',
          valeur: arrondi(j.valeur, d),
          habituel: arrondi(j.habituel, d),
          unite,
          mesures: j.mesures,
          echecs: j.echecs,
        })),
      },
    };
  });
  return { calcule_le: maintenant.toISOString(), verdicts };
}

// Les sondes actives, sans jeton ni rien qui identifie la personne qui heberge.
function listerSondes(sondes, maintenant = new Date()) {
  return {
    sondes: sondes.map((s) => ({
      pseudonyme: s.pseudonyme,
      pays: s.pays,
      ville: s.ville,
      operateur: operateurDe(s),
      type: s.type,
      en_rodage: enRodage(s, maintenant),
    })),
  };
}

async function lireSondes(db) {
  const r = await db.query(
    `SELECT id, pseudonyme, pays, ville, asn, type, creee_le
       FROM probes WHERE active ORDER BY id`);
  return r.rows;
}

async function lire(db, maintenant = new Date()) {
  const cibles = (await db.query(
    `SELECT id, cle, nom, famille, methode, cadence_minutes, code_attendu
       FROM targets WHERE active ORDER BY famille, cle`)).rows;
  const sondes = await lireSondes(db);
  const mesures = (await db.query(
    `SELECT m.probe_id, m.target_id, m.mesure_le, m.ttfb_ms, m.debit_bps,
            m.duree_ms, m.code_http, m.erreur
       FROM measurements m
       JOIN probes p ON p.id = m.probe_id AND p.active
       JOIN targets t ON t.id = m.target_id AND t.active
      WHERE m.mesure_le > $1::timestamptz - interval '24 hours' AND m.mesure_le <= $1
      ORDER BY m.mesure_le`, [maintenant])).rows;
  // La valeur habituelle : mediane des mesures reussies des 7 derniers jours, hors periode en cours.
  const habitudes = (await db.query(
    `SELECT m.probe_id, m.target_id, count(*) AS n,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY m.ttfb_ms)   AS ttfb_ms,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY m.debit_bps) AS debit_bps
       FROM measurements m
       JOIN probes p ON p.id = m.probe_id AND p.active
       JOIN targets t ON t.id = m.target_id AND t.active
      WHERE m.mesure_le > $1::timestamptz - interval '7 days'
        AND m.mesure_le < $1::timestamptz - make_interval(mins => greatest($2::int, t.cadence_minutes))
        AND m.erreur IS NULL AND m.code_http = t.code_attendu
      GROUP BY m.probe_id, m.target_id`, [maintenant, SEUILS.periodeMinutes])).rows;
  for (const m of mesures) { m.probe_id = Number(m.probe_id); m.target_id = Number(m.target_id); m.debit_bps = m.debit_bps === null ? null : Number(m.debit_bps); }
  for (const h of habitudes) { h.probe_id = Number(h.probe_id); h.target_id = Number(h.target_id); h.debit_bps = h.debit_bps === null ? null : Number(h.debit_bps); h.ttfb_ms = h.ttfb_ms === null ? null : Number(h.ttfb_ms); }
  for (const x of [...cibles, ...sondes]) x.id = Number(x.id);
  return { cibles, sondes, mesures, habitudes };
}

module.exports = { SEUILS, calculer, listerSondes, lire, lireSondes, mediane };
