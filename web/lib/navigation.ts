import type { Dictionnaire, Langue } from "@/lib/i18n";

/**
 * Les rubriques du site, dans l'ordre d'affichage. L'en-tete et la barre
 * d'onglets mobile lisent ce seul tableau (decision 0002, D11).
 */
export const RUBRIQUES = [
  { cle: "carte", chemin: "/carte" },
  { cle: "services", chemin: "/services" },
  { cle: "echanges", chemin: "/echanges" },
  { cle: "methodologie", chemin: "/methodologie" },
  { cle: "contribuer", chemin: "/contribuer" },
] as const satisfies readonly {
  cle: keyof Dictionnaire["navigation"];
  chemin: `/${string}`;
}[];

/** Adresse d'une page dans une langue : lien("en", "/services") donne « /en/services ». */
export function lien(langue: Langue, chemin = ""): string {
  return `/${langue}${chemin}`;
}
