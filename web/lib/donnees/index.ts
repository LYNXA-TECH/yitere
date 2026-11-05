import { VERDICTS_EXEMPLE } from "./exemple";
import type { Verdict } from "./types";

/**
 * Point d'entree unique vers les donnees (decision 0001, D5).
 * Les pages appellent ces fonctions et ne savent jamais d'ou viennent les donnees.
 */

export type NomSource = "exemple";

/** Lit YITERE_SOURCE. Sans valeur : la source d'exemple. Valeur inconnue : erreur, jamais de devinette. */
export function choisirSource(
  valeur: string | undefined = process.env.YITERE_SOURCE,
): NomSource {
  if (valeur === undefined || valeur === "" || valeur === "exemple")
    return "exemple";
  throw new Error(
    `YITERE_SOURCE vaut « ${valeur} » : seule la source « exemple » existe pour l'instant.`,
  );
}

export async function lireVerdicts(
  source: NomSource = choisirSource(),
): Promise<Verdict[]> {
  switch (source) {
    case "exemple":
      return VERDICTS_EXEMPLE;
  }
}
