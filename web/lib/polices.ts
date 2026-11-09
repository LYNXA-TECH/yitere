import localFont from "next/font/local";

/**
 * Geist et Geist Mono (Vercel, licence SIL OFL 1.1), servies par le site lui-meme :
 * aucune requete vers un service tiers. Une seule police variable par famille.
 * Le texte s'affiche d'abord dans la police du systeme, puis bascule (display: swap).
 */
export const geist = localFont({
  src: "../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--police-geist",
  weight: "100 900",
  display: "swap",
});

/** Chiffres et noms de services. Non prechargee : elle n'est pas necessaire au premier affichage. */
export const geistMono = localFont({
  src: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--police-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: false,
});
