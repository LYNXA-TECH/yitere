import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FicheService, {
  generateStaticParams,
} from "@/app/[langue]/services/[cle]/page";
import Services from "@/app/[langue]/services/page";

const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });

describe("services", () => {
  it("liste les sept services, sans les deux cibles de référence", async () => {
    const html = renderToStaticMarkup(await Services(params({ langue: "fr" })));
    expect(html.match(/href="\/fr\/services\/[a-z-]+"/g)).toHaveLength(7);
    expect(html).not.toContain("ref-dns");
  });

  it("prépare une fiche par service à la compilation", async () => {
    const cles = (await generateStaticParams()).map((p) => p.cle);
    expect(cles).toContain("npm");
    expect(cles).not.toContain("ref-contenu");
  });
});

describe("fiche d'un service", () => {
  it("montre le verdict, et ce qui a marché pour les autres", async () => {
    const html = renderToStaticMarkup(
      await FicheService(params({ langue: "fr", cle: "npm" })),
    );
    expect(html).toContain("Cause probable : Opérateur A à Conakry");
    expect(html).toContain("npm install --prefer-offline");
    expect(html).toContain('data-source="exemple"');
  });

  it("explique le 401 attendu du registre Docker", async () => {
    const html = renderToStaticMarkup(
      await FicheService(params({ langue: "en", cle: "docker" })),
    );
    expect(html).toContain(
      "this registry&#x27;s normal answer without authentication",
    );
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
