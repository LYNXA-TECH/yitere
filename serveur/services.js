// YITERE, tableau des services : la derniere heure et les dernieres 24 heures, par cible.
// Forme : ResumeService de web/lib/donnees/types.ts, en snake_case.
// Les valeurs de la derniere heure viennent du verdict, pour qu'un meme service ne
// montre jamais deux chiffres differents selon la page.
'use strict';
const verdicts = require('./verdicts.js');
const { reussie, valeurDe, estObjet, arrondi } = verdicts.outils;

const moyenne = (v) => v.reduce((a, b) => a + b, 0) / v.length;

/**
 * donnees : celles de verdicts.lire(), plus publications [{ target_id, type, n }].
 */
function resumer(donnees, maintenant = new Date()) {
  const { cibles, sondes, mesures, publications = [] } = donnees;
  const calcul = verdicts.calculer(donnees, maintenant);
  const verdictDe = new Map(calcul.verdicts.map((v) => [v.cle, v]));
  const typeDe = new Map(sondes.map((s) => [s.id, s.type]));

  const resumes = cibles.filter((c) => c.famille !== 'Reference').map((cible) => {
    const v = verdictDe.get(cible.cle);
    const d = estObjet(cible) ? 2 : 0;
    const touchees = v.preuves.sondes.filter((s) => s.statut === 'touchee');
    const epargnees = v.preuves.sondes.filter((s) => s.statut === 'epargnee');
    const toutes = v.preuves.sondes.map((s) => s.valeur);

    // Disponibilite sur 24 h : tous les passages des sondes developpeur, rodage compris.
    // C'est un comptage brut, pas un jugement : il n'a pas besoin de valeur habituelle.
    let passages = 0, aboutis = 0;
    const debutPeriode = new Date(maintenant - v.preuves.periode_minutes * 60e3);
    const duRepere = [];
    for (const m of mesures) {
      if (m.target_id !== cible.id) continue;
      if (typeDe.get(m.probe_id) === 'datacenter') {
        if (new Date(m.mesure_le) >= debutPeriode && reussie(m, cible)) duRepere.push(valeurDe(m, cible));
        continue;
      }
      passages++;
      if (reussie(m, cible)) aboutis++;
    }
    const compte = (type) => {
      const p = publications.find((x) => Number(x.target_id) === cible.id && x.type === type);
      return p ? Number(p.n) : 0;
    };
    return {
      cle: cible.cle,
      unite: estObjet(cible) ? 'mbps' : 'ms',
      valeur: touchees.length ? arrondi(moyenne(touchees.map((s) => s.valeur)), d)
        : toutes.length ? arrondi(verdicts.mediane(toutes), d) : null,
      valeur_autres: touchees.length && epargnees.length
        ? arrondi(moyenne(epargnees.map((s) => s.valeur)), d) : null,
      sondes_mesurees: toutes.length,
      disponibilite: passages ? arrondi(aboutis / passages, 4) : null,
      passages,
      solutions: compte('contournement'),
      demandes: compte('demande'),
      repere: duRepere.length ? arrondi(verdicts.mediane(duRepere), d) : null,
    };
  });
  return { calcule_le: calcul.calcule_le, services: resumes };
}

async function lire(db, maintenant = new Date()) {
  const donnees = await verdicts.lire(db, maintenant);
  donnees.publications = (await db.query(
    `SELECT target_id, type, count(*) AS n FROM posts
      WHERE NOT masque AND target_id IS NOT NULL GROUP BY target_id, type`)).rows;
  return donnees;
}

module.exports = { resumer, lire };
