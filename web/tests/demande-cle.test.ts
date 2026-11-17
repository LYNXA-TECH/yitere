import { describe, expect, it } from "vitest";
import {
  DEMANDE_VIDE,
  lienDemande,
  messageDemande,
} from "@/lib/affichage/demande-cle";

describe("demande de cle de sonde : le courriel prepare", () => {
  it("met dans le message ce qui a ete rempli, et seulement cela", () => {
    const { objet, texte } = messageDemande({
      ...DEMANDE_VIDE,
      pays: "Sierra Leone",
      ville: "  Freetown ",
      operateur: "Orange",
    });
    expect(objet).toBe("Héberger une sonde YITERE · Freetown, Sierra Leone");
    expect(texte).toContain(
      "Pays : Sierra Leone\nVille : Freetown\nOpérateur : Orange",
    );
    expect(texte).not.toContain("Pseudonyme");
  });

  it("le lien mailto garde accents et retours a la ligne", () => {
    const lien = lienDemande("kantecellou70@gmail.com", {
      ...DEMANDE_VIDE,
      ville: "Labé",
      pseudonyme: "lynx-labe",
    });
    expect(lien.startsWith("mailto:kantecellou70@gmail.com?subject=")).toBe(
      true,
    );
    const corps = decodeURIComponent(lien.split("&body=")[1] ?? "");
    expect(corps).toContain("Ville : Labé\n");
    expect(corps).toContain("Pseudonyme souhaité : lynx-labe");
  });
});
