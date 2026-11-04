import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Lit les couleurs declarees dans styles/variables.css : une seule source de verite.
const css = readFileSync(new URL("../styles/variables.css", import.meta.url), "utf8");

function couleur(nom: string): string {
  const trouve = css.match(new RegExp(`--${nom}:\\s*(#[0-9a-fA-F]{6})`));
  if (!trouve?.[1]) throw new Error(`Variable --${nom} absente de styles/variables.css`);
  return trouve[1];
}

// Luminance relative et rapport de contraste, selon la definition des WCAG 2.2.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (clair + 0.05) / (sombre + 0.05);
}

const FONDS = ["fond", "surface", "surface-haute"];
// Texte courant : 4,5:1 au moins sur chacun des trois fonds (WCAG 2.2, critere 1.4.3).
const TEXTES = ["texte", "texte-secondaire", "interaction", "etat-normal", "etat-degrade", "etat-service", "etat-indetermine"];

describe("contrastes de la direction artistique", () => {
  for (const texte of TEXTES) {
    for (const fond of FONDS) {
      it(`--${texte} sur --${fond} atteint 4,5:1`, () => {
        expect(contraste(couleur(texte), couleur(fond))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("le texte d'un bouton atteint 4,5:1 sur --interaction", () => {
    expect(contraste(couleur("interaction-texte"), couleur("interaction"))).toBeGreaterThanOrEqual(4.5);
  });

  // Indicateur de focus et texte discret (reserve aux grands textes) : 3:1 au moins (criteres 1.4.11 et 1.4.3).
  for (const fond of FONDS) {
    it(`--focus sur --${fond} atteint 3:1`, () => {
      expect(contraste(couleur("focus"), couleur(fond))).toBeGreaterThanOrEqual(3);
    });
    it(`--texte-discret sur --${fond} atteint 3:1`, () => {
      expect(contraste(couleur("texte-discret"), couleur(fond))).toBeGreaterThanOrEqual(3);
    });
  }
});
