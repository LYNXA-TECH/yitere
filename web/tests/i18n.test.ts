import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import {
  completer,
  dictionnaire,
  MARQUE_FRANCAIS,
  negocierLangue,
  type Dictionnaire,
} from "@/lib/i18n";

describe("negocierLangue", () => {
  it("prend la première langue connue, dans l'ordre de préférence du navigateur", () => {
    expect(negocierLangue("en-GB,en;q=0.9,fr;q=0.8")).toBe("en");
    expect(negocierLangue("fr-GN,fr;q=0.9,en;q=0.8")).toBe("fr");
  });

  it("respecte les poids q, même dans le désordre", () => {
    expect(negocierLangue("fr;q=0.5,en;q=0.9")).toBe("en");
  });

  it("saute une langue que le site ne parle pas", () => {
    expect(negocierLangue("pt-BR,pt;q=0.9,en;q=0.5")).toBe("en");
  });

  it("prend le français sans en-tête, ou sans langue connue", () => {
    expect(negocierLangue(null)).toBe("fr");
    expect(negocierLangue("pt,ar")).toBe("fr");
  });
});

describe("repli sur le français", () => {
  const reference = { a: "un", b: { c: (n: number) => `${n} chose` } };

  it("garde la traduction quand elle existe", () => {
    expect(completer(reference, { a: "one" }).a).toBe("one");
  });

  it("affiche le français avec une marque visible quand la traduction manque", () => {
    const complet = completer(reference, {});
    expect(complet.a).toBe(`${MARQUE_FRANCAIS}un`);
    expect(complet.b.c(2)).toBe(`${MARQUE_FRANCAIS}2 chose`);
  });

  it("ne marque jamais le français lui-même", () => {
    expect(JSON.stringify(textes(dictionnaire("fr")))).not.toContain(
      MARQUE_FRANCAIS,
    );
  });
});

describe("pages traduites : carte, services, fiche (revue de Cellou, point 4)", () => {
  const sections: (keyof Dictionnaire)[] = [
    "site",
    "navigation",
    "source",
    "verdict",
    "services",
    "fiche",
    "carte",
    "publication",
    "pageEnFrancais",
  ];

  for (const section of sections) {
    it(`« ${section} » est entièrement traduite en anglais`, () => {
      expect(clesManquantes(dictionnaire("fr")[section], en[section])).toEqual(
        [],
      );
    });
  }
});

/** Les cles du francais que la traduction ne fournit pas, a toute profondeur. */
function clesManquantes(
  francais: unknown,
  anglais: unknown,
  chemin = "",
): string[] {
  if (typeof francais !== "object" || francais === null)
    return anglais === undefined ? [chemin] : [];
  return Object.entries(francais).flatMap(([cle, valeur]) =>
    clesManquantes(
      valeur,
      (anglais as Record<string, unknown> | undefined)?.[cle],
      `${chemin}.${cle}`,
    ),
  );
}

/** Tous les textes fixes d'une branche du dictionnaire. */
function textes(valeur: unknown): string[] {
  if (typeof valeur === "string") return [valeur];
  if (typeof valeur === "object" && valeur !== null)
    return Object.values(valeur).flatMap(textes);
  return [];
}
