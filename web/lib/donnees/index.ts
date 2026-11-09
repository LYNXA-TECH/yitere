import {
  CIBLES_EXEMPLE,
  PUBLICATIONS_EXEMPLE,
  SONDES_EXEMPLE,
  VERDICTS_EXEMPLE,
} from "./exemple";
import type {
  Cible,
  Lecture,
  NomSource,
  Publication,
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

export async function lireCibles(
  source: NomSource = choisirSource(),
): Promise<Lecture<Cible[]>> {
  switch (source) {
    case "exemple":
      return { donnees: CIBLES_EXEMPLE, source, lueLe: null };
    case "api": {
      const reponse = await fetch(`${adresseApi()}/api/v1/cibles`, {
        next: { revalidate: FRAICHEUR_SECONDES },
      });
      if (!reponse.ok)
        throw new Error(`GET /api/v1/cibles a repondu ${reponse.status}`);
      const corps: unknown = await reponse.json();
      if (!estListeDeCibles(corps))
        throw new Error("GET /api/v1/cibles : reponse inattendue");
      return {
        donnees: corps.cibles.map(depuisApi),
        source,
        lueLe: new Date().toISOString(),
      };
    }
  }
}

/*
 * Les routes suivantes ne sont pas encore servies par l'API (decision 0001, D4) :
 * quelle que soit la source demandee, ces lectures renvoient l'exemple, et le disent.
 */

export async function lireVerdicts(): Promise<Lecture<Verdict[]>> {
  return { donnees: VERDICTS_EXEMPLE, source: "exemple", lueLe: null };
}

export async function lireSondes(): Promise<Lecture<Sonde[]>> {
  return { donnees: SONDES_EXEMPLE, source: "exemple", lueLe: null };
}

export async function lirePublications(): Promise<Lecture<Publication[]>> {
  return { donnees: PUBLICATIONS_EXEMPLE, source: "exemple", lueLe: null };
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
