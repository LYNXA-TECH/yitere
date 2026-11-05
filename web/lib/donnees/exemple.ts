import type { Verdict } from "./types";

/**
 * Donnees d'EXEMPLE, reprises de la maquette v3. Aucune n'est une mesure reelle.
 * Toute page qui les affiche montre le badge « Donnees d'exemple ».
 */
export const VERDICTS_EXEMPLE: Verdict[] = [
  {
    cible: { cle: "npm", nom: "registry.npmjs.org" },
    observation: { etat: "degrade", depuis: "2026-11-03T14:10:00Z" },
    hypothese: {
      cause: "operateur",
      operateur: "Opérateur A",
      ville: "Conakry",
    },
    preuves: {
      sondesTouchees: 2,
      sondesEpargnees: 2,
      sondesEnRodage: 1,
      mesures: 24,
      periode: "dernière heure",
      repere: "normal",
    },
  },
  {
    cible: { cle: "docker", nom: "registry-1.docker.io" },
    observation: { etat: "degrade", depuis: "2026-11-03T15:00:00Z" },
    hypothese: null,
    preuves: {
      sondesTouchees: 1,
      sondesEpargnees: 3,
      sondesEnRodage: 1,
      mesures: 24,
      periode: "dernière heure",
      repere: "normal",
    },
  },
  {
    cible: { cle: "jsdelivr-min", nom: "cdn.jsdelivr.net, petite requête" },
    observation: { etat: "pas-de-donnee", depuis: null },
    hypothese: null,
    preuves: {
      sondesTouchees: 0,
      sondesEpargnees: 0,
      sondesEnRodage: 1,
      mesures: 0,
      periode: "dernière heure",
      repere: "normal",
    },
  },
];
