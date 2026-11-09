import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Confidentialite from "@/app/[langue]/confidentialite/page";
import Contribuer from "@/app/[langue]/contribuer/page";
import HebergerSonde from "@/app/[langue]/contribuer/sonde/page";
import Donnees from "@/app/[langue]/donnees/page";
import DetailPublication from "@/app/[langue]/echanges/[id]/page";
import Echanges from "@/app/[langue]/echanges/page";
import Mesurer from "@/app/[langue]/mesurer/page";
import Methodologie from "@/app/[langue]/methodologie/page";
import MonEspace from "@/app/[langue]/moi/page";
import Publier from "@/app/[langue]/publier/page";

const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
const PAGES = {
  Echanges,
  Methodologie,
  Contribuer,
  HebergerSonde,
  Mesurer,
  Publier,
  MonEspace,
  Donnees,
  Confidentialite,
};

describe("pages en français seulement (décision 0002, D13)", () => {
  for (const [nom, Page] of Object.entries(PAGES)) {
    it(`${nom} prévient le visiteur anglophone, dans sa langue`, async () => {
      const html = renderToStaticMarkup(
        (await Page(params({ langue: "en" })))!,
      );
      expect(html).toContain("This page is only available in French for now.");
      expect(html).toContain('lang="fr"');
    });
  }

  it("ne préviennent rien en français", async () => {
    expect(
      renderToStaticMarkup(await Echanges(params({ langue: "fr" }))),
    ).not.toContain("only available in French");
  });
});

describe("contenu", () => {
  it("la méthodologie est lue dans docs/methodologie.md", async () => {
    const html = renderToStaticMarkup(
      await Methodologie(params({ langue: "fr" })),
    );
    expect(html).toContain("<h2>1. Ce que nous mesurons</h2>");
    expect(html).toContain("<table>");
  });

  it("une publication montre le contexte mesuré et qui l'a confirmée", async () => {
    const html = renderToStaticMarkup(
      await DetailPublication(params({ langue: "fr", id: "p1" })),
    );
    expect(html).toContain(
      "Ce que les sondes observaient quand elle a été publiée",
    );
    expect(html).toContain("A marché pour 5 personnes");
    expect(html).toContain("2 sur 2 dégradées");
  });

  it("la mesure navigateur laisse de côté le registre Docker", async () => {
    const html = renderToStaticMarkup(await Mesurer(params({ langue: "fr" })));
    expect(html).toContain("registry.npmjs.org");
    expect(html).not.toContain("registry-1.docker.io</span>");
  });

  it("contribuer montre les villes où une sonde manque", async () => {
    const html = renderToStaticMarkup(
      await Contribuer(params({ langue: "fr" })),
    );
    expect(html).toContain("Héberger la première sonde à Dakar");
  });

  it("la page sonde décrit la vraie commande, pas un paquet npm qui n'existe pas", async () => {
    const html = renderToStaticMarkup(
      await HebergerSonde(params({ langue: "fr" })),
    );
    expect(html).toContain("node sonde.js");
    expect(html).not.toContain("npx yitere-sonde");
  });
});
