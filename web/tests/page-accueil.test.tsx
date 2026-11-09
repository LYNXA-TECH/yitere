import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Accueil from "@/app/[langue]/page";

const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });

describe("accueil", () => {
  it("affiche YITERE en titre principal", async () => {
    const html = renderToStaticMarkup(await Accueil(params({ langue: "fr" })));
    expect(html).toMatch(/<h1[^>]*>YITERE<\/h1>/);
  });

  it("montre le badge « Données d'exemple » avec les verdicts d'exemple (directive de Cellou)", async () => {
    expect(
      renderToStaticMarkup(await Accueil(params({ langue: "fr" }))),
    ).toContain('data-source="exemple"');
    expect(
      renderToStaticMarkup(await Accueil(params({ langue: "en" }))),
    ).toContain("Sample data");
  });

  it("ne liste en ce moment que les services dégradés", async () => {
    const html = renderToStaticMarkup(await Accueil(params({ langue: "fr" })));
    expect(html).toContain('href="/fr/services/npm"');
    expect(html).toContain('href="/fr/services/docker"');
    expect(html).not.toContain('href="/fr/services/pypi"');
  });

  it("refuse une langue que le site ne parle pas", async () => {
    await expect(Accueil(params({ langue: "de" }))).rejects.toThrow();
  });
});
