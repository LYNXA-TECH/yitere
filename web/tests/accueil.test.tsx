import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Accueil from "../app/page";

describe("page d'accueil", () => {
  it("affiche le nom YITERE dans un titre de niveau 1", () => {
    const html = renderToStaticMarkup(<Accueil />);
    expect(html).toContain("<h1>YITERE</h1>");
  });
});
