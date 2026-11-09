import { describe, expect, it } from "vitest";
import { lireSondes, lireVerdicts } from "@/lib/donnees";
import { resumerVilles } from "@/lib/donnees/villes";
import { VILLES } from "@/lib/geo/villes";
import { projeter } from "@/lib/geo/projection";

describe("resumerVilles", () => {
  it("compte les sondes par ville et rapproche les verdicts qui nomment la ville", async () => {
    const villes = resumerVilles(
      (await lireSondes()).donnees,
      (await lireVerdicts()).donnees,
    );
    const conakry = villes.find((v) => v.ville === "Conakry");
    expect(conakry).toMatchObject({ sondes: 3, enRodage: 0, pays: "GN" });
    expect(conakry?.verdicts.map((c) => c.cle)).toEqual(["npm"]);
    expect(villes.find((v) => v.ville === "Dakar")).toMatchObject({
      enRodage: 1,
      verdicts: [],
    });
    expect(villes.find((v) => v.ville === "Madrid")?.repere).toBe(true);
  });
});

describe("projection", () => {
  it("place les villes africaines dans le cadre, et laisse Madrid dehors", () => {
    for (const nom of [
      "Conakry",
      "Le Caire",
      "Johannesburg",
      "Dakar",
      "Addis-Abeba",
    ]) {
      const v = VILLES[nom];
      expect(v && projeter(v.lat, v.lon), nom).not.toBeNull();
    }
    const madrid = VILLES.Madrid;
    expect(madrid && projeter(madrid.lat, madrid.lon)).toBeNull();
  });
});
