import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Accueil from "@/app/[langue]/page";
import FicheService from "@/app/[langue]/services/[cle]/page";
import Services from "@/app/[langue]/services/page";
import { EnTete } from "@/components/EnTete";
import { lireVerdicts } from "@/lib/donnees";
import { dictionnaire, MARQUE_FRANCAIS } from "@/lib/i18n";

// Hors de Next.js, l'adresse courante n'existe pas : on la fixe.
vi.mock("next/navigation", () => ({ usePathname: () => "/en" }));

const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
const marque = MARQUE_FRANCAIS.trim();

/**
 * Decision 0002, D13 : l'accueil (la carte), la liste des services et la fiche d'un service
 * sont traduits pour le 15 novembre. Aucun de leurs textes ne doit retomber sur le francais.
 */
describe("pages traduites : aucune marque [FR] en anglais", () => {
  it("l'en-tete", () => {
    const html = renderToStaticMarkup(
      <EnTete langue="en" textes={dictionnaire("en")} exemple connexion />,
    );
    expect(html).not.toContain(marque);
  });

  it("l'accueil, la carte", async () => {
    const html = renderToStaticMarkup(await Accueil(params({ langue: "en" })));
    expect(html).not.toContain(marque);
  });

  it("la liste des services", async () => {
    const html = renderToStaticMarkup(await Services(params({ langue: "en" })));
    expect(html).not.toContain(marque);
  });

  it("la fiche de chaque service", async () => {
    for (const v of (await lireVerdicts()).donnees) {
      const html = renderToStaticMarkup(
        await FicheService(params({ langue: "en", cle: v.cible.cle })),
      );
      expect(html, v.cible.cle).not.toContain(marque);
    }
  });
});
