import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Contribuer from "@/app/[langue]/contribuer/page";
import Echanges from "@/app/[langue]/echanges/page";
import Methodologie from "@/app/[langue]/methodologie/page";

const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });

describe("pages en français seulement", () => {
  it("préviennent le visiteur anglophone, dans sa langue", async () => {
    for (const Page of [Echanges, Methodologie, Contribuer]) {
      const html = renderToStaticMarkup(await Page(params({ langue: "en" })));
      expect(html).toContain("This page is only available in French for now.");
      expect(html).toContain('lang="fr"');
    }
  });

  it("ne préviennent rien en français", async () => {
    const html = renderToStaticMarkup(await Echanges(params({ langue: "fr" })));
    expect(html).not.toContain("only available in French");
  });

  it("la méthodologie est lue dans docs/methodologie.md", async () => {
    const html = renderToStaticMarkup(
      await Methodologie(params({ langue: "fr" })),
    );
    expect(html).toContain("<h1>Méthodologie</h1>");
    expect(html).toContain("<table>");
  });

  it("contribuer explique comment lancer une sonde", async () => {
    const html = renderToStaticMarkup(
      await Contribuer(params({ langue: "fr" })),
    );
    expect(html).toContain("<h1");
    expect(html).toContain("node sonde.js --annonce");
  });
});
