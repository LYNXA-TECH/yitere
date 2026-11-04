import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { choisirSource, lireVerdicts } from "../lib/donnees";

describe("choix de la source de données", () => {
  it("prend la source « exemple » quand YITERE_SOURCE n'est pas définie", () => {
    expect(choisirSource(undefined)).toBe("exemple");
  });

  it("accepte « exemple » écrit explicitement", () => {
    expect(choisirSource("exemple")).toBe("exemple");
  });

  it("refuse une valeur inconnue au lieu de deviner", () => {
    expect(() => choisirSource("production")).toThrow(/YITERE_SOURCE/);
  });
});

describe("source « exemple »", () => {
  it("renvoie les verdicts de la maquette : npm, Docker et jsDelivr", async () => {
    const verdicts = await lireVerdicts("exemple");
    expect(verdicts.map((v) => v.cible.cle)).toEqual([
      "npm",
      "docker",
      "jsdelivr-min",
    ]);
  });

  it("n'utilise que des cibles qui existent dans db/seed.sql", async () => {
    const seed = readFileSync(
      new URL("../../db/seed.sql", import.meta.url),
      "utf8",
    );
    for (const v of await lireVerdicts("exemple")) {
      expect(seed).toContain(`('${v.cible.cle}'`);
    }
  });
});
