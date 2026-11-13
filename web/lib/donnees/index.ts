import {
  CIBLES_EXEMPLE,
  detailExemple,
  INCIDENTS_EXEMPLE,
  MAINTENANT_EXEMPLE,
  NAVIGATEUR_EXEMPLE,
  PUBLICATIONS_EXEMPLE,
  RESUMES_EXEMPLE,
  SONDES_EXEMPLE,
  VERDICTS_EXEMPLE,
} from "./exemple";
import {
  estReponseServices,
  detailDepuisApi,
  estDetail,
  estReponsePublications,
  estReponseSondes,
  estReponseVerdicts,
  publicationDepuisApi,
  resumeDepuisApi,
  sondesDepuisApi,
  verdictDepuisApi,
} from "./api";
import type {
  Cible,
  DetailService,
  Incident,
  Lecture,
  MesureNavigateur,
  NomSource,
  Publication,
  ResumeService,
  Sonde,
  Verdict,
} from "./types";

/**
 * Point d'entree unique vers les donnees (decision 0001, D5).
 * Les pages appellent ces fonctions et ne savent jamais d'ou viennent les donnees ;
 * la Lecture renvoyee leur dit seulement quoi afficher a ce sujet.
 */

/** Une page mise en cache est regeneree au plus tot 60 s apres (decision 0002, D14). */
export const FRAICHEUR_SECONDES = 60;

/** Lit YITERE_SOURCE. Sans valeur : la source d'exemple. Valeur inconnue : erreur, jamais de devinette. */
export function choisirSource(
  valeur: string | undefined = process.env.YITERE_SOURCE,
): NomSource {
  if (valeur === undefined || valeur === "" || valeur === "exemple")
    return "exemple";
  if (valeur === "api") return "api";
  throw new Error(
    `YITERE_SOURCE vaut « ${valeur} » : les sources connues sont « exemple » et « api ».`,
  );
}

/** Adresse du serveur de Cellou, par exemple http://127.0.0.1:8787 sur la meme machine. */
function adresseApi(): string {
  const adresse = process.env.YITERE_API_URL;
  if (!adresse)
    throw new Error("YITERE_SOURCE vaut « api » mais YITERE_API_URL est vide.");
  return adresse.replace(/\/$/, "");
}

/** Forme exacte de la reponse de GET /api/v1/cibles (serveur/api.js). */
type CibleApi = {
  cle: string;
  nom: string;
  famille: string;
  url: string;
  methode: string;
  cadence_minutes: number;
  taille_attendue: number | string | null;
  code_attendu: number;
};

/** GET sur l'API, garde FRAICHEUR_SECONDES ; une reponse qui n'a pas la forme attendue est une erreur. */
async function lireApi<T>(
  chemin: string,
  forme: (corps: unknown) => corps is T,
): Promise<T> {
  const reponse = await fetch(`${adresseApi()}${chemin}`, {
    next: { revalidate: FRAICHEUR_SECONDES },
  });
  if (!reponse.ok) throw new Error(`GET ${chemin} a repondu ${reponse.status}`);
  const corps: unknown = await reponse.json();
  if (!forme(corps)) throw new Error(`GET ${chemin} : reponse inattendue`);
  return corps;
}

export async function lireCibles(
  source: NomSource = choisirSource(),
): Promise<Lecture<Cible[]>> {
  switch (source) {
    case "exemple":
      return { donnees: CIBLES_EXEMPLE, source, lueLe: null };
    case "api": {
      const corps = await lireApi("/api/v1/cibles", estListeDeCibles);
      return {
        donnees: corps.cibles.map(depuisApi),
        source,
        lueLe: new Date().toISOString(),
      };
    }
  }
}

/** Les verdicts : calcules par l'API a la lecture ; l'heure affichee est celle du calcul. */
export async function lireVerdicts(
  source: NomSource = choisirSource(),
): Promise<Lecture<Verdict[]>> {
  if (source === "exemple") return exemple(VERDICTS_EXEMPLE);
  const corps = await lireApi("/api/v1/verdicts", estReponseVerdicts);
  return {
    donnees: corps.verdicts.map(verdictDepuisApi),
    source,
    lueLe: corps.calcule_le,
  };
}

/** Le tableau des services : ses chiffres de la derniere heure viennent des memes verdicts. */
export async function lireResumes(
  source: NomSource = choisirSource(),
): Promise<Lecture<ResumeService[]>> {
  if (source === "exemple") return exemple(RESUMES_EXEMPLE);
  const corps = await lireApi("/api/v1/services", estReponseServices);
  return {
    donnees: corps.services.map(resumeDepuisApi),
    source,
    lueLe: corps.calcule_le,
  };
}

/** Les sondes, et leur etat pour chaque service, lu dans les preuves des verdicts. */
export async function lireSondes(
  source: NomSource = choisirSource(),
): Promise<Lecture<Sonde[]>> {
  if (source === "exemple") return exemple(SONDES_EXEMPLE);
  const [sondes, verdicts] = await Promise.all([
    lireApi("/api/v1/sondes", estReponseSondes),
    lireApi("/api/v1/verdicts", estReponseVerdicts),
  ]);
  return {
    donnees: sondesDepuisApi(sondes.sondes, verdicts.verdicts),
    source,
    lueLe: verdicts.calcule_le,
  };
}

