import type { Cible, Publication, Sonde, Verdict } from "./types";

/**
 * Donnees d'EXEMPLE, reprises de la maquette v3. Aucune n'est une mesure reelle.
 * Toute page qui les affiche montre le badge « Donnees d'exemple ».
 */

/** Copie conforme de db/seed.sql : un test verifie que les deux concordent. */
export const CIBLES_EXEMPLE: Cible[] = [
  cible(
    "github-api",
    "api.github.com",
    "Code",
    "https://api.github.com/",
    "entete",
    10,
    null,
    200,
  ),
  cible(
    "github-raw",
    "raw.githubusercontent.com",
    "Code",
    "https://raw.githubusercontent.com/LYNXA-TECH/yitere/main/README.md",
    "entete",
    10,
    null,
    200,
  ),
  cible(
    "npm",
    "registry.npmjs.org",
    "Registres",
    "https://registry.npmjs.org/",
    "entete",
    10,
    null,
    200,
  ),
  cible(
    "pypi",
    "pypi.org",
    "Registres",
    "https://pypi.org/simple/",
    "entete",
    10,
    null,
    200,
  ),
  cible(
    "docker",
    "registry-1.docker.io",
    "Registres",
    "https://registry-1.docker.io/v2/",
    "entete",
    10,
    null,
    401,
  ),
  cible(
    "jsdelivr-obj",
    "cdn.jsdelivr.net, objet temoin",
    "Diffusion",
    "https://cdn.jsdelivr.net/gh/LYNXA-TECH/yitere@10cb9d1/temoin.bin",
    "objet",
    180,
    262144,
    200,
  ),
  cible(
    "jsdelivr-min",
    "cdn.jsdelivr.net, petite requete",
    "Diffusion",
    "https://cdn.jsdelivr.net/npm/jquery@3.7.1/package.json",
    "entete",
    10,
    null,
    200,
  ),
  cible(
    "ref-dns",
    "Resolveur DNS public",
    "Reference",
    "dns://1.1.1.1/example.com",
    "dns",
    10,
    null,
    0,
  ),
  cible(
    "ref-contenu",
    "Point de contenu tres disponible",
    "Reference",
    "https://connectivity-check.gstatic.com/generate_204",
    "entete",
    10,
    null,
    204,
  ),
];

/** Un verdict par service mesure ; les deux cibles de reference n'en ont pas. */
export const VERDICTS_EXEMPLE: Verdict[] = [
  {
    cible: { cle: "npm", nom: "registry.npmjs.org" },
    observation: { etat: "degrade", depuis: "2026-11-03T14:10:00Z" },
    hypothese: {
      cause: "operateur",
      operateur: "Opérateur A",
      ville: "Conakry",
    },
    preuves: preuves({ sondesTouchees: 2, sondesEpargnees: 2 }),
  },
  {
    cible: { cle: "docker", nom: "registry-1.docker.io" },
    observation: { etat: "degrade", depuis: "2026-11-03T15:00:00Z" },
    hypothese: null,
    preuves: preuves({ sondesTouchees: 1, sondesEpargnees: 3 }),
  },
  {
    cible: { cle: "jsdelivr-min", nom: "cdn.jsdelivr.net, petite requete" },
    observation: { etat: "pas-de-donnee", depuis: null },
    hypothese: null,
    preuves: preuves({ sondesTouchees: 0, sondesEpargnees: 0, mesures: 0 }),
  },
  normal("github-api", "api.github.com"),
  normal("github-raw", "raw.githubusercontent.com"),
  normal("pypi", "pypi.org"),
  {
    ...normal("jsdelivr-obj", "cdn.jsdelivr.net, objet temoin"),
    preuves: preuves({ sondesEpargnees: 4, mesures: 4, periodeMinutes: 180 }),
  },
];

/** Cinq sondes en Afrique de l'Ouest et le repere de Madrid, coherents avec les verdicts ci-dessus. */
export const SONDES_EXEMPLE: Sonde[] = [
  sonde("kadi-gn", "GN", "Conakry", "Opérateur A"),
  sonde("sekou-gn", "GN", "Conakry", "Opérateur A"),
  sonde("aissa-gn", "GN", "Conakry", "Opérateur B"),
  sonde("yao-ci", "CI", "Abidjan", "Opérateur C"),
  { ...sonde("awa-sn", "SN", "Dakar", "Opérateur D"), enRodage: true },
  { ...sonde("repere-madrid", "ES", "Madrid", null), type: "datacenter" },
];

export const PUBLICATIONS_EXEMPLE: Publication[] = [
  {
    id: 1,
    cible: "npm",
    auteur: "kadi-gn",
    type: "contournement",
    contenu:
      "Chez l'opérateur A, les installations traînent l'après-midi. Réutiliser le cache local évite de retélécharger les paquets déjà présents.",
    commande: "npm install --prefer-offline",
    pays: "GN",
    votes: 7,
    creeLe: "2026-11-03T14:40:00Z",
  },
  {
    id: 2,
    cible: "docker",
    auteur: "yao-ci",
    type: "contournement",
    contenu:
      "Les téléchargements d'images coupent en milieu de couche. Un seul téléchargement à la fois est plus lent, mais il va au bout.",
    commande: "dockerd --max-concurrent-downloads 1",
    pays: "CI",
    votes: 4,
    creeLe: "2026-11-03T15:20:00Z",
  },
  {
    id: 3,
    cible: "pypi",
    auteur: "awa-sn",
    type: "demande",
    contenu:
      "pip install est très lent depuis Dakar depuis hier soir. Quelqu'un d'autre le constate-t-il ?",
    commande: null,
    pays: "SN",
    votes: 2,
    creeLe: "2026-11-03T09:05:00Z",
  },
];

function cible(
  cle: string,
  nom: string,
  famille: string,
  url: string,
  methode: string,
  cadenceMinutes: number,
  tailleAttendue: number | null,
  codeAttendu: number,
): Cible {
  return {
    cle,
    nom,
    famille,
    url,
    methode,
    cadenceMinutes,
    tailleAttendue,
    codeAttendu,
  };
}

function preuves(p: Partial<Verdict["preuves"]>): Verdict["preuves"] {
  return {
    sondesTouchees: 0,
    sondesEpargnees: 0,
    sondesEnRodage: 1,
    mesures: 24,
    periodeMinutes: 60,
    repere: "normal",
    ...p,
  };
}

function normal(cle: string, nom: string): Verdict {
  return {
    cible: { cle, nom },
    observation: { etat: "normal", depuis: null },
    hypothese: null,
    preuves: preuves({ sondesEpargnees: 4 }),
  };
}

function sonde(
  pseudonyme: string,
  pays: string,
  ville: string,
  operateur: string | null,
): Sonde {
  return { pseudonyme, pays, ville, operateur, type: "dev", enRodage: false };
}
