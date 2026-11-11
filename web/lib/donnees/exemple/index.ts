import type { Cible } from "../types";
import * as simulateur from "./simulateur";

/**
 * Donnees d'EXEMPLE : le jeu de la maquette v3, passe dans le simulateur qui joue le role
 * de l'API. Aucune n'est une mesure reelle. Toute page qui les affiche montre le badge
 * « Donnees d'exemple ».
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

export const VERDICTS_EXEMPLE = simulateur.CLES_EXEMPLE.map((cle) =>
  simulateur.verdict(cle),
);
export const RESUMES_EXEMPLE = simulateur.CLES_EXEMPLE.map(simulateur.resume);
export const SONDES_EXEMPLE = simulateur.sondes();
export const NAVIGATEUR_EXEMPLE = simulateur.mesuresNavigateur();
export const PUBLICATIONS_EXEMPLE = simulateur.publications();
export const INCIDENTS_EXEMPLE = simulateur.incidents();
export const detailExemple = simulateur.detail;
export const MAINTENANT_EXEMPLE = simulateur.CALCULE_LE;

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
