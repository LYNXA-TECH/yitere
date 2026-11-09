/**
 * Ce que les mesures montrent pour un service, sans aucune interpretation.
 * La cause, elle, est une hypothese : elle vit dans le type Cause, jamais ici.
 * Ces etats viennent de l'API ; l'interface ne les calcule jamais (decision 0001, principe directeur).
 */
export type Etat = "normal" | "degrade" | "pas-de-donnee";

/** Les causes que les regles de la methodologie peuvent proposer (section 7). */
export type Cause = "service" | "operateur" | "connexion-locale";

/**
 * Un verdict sur un service, tel que l'interface l'attend de l'API.
 * Proposition de contrat : la route /api/v1/verdicts reste a definir avec Cellou.
 */
export type Verdict = {
  cible: { cle: string; nom: string };
  /** Ce que les mesures montrent, sans interpretation. */
  observation: { etat: Etat; depuis: string | null };
  /** La cause proposee par les regles, ou null quand les donnees ne suffisent pas. */
  hypothese: { cause: Cause; operateur?: string; ville?: string } | null;
  /** Ce sur quoi le verdict repose. */
  preuves: {
    sondesTouchees: number;
    sondesEpargnees: number;
    sondesEnRodage: number;
    mesures: number;
    /** Fenetre de calcul, en minutes : l'interface la traduit (« derniere heure », « last hour »). */
    periodeMinutes: number;
    repere: "normal" | "degrade" | "exclu";
  };
};

/** Une cible mesuree, telle que GET /api/v1/cibles la renvoie (table targets). */
export type Cible = {
  cle: string;
  nom: string;
  famille: string;
  url: string;
  methode: string;
  cadenceMinutes: number;
  tailleAttendue: number | null;
  codeAttendu: number;
};

/** Une sonde, sans son jeton ni rien qui identifie la personne qui l'heberge (table probes). */
export type Sonde = {
  pseudonyme: string;
  /** Code ISO 3166-1 alpha-2. */
  pays: string;
  ville: string | null;
  operateur: string | null;
  type: "dev" | "datacenter" | "navigateur";
  enRodage: boolean;
};

/** Une publication de la communaute : un contournement qui a marche, ou une demande (table posts). */
export type Publication = {
  id: number;
  /** Cle de la cible concernee. */
  cible: string;
  auteur: string;
  type: "contournement" | "demande";
  contenu: string;
  commande: string | null;
  pays: string | null;
  votes: number;
  creeLe: string;
};

export type NomSource = "exemple" | "api";

/**
 * Des donnees, et ce qu'il faut dire a leur sujet a l'ecran :
 * d'ou elles viennent, et quand elles ont ete lues (null pour l'exemple, qui n'est jamais « lu »).
 * Une page mise en cache affiche lueLe : le cache ne peut pas faire passer une vieille mesure pour fraiche.
 */
export type Lecture<T> = {
  donnees: T;
  source: NomSource;
  lueLe: string | null;
};
