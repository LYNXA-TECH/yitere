import { describe, expect, it } from "vitest";
import {
  regrouperProches,
  zoomPourSeparer,
} from "@/lib/affichage/regroupement";

const v = (nom: string, x: number, y: number, poids = 1) => ({
  nom,
  x,
  y,
  poids,
});
// A peu pres Conakry, Kindia et Labe dans le repere de la carte, puis Dakar.
const cky = v("Conakry", 63, 285, 3);
const kindia = v("Kindia", 71, 279);
const labe = v("Labé", 77, 267);
const dakar = v("Dakar", 25, 233);

describe("regrouper les villes trop proches a l'ecran", () => {
  it("a k = 1, les villes de Guinee forment un groupe, Dakar reste seule", () => {
    const g = regrouperProches([kindia, dakar, labe, cky], 1);
    expect(g.map((x) => [x.ancre.nom, x.membres.length])).toEqual([
      ["Conakry", 3],
      ["Dakar", 1],
    ]);
  });

  it("au zoom donne par zoomPourSeparer, chaque ville a sa pastille", () => {
    const [guinee] = regrouperProches([cky, kindia, labe], 1);
    const k = zoomPourSeparer(guinee!);
    expect(k).toBeGreaterThan(1);
    expect(regrouperProches([cky, kindia, labe], k + 0.01)).toHaveLength(3);
  });
});
