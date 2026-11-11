import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Accueil from "@/app/[langue]/page";

const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
const rendu = async (langue: string) =>
  renderToStaticMarkup(await Accueil(params({ langue })));

describe("accueil : la carte", () => {
  it("pose la question de YITERE en titre principal, dans les deux langues", async () => {
    expect(await rendu("fr")).toContain(
      ">Ma connexion, mon opérateur, ou le service ?</h1>",
    );
    expect(await rendu("en")).toContain(
      ">My connection, my operator, or the service?</h1>",
    );
  });

  it("place les villes des sondes sur la carte, sans JavaScript", async () => {
    const html = await rendu("fr");
    expect(html).toContain(">Conakry</text>");
    expect(html).toContain(">Abidjan</text>");
  });

  it("liste en ce moment ce qui n'est pas normal, et rien d'autre", async () => {
    const html = await rendu("fr");
    expect(html).toContain('href="#service-npm"');
    expect(html).toContain('href="#service-docker"');
    expect(html).toContain('href="#service-jsdelivr-min"');
    expect(html).not.toContain('href="#service-pypi"');
  });

  it("pose sur la frise les incidents, publications et mesures navigateur de l'exemple", async () => {
    const html = await rendu("fr");
    expect(html).toMatch(/data-teinte="degrade" style=/);
    expect(html).toContain('data-nature="publication"');
    expect(html).toContain('data-nature="navigateur"');
  });

  it("refuse une langue que le site ne parle pas", async () => {
    await expect(Accueil(params({ langue: "de" }))).rejects.toThrow();
  });
});
