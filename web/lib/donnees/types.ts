/**
 * Les etats qu'un service peut avoir pour une sonde ou dans un verdict.
 * Ils viennent de l'API ; l'interface ne les calcule jamais (decision 0001, principe directeur).
 */
export type Etat =
  "normal" | "degrade" | "service" | "indetermine" | "pas-de-donnee";

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
    periode: string;
    repere: "normal" | "degrade" | "exclu";
  };
};
