import { describe, expect, it } from "vitest";
import { positionVille } from "@/lib/geo/position";
import { projeter } from "@/lib/geo/projection";
import { coordonneesVille, nomVille } from "@/lib/geo/villes";

describe("placer une ville sur la carte", () => {
  it("retrouve une ville quelle que soit son ecriture", () => {
    const labe = coordonneesVille("Labé");
    expect(labe).not.toBeNull();
    expect(coordonneesVille("labe")).toEqual(labe);
    expect(coordonneesVille("  LABÉ ")).toEqual(labe);
    expect(coordonneesVille("nzerekore")).toEqual(
      coordonneesVille("Nzérékoré"),
    );
  });

  it("connait les villes secondaires, pas seulement les capitales", () => {
    for (const ville of ["Kankan", "Kindia", "Bo", "Bouaké", "Thiès", "Kumasi"])
      expect(positionVille(ville, "")).not.toBeNull();
  });

  it("une ville inconnue se place au centre de son pays, plutot que de disparaitre", () => {
    const p = positionVille("Dabola", "GN");
    expect(p).not.toBeNull();
    // Le centre de la Guinee, entre 7 et 13 degres nord et 15 et 7 degres ouest.
    const no = projeter(13, -15)!;
    const se = projeter(7, -7)!;
    expect(p!.x).toBeGreaterThan(no.x);
    expect(p!.x).toBeLessThan(se.x);
    expect(p!.y).toBeGreaterThan(no.y);
    expect(p!.y).toBeLessThan(se.y);
  });

  it("hors du cadre ou sans pays connu : pas de position", () => {
    expect(positionVille("Madrid", "ES")).toBeNull();
    expect(positionVille("Inconnue", "")).toBeNull();
  });

  it("affiche le nom bien ecrit d'une ville connue, et laisse les autres tels quels", () => {
    expect(nomVille("labe")).toBe("Labé");
    expect(nomVille(" kankan ")).toBe("Kankan");
    expect(nomVille("Dabola")).toBe("Dabola");
  });
});
