import { describe, expect, it } from "vitest";
import { ecarterProches } from "@/lib/affichage/regroupement";

const v = (nom: string, x: number, y: number, poids = 1) => ({
  nom,
  x,
  y,
  poids,
});
// A peu pres Conakry, Freetown, Kindia et Dakar dans le repere de la carte.
const cky = v("Conakry", 63, 285, 3);
const freetown = v("Freetown", 68, 296);
const kindia = v("Kindia", 71, 279);
const dakar = v("Dakar", 25, 233, 5);

const place = (
  d: Map<string, { dx: number; dy: number }>,
  x: { nom: string; x: number; y: number },
  k: number,
) => ({
  x: (x.x + d.get(x.nom)!.dx) * k,
  y: (x.y + d.get(x.nom)!.dy) * k,
});

describe("chaque ville garde sa pastille, sans recouvrir sa voisine", () => {
  it("a k = 1, Dakar et Conakry restent a leur place, Freetown et Kindia s'ecartent un peu", () => {
    const d = ecarterProches([freetown, cky, kindia, dakar], 1);
    expect(d.get("Conakry")).toEqual({ dx: 0, dy: 0 });
    expect(d.get("Dakar")).toEqual({ dx: 0, dy: 0 });
    // Juste assez pour ne plus se recouvrir, pas a l'autre bout de la carte.
    for (const n of ["Freetown", "Kindia"]) {
      const { dx, dy } = d.get(n)!;
      expect(Math.hypot(dx, dy)).toBeGreaterThan(0);
      expect(Math.hypot(dx, dy)).toBeLessThan(80);
    }
    // Plus aucune pastille ne touche une autre, ni le nom de sa voisine de gauche.
    const v4 = [cky, freetown, kindia, dakar];
    const p = v4.map((x) => ({ nom: x.nom, ...place(d, x, 1) }));
    for (let i = 0; i < p.length; i++)
      for (let j = i + 1; j < p.length; j++) {
        const [a, b] = [p[i]!, p[j]!].sort((u, w) => u.x - w.x);
        const dx = b!.x - a!.x;
        const dy = Math.abs(a!.y - b!.y);
        expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(46);
        expect(dx >= 24 + a!.nom.length * 8.5 + 30 || dy >= 32).toBe(true);
      }
  });

  it("en zoomant assez, plus personne ne bouge", () => {
    const d = ecarterProches([cky, freetown, kindia], 12);
    for (const n of ["Conakry", "Freetown", "Kindia"])
      expect(d.get(n)).toEqual({ dx: 0, dy: 0 });
  });
});
