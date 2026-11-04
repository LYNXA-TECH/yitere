/**
 * Les etats qu'un service peut avoir pour une sonde ou dans un verdict.
 * Ils viennent de l'API ; l'interface ne les calcule jamais (decision 0001, principe directeur).
 */
export type Etat =
  "normal" | "degrade" | "service" | "indetermine" | "pas-de-donnee";
