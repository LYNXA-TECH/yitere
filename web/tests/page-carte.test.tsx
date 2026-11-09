import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Carte from "@/app/[langue]/carte/page";

const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });

describe("carte", () => {
  it("dessine la carte et donne la même information en tableau", async () => {
    const html = renderToStaticMarkup(await Carte(params({ langue: "fr" })));
    expect(html).toContain('role="img"');
    expect(html).toContain('<th scope="row">Conakry</th>');
    expect(html).toContain("Madrid *");
  });
});
