import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PastilleEtat } from "../components/PastilleEtat";
import type { Etat } from "../lib/donnees/types";

const LIBELLES: Record<Etat, string> = {
  normal: "Normal",
  degrade: "Dégradation observée",
  service: "Cause probable : le service",
  indetermine: "Cause indéterminée",
  "pas-de-donnee": "Pas de donnée",
};

describe("PastilleEtat", () => {
  for (const [etat, libelle] of Object.entries(LIBELLES) as [Etat, string][]) {
    it(`affiche le libellé « ${libelle} » pour l'état ${etat}`, () => {
      const html = renderToStaticMarkup(<PastilleEtat etat={etat} />);
      expect(html).toContain(libelle);
      expect(html).toContain(`data-etat="${etat}"`);
    });
  }

  it("ne transmet jamais l'état par la seule couleur : la forme du symbole change", () => {
    const formes = (Object.keys(LIBELLES) as Etat[]).map((etat) => {
      const html = renderToStaticMarkup(<PastilleEtat etat={etat} />);
      return html.match(/data-forme="([a-z-]+)"/)?.[1];
    });
    expect(new Set(formes).size).toBe(formes.length);
  });

  it("cache le symbole aux lecteurs d'écran, qui lisent le libellé", () => {
    const html = renderToStaticMarkup(<PastilleEtat etat="degrade" />);
    expect(html).toContain('aria-hidden="true"');
  });
});
