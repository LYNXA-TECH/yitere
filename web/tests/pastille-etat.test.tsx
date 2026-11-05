import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PastilleEtat } from "../components/PastilleEtat";
import type { Etat } from "../lib/donnees/types";

const LIBELLES: Record<Etat, string> = {
  normal: "Normal",
  degrade: "Dégradation observée",
  "pas-de-donnee": "Pas de donnée",
};

// Verifie par le compilateur (npm run build, npx tsc --noEmit) : une cause n'est pas une observation.
// Si le type Etat acceptait encore ces valeurs, les directives @ts-expect-error seraient en trop et la
// verification des types echouerait.
export function causesRefusees() {
  return [
    // @ts-expect-error « service » est une cause (type Cause), pas un etat observe
    <PastilleEtat key="service" etat="service" />,
    // @ts-expect-error « indetermine » qualifie l'hypothese, pas la mesure
    <PastilleEtat key="indetermine" etat="indetermine" />,
  ];
}

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
