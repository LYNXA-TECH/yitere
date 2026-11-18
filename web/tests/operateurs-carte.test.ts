import { describe, expect, it } from "vitest";
import { resumeOperateurs } from "@/lib/affichage/sondes";

const s = (operateur: string, repere = false) => ({ operateur, repere });

describe("operateurs d'une ville ou d'un pays, pour les info-bulles de la carte", () => {
  it("chaque operateur une fois, avec son nombre de sondes s'il en a plusieurs", () => {
    expect(resumeOperateurs([s("Orange"), s("MTN"), s("Orange")])).toEqual({
      texte: "Orange ×2, MTN",
      nombre: 2,
    });
  });

  it("le repere de Madrid n'est pas un operateur d'hote", () => {
    expect(resumeOperateurs([s("AS15169", true)])).toEqual({
      texte: "",
      nombre: 0,
    });
  });
});
