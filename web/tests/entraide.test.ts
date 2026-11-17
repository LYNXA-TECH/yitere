import { describe, expect, it } from "vitest";
import type { VilleCarte } from "@/components/carte/types";
import { avecEntraide } from "@/lib/affichage/entraide";
import type { Publication, Sonde } from "@/lib/donnees/types";

const ville = (nom: string): VilleCarte => ({
  nom,
  pays: "",
  x: 0,
  y: 0,
  sondes: [],
  entraide: { solutions: 0, demandes: 0 },
});
const sonde = (ville: string, pays: string) => ({ ville, pays }) as Sonde;
const pub = (p: Partial<Publication>) =>
  ({ ville: "", pays: "", type: "contournement", ...p }) as Publication;

describe("entraide de chaque ville, pour l'info-bulle de la carte", () => {
  it("compte les publications rattachees a la ville", () => {
    const [cky, abj] = avecEntraide(
      [ville("Conakry"), ville("Abidjan")],
      [sonde("Conakry", "GN"), sonde("Abidjan", "CI")],
      [
        pub({ ville: "Conakry" }),
        pub({ ville: "Conakry" }),
        pub({ ville: "Conakry", type: "demande" }),
        pub({ ville: "Abidjan", type: "demande" }),
      ],
    );
    expect(cky?.entraide).toEqual({ solutions: 2, demandes: 1 });
    expect(abj?.entraide).toEqual({ solutions: 0, demandes: 1 });
  });

  it("sans ville (API), le pays suffit quand la ville est seule de son pays", () => {
    const [cky] = avecEntraide(
      [ville("Conakry")],
      [sonde("Conakry", "GN")],
      [pub({ pays: "GN" }), pub({ pays: "SN" })],
    );
    expect(cky?.entraide).toEqual({ solutions: 1, demandes: 0 });
  });

  it("deux villes dans le meme pays : on ne devine pas laquelle", () => {
    const villes = avecEntraide(
      [ville("Conakry"), ville("Kankan")],
      [sonde("Conakry", "GN"), sonde("Kankan", "GN")],
      [pub({ pays: "GN" })],
    );
    expect(villes.map((v) => v.entraide.solutions)).toEqual([0, 0]);
  });
});
