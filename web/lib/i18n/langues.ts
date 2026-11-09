/** Les langues du site. La premiere est celle par defaut. */
export const LANGUES = ["fr", "en"] as const;
export type Langue = (typeof LANGUES)[number];
export const LANGUE_PAR_DEFAUT: Langue = "fr";

export function estLangue(valeur: string): valeur is Langue {
  return (LANGUES as readonly string[]).includes(valeur);
}

/**
 * Choisit la langue d'apres l'en-tete Accept-Language du navigateur,
 * par exemple « en-GB,en;q=0.9,fr;q=0.8 ». A defaut : le francais.
 */
export function negocierLangue(entete: string | null): Langue {
  if (!entete) return LANGUE_PAR_DEFAUT;
  const preferences = entete
    .split(",")
    .map((morceau) => {
      const [etiquette = "", ...parametres] = morceau.trim().split(";");
      const q = parametres.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const poids = q ? Number(q.slice(2)) : 1;
      return {
        langue: etiquette.split("-")[0]?.toLowerCase() ?? "",
        poids: Number.isFinite(poids) ? poids : 0,
      };
    })
    .filter((p) => p.poids > 0)
    .sort((a, b) => b.poids - a.poids);
  for (const { langue } of preferences) if (estLangue(langue)) return langue;
  return LANGUE_PAR_DEFAUT;
}
