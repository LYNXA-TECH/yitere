import type { Dictionnaire, Langue } from "@/lib/i18n";

type Rubrique = {
  cle: keyof Dictionnaire["navigation"];
  chemin: "" | `/${string}`;
};

/**
 * Les rubriques de l'en-tete et les onglets de la barre mobile, dans l'ordre de la maquette.
 * Chaque liste n'est ecrite qu'ici (decision 0002, D11).
 */
export const RUBRIQUES = [
  { cle: "carte", chemin: "" },
  { cle: "services", chemin: "/services" },
  { cle: "echanges", chemin: "/echanges" },
  { cle: "contribuer", chemin: "/contribuer" },
] as const satisfies readonly Rubrique[];

export const ONGLETS_MOBILES = [
  { cle: "carte", chemin: "" },
  { cle: "services", chemin: "/services" },
  { cle: "echanges", chemin: "/echanges" },
  { cle: "mesurer", chemin: "/mesurer" },
  { cle: "moi", chemin: "/moi" },
] as const satisfies readonly Rubrique[];

/** Adresse d'une page dans une langue : lien("en", "/services") donne « /en/services ». */
export function lien(langue: Langue, chemin = ""): string {
  return `/${langue}${chemin}`;
}