/*
 * Les routes suivantes ne sont pas encore servies par l'API (decision 0001, D4) :
 * quelle que soit la source demandee, ces lectures renvoient l'exemple, et le disent.
 * L'heure de lecture est celle de l'horloge d'exemple (17:00).
 */

const exemple = <T>(donnees: T): Lecture<T> => ({
  donnees,
  source: "exemple",
  lueLe: MAINTENANT_EXEMPLE,
});

/** Le detail d'un service, ou null s'il n'en a pas (cible de reference, cible inconnue). */
/** La fiche d'un service : courbes, bande habituelle, repere, ou part le temps. Null si la cle est inconnue. */
export async function lireDetail(
  cle: string,
  source: NomSource = choisirSource(),
): Promise<Lecture<DetailService | null>> {
  if (source === "exemple")
    return exemple(
      VERDICTS_EXEMPLE.some((v) => v.cible.cle === cle)
        ? detailExemple(cle)
        : null,
    );
  const reponse = await fetch(
    `${adresseApi()}/api/v1/services/${encodeURIComponent(cle)}`,
    { next: { revalidate: FRAICHEUR_SECONDES } },
  );
  if (reponse.status === 404)
    return { donnees: null, source, lueLe: new Date().toISOString() };
  if (!reponse.ok)
    throw new Error(`GET /api/v1/services/${cle} a repondu ${reponse.status}`);
  const corps: unknown = await reponse.json();
  if (!estDetail(corps))
    throw new Error(`GET /api/v1/services/${cle} : reponse inattendue`);
  return { donnees: detailDepuisApi(corps), source, lueLe: corps.calcule_le };
}

/**
 * La frise des incidents. L'API n'a pas encore de route : avec elle, la frise reste vide
 * plutot que de montrer des incidents d'exemple a cote des vraies mesures.
 */
export async function lireIncidents(
  source: NomSource = choisirSource(),
): Promise<Lecture<Incident[]>> {
  if (source === "exemple") return exemple(INCIDENTS_EXEMPLE);
  return { donnees: [], source, lueLe: new Date().toISOString() };
}

/**
 * Les mesures faites depuis un navigateur. La page Mesurer garde ses resultats dans le
 * navigateur de la personne : le serveur n'en recoit aucune. Avec l'API, il n'y en a donc
 * aucune a montrer, et c'est la verite, pas un exemple.
 */
export async function lireMesuresNavigateur(
  source: NomSource = choisirSource(),
): Promise<Lecture<MesureNavigateur[]>> {
  if (source === "exemple") return exemple(NAVIGATEUR_EXEMPLE);
  return { donnees: [], source, lueLe: new Date().toISOString() };
}

/**
 * Les publications : en lecture seule tant que la connexion GitHub n'existe pas.
 * La route en renvoie 50 au plus, toutes cibles confondues ; les pages filtrent par cible.
 */
export async function lirePublications(
  source: NomSource = choisirSource(),
): Promise<Lecture<Publication[]>> {
  if (source === "exemple") return exemple(PUBLICATIONS_EXEMPLE);
  const corps = await lireApi("/api/v1/publications", estReponsePublications);
  return {
    donnees: corps.publications.map(publicationDepuisApi),
    source,
    lueLe: new Date().toISOString(),
  };
}

/**
 * Publier, confirmer, repondre : ouvert seulement dans la demonstration d'exemple.
 * Avec l'API, il faut la connexion GitHub, prevue apres le 23 novembre.
 */
export function ecritureOuverte(publications: Lecture<Publication[]>): boolean {
  return publications.source === "exemple";
}

/**
 * Vrai tant qu'au moins une lecture du site renvoie l'exemple : l'en-tete affiche alors
 * le badge « Donnees d'exemple » sur toutes les pages (directive de Cellou).
 */
export async function siteEnExemple(): Promise<boolean> {
  const lectures = await Promise.all([
    lireCibles(),
    lireVerdicts(),
    lireResumes(),
    lireSondes(),
    lirePublications(),
  ]);
  return lectures.some((l) => l.source === "exemple");
}

/** Les cibles de reference servent au calcul, pas aux developpeurs : on ne les liste pas. */
export function estService(cible: Pick<Cible, "famille">): boolean {
  return cible.famille !== "Reference";
}

function estListeDeCibles(corps: unknown): corps is { cibles: CibleApi[] } {
  if (typeof corps !== "object" || corps === null) return false;
  const cibles = (corps as { cibles?: unknown }).cibles;
  return (
    Array.isArray(cibles) &&
    cibles.every(
      (c) =>
        typeof c === "object" &&
        c !== null &&
        typeof c.cle === "string" &&
        typeof c.nom === "string" &&
        typeof c.famille === "string",
    )
  );
}

function depuisApi(c: CibleApi): Cible {
  return {
    cle: c.cle,
    nom: c.nom,
    famille: c.famille,
    url: c.url,
    methode: c.methode,
    cadenceMinutes: c.cadence_minutes,
    // pg renvoie les bigint sous forme de texte.
    tailleAttendue:
      c.taille_attendue === null ? null : Number(c.taille_attendue),
    codeAttendu: c.code_attendu,
  };
}
