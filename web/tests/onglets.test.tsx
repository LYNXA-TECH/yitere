import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OngletsMobiles } from "@/components/NavigationPrincipale";
import { dictionnaire } from "@/lib/i18n";
import { lien, ONGLETS_MOBILES } from "@/lib/navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/fr/moi" }));

describe("onglets du bas, sur telephone", () => {
  it("chaque onglet a son icone au-dessus de son nom", () => {
    const t = dictionnaire("fr");
    const html = renderToStaticMarkup(
      <OngletsMobiles
        langue="fr"
        libelle={t.navigation.mobile}
        onglets={ONGLETS_MOBILES.map(({ cle, chemin }) => ({
          cle,
          href: lien("fr", chemin),
          texte: t.navigation[cle],
        }))}
      />,
    );
    const onglets = html.match(/<a [^>]*>.*?<\/a>/g) ?? [];
    expect(onglets).toHaveLength(5);
    for (const o of onglets) {
      expect(o).toMatch(/<svg[^>]*aria-hidden="true"[^>]*>.*<(path|circle)/);
    }
    expect(html).toMatch(/<a aria-current="page" href="\/fr\/moi"><svg/);
  });
});
