import { en } from "./en";
import { fr, type Dictionnaire } from "./fr";
import type { Langue } from "./langues";
import type { Partielle } from "./partielle";

export {
  LANGUES,
  LANGUE_PAR_DEFAUT,
  estLangue,
  negocierLangue,
} from "./langues";
export type { Langue } from "./langues";
export type { Dictionnaire } from "./fr";
export type { Partielle } from "./partielle";

/** Marque visible devant un texte francais affiche faute de traduction. */
export const MARQUE_FRANCAIS = "[FR] ";

/** Complete une traduction avec le francais, marque, la ou elle est muette. */
export function completer<T extends object>(
  reference: T,
  traduction: Partielle<T> | undefined,
): T {
  const resultat: Record<string, unknown> = {};
  for (const [cle, francais] of Object.entries(reference)) {
    const traduit: unknown = (
      traduction as Record<string, unknown> | undefined
    )?.[cle];
    if (typeof francais === "object" && francais !== null) {
      resultat[cle] = completer(
        francais,
        traduit as Partielle<typeof francais>,
      );
    } else if (traduit !== undefined) {
      resultat[cle] = traduit;
    } else {
      resultat[cle] = marquer(francais);
    }
  }
  return resultat as T;
}

function marquer(texte: unknown): unknown {
  if (typeof texte === "string") return MARQUE_FRANCAIS + texte;
  if (typeof texte === "function")
    return (...valeurs: unknown[]) => MARQUE_FRANCAIS + texte(...valeurs);
  return texte;
}

// Calcules une seule fois, au chargement du module.
const DICTIONNAIRES: Record<Langue, Dictionnaire> = {
  fr,
  en: completer(fr, en),
};

export function dictionnaire(langue: Langue): Dictionnaire {
  return DICTIONNAIRES[langue];
}
