import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EnTete } from "@/components/EnTete";
import { dictionnaire } from "@/lib/i18n";

// Hors de Next.js, l'adresse courante n'existe pas : on la fixe.
vi.mock("next/navigation", () => ({ usePathname: () => "/fr/services" }));

const rendu = (
  exemple: boolean,
  langue: "fr" | "en" = "fr",
  connexion = true,
) =>
  renderToStaticMarkup(
    <EnTete
      langue={langue}
      textes={dictionnaire(langue)}
      exemple={exemple}
      connexion={connexion}
    />,
  );

describe("en-tête", () => {
  it("affiche le badge « Données d'exemple » tant que le site montre des exemples (directive de Cellou)", () => {
    expect(rendu(true)).toContain('data-source="exemple"');
    expect(rendu(true, "en")).toContain("Sample data");
  });

  it("n'affiche plus le badge quand toutes les données sont réelles", () => {
    expect(rendu(false)).not.toContain('data-source="exemple"');
  });

  it("lit ses rubriques dans un seul tableau et marque la rubrique active", () => {
    const html = rendu(true);
    for (const chemin of [
      'href="/fr"',
      'href="/fr/services"',
      'href="/fr/echanges"',
      'href="/fr/contribuer"',
    ])
      expect(html).toContain(chemin);
    expect(html).toMatch(
      /<a[^>]*aria-current="page"[^>]*href="\/fr\/services"|<a[^>]*href="\/fr\/services"[^>]*aria-current="page"/,
    );
  });

  it("sans connexion GitHub, « Se connecter » devient « Bientôt », sans lien", () => {
    const html = rendu(false, "fr", false);
    expect(html).not.toContain("Se connecter");
    expect(html).not.toContain('href="/fr/moi"');
    expect(html).toContain("Bientôt");
    expect(rendu(false, "en", false)).toContain("Soon");
  });

  it("garde la même page quand on change de langue", () => {
    expect(rendu(true)).toContain('href="/en/services"');
  });
});
