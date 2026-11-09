/**
 * Projection equirectangulaire de l'Afrique dans un repere SVG.
 * Un degre vaut 10 unites : simple, et suffisant a l'echelle d'un continent.
 * Doit rester identique a CADRE dans scripts/generer-carte.mjs.
 */
export const CADRE = {
  lonMin: -20,
  lonMax: 54,
  latMin: -35,
  latMax: 38,
  echelle: 10,
} as const;

export const LARGEUR = (CADRE.lonMax - CADRE.lonMin) * CADRE.echelle;
export const HAUTEUR = (CADRE.latMax - CADRE.latMin) * CADRE.echelle;

/** Position SVG d'un point, ou null s'il sort du cadre (Madrid, par exemple). */
export function projeter(
  lat: number,
  lon: number,
): { x: number; y: number } | null {
  if (lon < CADRE.lonMin || lon > CADRE.lonMax) return null;
  if (lat < CADRE.latMin || lat > CADRE.latMax) return null;
  return {
    x: Math.round((lon - CADRE.lonMin) * CADRE.echelle),
    y: Math.round((CADRE.latMax - lat) * CADRE.echelle),
  };
}
