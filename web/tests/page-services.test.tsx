import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FicheService, {
  generateStaticParams,
} from "@/app/[langue]/services/[cle]/page";
import Services from "@/app/[langue]/services/page";

const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });

describe("services", () => {
  it("met en tête ce qui demande l'attention : deux dégradations et une absence de donnée", async () => {
    const html = renderToStaticMarkup(await Services(params({ langue: "fr" })));
    expect(html).toContain(
      "2 dégradations observées · 4 mesures normales · 1 sans donnée récente",
    );
    // une sonde en rodage mesure ce service : on dit « En rodage », pas « Pas de donnée depuis 15:20 »
    expect(html).toContain("En rodage");
    expect(html).toContain(
      "1 sonde mesure ce service, mais elle est encore en rodage",
    );
    expect(html).not.toContain("Pas de donnée depuis 15:20");
  });

  it("donne les mêmes chiffres que la maquette, en français et en anglais", async () => {
    expect(
      renderToStaticMarkup(await Services(params({ langue: "fr" }))),
    ).toContain("1 222 ms");
    expect(
      renderToStaticMarkup(await Services(params({ langue: "en" }))),
    ).toContain("1,222 ms");
  });

  it("ne liste pas les cibles de référence", async () => {
    expect(
      renderToStaticMarkup(await Services(params({ langue: "fr" }))),
    ).not.toContain("ref-dns");
  });

  it("prépare une fiche par service à la compilation", async () => {
    const cles = (await generateStaticParams()).map((p) => p.cle);
    expect(cles).toContain("npm");
    expect(cles).not.toContain("ref-contenu");
  });
});

describe("fiche d'un service", () => {
  it("sépare l'observé, l'hypothèse et les preuves sonde par sonde", async () => {
    const html = renderToStaticMarkup(
      await FicheService(params({ langue: "fr", cle: "npm" })),
    );
    expect(html).toContain("Dégradation depuis 14:10");
    expect(html).toContain("Cause probable : Opérateur A à Conakry");
    expect(html).toContain(
      "Opérateur A · Conakry · 1 : 1 257 ms (habituel 330 ms)",
    );
  });

  it("met juste sous le diagnostic ce qui a marché, avec la commande", async () => {
    const html = renderToStaticMarkup(
      await FicheService(params({ langue: "fr", cle: "npm" })),
    );
    expect(html).toContain("npm config set fetch-retry-maxtimeout 120000");
    expect(html.indexOf("Allonger le délai")).toBeLessThan(
      html.indexOf("Réutiliser le cache local"),
    );
  });

  it("dit en anglais pourquoi Docker reste sans cause", async () => {
    const html = renderToStaticMarkup(
      await FicheService(params({ langue: "en", cle: "docker" })),
    );
    expect(html).toContain("Undetermined cause: not enough data");
    expect(html).toContain("expected code 401");
  });

  it("donne une page 404 pour un service inconnu ou une cible de référence", async () => {
    await expect(
      FicheService(params({ langue: "fr", cle: "inconnu" })),
    ).rejects.toThrow();
    await expect(
      FicheService(params({ langue: "fr", cle: "ref-dns" })),
    ).rejects.toThrow();
  });
});
