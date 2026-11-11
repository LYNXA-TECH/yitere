/**
 * Ce que les mesures montrent pour un service, sans aucune interpretation.
 * La cause, elle, est une hypothese : elle vit dans le type Cause, jamais ici.
 * Ces etats viennent de l'API ; l'interface ne les calcule jamais (decision 0001, principe directeur).
 */
export type Etat = "normal" | "degrade" | "pas-de-donnee";

/** Les causes que les regles de la methodologie peuvent proposer (section 7). */
export type Cause = "service" | "operateur" | "connexion-locale";

export type Unite = "ms" | "mbps";

/** Une sonde, designee comme a l'ecran : « Operateur A · Conakry · 1 ». */
export type SondeDesignee = {
  pseudonyme: string;
  /** Nom affiche de l'operateur (« Operateur A », « AS37461 »), ou null quand il n'est pas detecte. */
  operateur: string | null;
  ville: string;
  numero: number;
};

/** Ce qu'une sonde a mesure pour un service sur la periode du verdict. */
export type PreuveSonde = SondeDesignee & {
  statut: "touchee" | "epargnee";
  valeur: number;
  habituel: number;
  unite: Unite;
};

/**
 * Un verdict sur un service, tel que l'interface l'attend de l'API.
 * Contrat propose a Cellou : docs/CONTRAT-API-INTERFACE.md.
 */
export type Verdict = {
  cible: { cle: string; nom: string };
  /**
   * Ce que les mesures montrent, sans interpretation. depuis : debut de la degradation,
   * ou heure de la derniere mesure quand il n'y a plus de donnee.
   */
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
    /** Le detail sonde par sonde (touchees d'abord). */
    sondes: PreuveSonde[];
  };
};

/** Une ligne du tableau des services : la derniere heure et les dernieres 24 h. */
export type ResumeService = {
  cle: string;
  unite: Unite;
  /** Moyenne des sondes touchees s'il y en a, sinon mediane des sondes eligibles ; null sans donnee. */
  valeur: number | null;
  /** Moyenne des sondes epargnees, quand des sondes sont touchees. */
  valeurAutres: number | null;
  sondesMesurees: number;
  /** Part des passages aboutis sur 24 h, de 0 a 1. */
  disponibilite: number | null;
  passages: number;
  solutions: number;
  demandes: number;
  /** Ce que mesure le point de repere de Madrid : hors calcul, affiche a part. */
  repere: number | null;
};

/** Une courbe : une sonde, une valeur par pas (null : pas de mesure). */
export type Serie = {
  sonde: SondeDesignee;
  statut: "touchee" | "epargnee" | "rodage";
  points: (number | null)[];
};

/** La decomposition d'un passage : ou part le temps. */
export type Cascade = {
  sonde: SondeDesignee;
  statut: "touchee" | "epargnee";
  dns: number;
  connexion: number;
  tls: number;
  premierOctet: number;
};

/** Le detail d'un service pour sa fiche. */
export type DetailService = {
  cle: string;
  unite: Unite;
  /** Heure de fin de chaque pas, en ISO, du plus ancien au plus recent. */
  heures24: string[];
  heures7j: string[];
  series24: Serie[];
  series7j: Serie[];
  /** Valeurs habituelles des sondes eligibles : la bande grise. */
  habituel: { min: number; max: number };
  /** Index du premier pas degrade de l'incident en cours, s'il y en a un. */
  debutIncident24: number | null;
  repere: { valeur: number | null; etat: "normal" | "degrade" | "exclu" };
  cascades: Cascade[];
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
export type Sonde = SondeDesignee & {
  /** Code ISO 3166-1 alpha-2. */
  pays: string;
  type: "dev" | "repere" | "navigateur";
  enRodage: boolean;
  /** Etat de la sonde pour chaque cible, sur les 24 derniers pas (le dernier : maintenant). */
  etats: Record<string, ("normal" | "degrade" | "pas-de-donnee" | "absente")[]>;
};

/** Une periode de degradation ou d'absence de donnee, pour la frise des 24 dernieres heures. */
export type Incident = {
  /** Cle de la cible, ou null quand la sonde est touchee sur toutes (connexion locale). */
  cible: string | null;
  sondes: SondeDesignee[];
  nature: "degradation" | "absence";
  cause: Cause | null;
  debut: string;
  /** null : toujours en cours. */
  fin: string | null;
};

/** Une mesure ponctuelle faite depuis un navigateur : jamais comptee dans un verdict. */
export type MesureNavigateur = { ville: string; pays: string; le: string };

/** Une publication de la communaute : un contournement qui a marche, ou une demande (table posts). */
export type Publication = {
  id: string;
  /** Cle de la cible concernee. */
  cible: string;
  auteur: string;
  ville: string;
  pays: string;
  operateur: string | null;
  type: "contournement" | "demande";
  titre: string;
  contenu: string;
  commande: string | null;
  etiquettes: string[];
  votes: number;
  creeLe: string;
  /** L'incident observe au moment de la publication, joint automatiquement. */
  contexte: {
    cible: string;
    operateur: string;
    ville: string;
    enCours: boolean;
  } | null;
  confirmations: { ville: string; operateur: string | null; le: string }[];
  /** 3 confirmations dans 2 villes au moins (regle des echanges) : calcule par l'API. */
  confirmee: boolean;
  reponses: { auteur: string; ville: string; le: string; contenu: string }[];
  /** Demandes seulement. */
  demande: { ville: string; suivis: number; sondeSurPlace: boolean } | null;
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
