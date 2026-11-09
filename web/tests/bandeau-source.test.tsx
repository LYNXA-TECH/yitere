import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BandeauSource } from "@/components/BandeauSource";
import type { Lecture } from "@/lib/donnees/types";
import { dictionnaire } from "@/lib/i18n";

const t = dictionnaire("fr").source;
const exemple: Lecture<unknown> = {
  donnees: [],
  source: "exemple",
  lueLe: null,
};
const api = (lueLe: string): Lecture<unknown> => ({
  donnees: [],
  source: "api",
  lueLe,
});

const rendu = (lectures: Lecture<unknown>[]) =>
  renderToStaticMarkup(<BandeauSource lectures={lectures} textes={t} />);

describe("BandeauSource", () => {
  it("affiche le badge « Données d'exemple » sur des données d'exemple", () => {
    expect(rendu([exemple])).toContain("Données d&#x27;exemple");
  });

  it("affiche le badge dès qu'une seule lecture de la page est un exemple", () => {
    expect(rendu([api("2026-11-03T14:10:00Z"), exemple])).toContain(
      'data-source="exemple"',
    );
  });

  it("sans exemple, affiche l'heure de la lecture la plus ancienne et aucun badge", () => {
    const html = rendu([
      api("2026-11-03T14:12:00Z"),
      api("2026-11-03T14:10:00Z"),
    ]);
    expect(html).toContain("Données lues à 14:10 GMT");
    expect(html).not.toContain("exemple");
  });
});
