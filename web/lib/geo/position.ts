import { PAYS_AFRIQUE } from "./afrique";
import { projeter } from "./projection";
import { coordonneesVille } from "./villes";

/** Le centre d'un pays dans le repere SVG : la moyenne des points de son contour. */
const CENTRES = new Map<string, { x: number; y: number }>();
for (const { iso, d } of PAYS_AFRIQUE) {
  const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (n.length < 2 || CENTRES.has(iso)) continue;
  let x = 0;
  let y = 0;
  for (let i = 0; i + 1 < n.length; i += 2) {
    x += n[i]!;
    y += n[i + 1]!;
  }
  const points = Math.floor(n.length / 2);
  CENTRES.set(iso, { x: Math.round(x / points), y: Math.round(y / points) });
}

/**
 * Ou poser une ville sur la carte : ses coordonnees si on les connait, sinon le centre
 * de son pays, pour qu'une sonde dans une ville inconnue reste visible. null hors du
 * cadre (Madrid) ou sans pays connu.
 */
export function positionVille(
  ville: string,
  pays: string,
): { x: number; y: number } | null {
  const c = coordonneesVille(ville);
  if (c) return projeter(c.lat, c.lon);
  return CENTRES.get(pays) ?? null;
}
