import { describe, expect, it } from "vitest";
import { etatDepuis } from "@/lib/compte";

describe("connexion GitHub : l'etat lu dans GET /api/v1/moi (contrat, section 6)", () => {
  const moi = { login: "Aissatoulamarana", sondes: [], publications: [] };

  it("401 : personne n'est connecte, on montre le bouton de connexion", () => {
    expect(etatDepuis(401, null)).toEqual({ etat: "anonyme" });
  });

  it("200 : le login et l'espace", () => {
    expect(etatDepuis(200, moi)).toEqual({
      etat: "connecte",
      login: "Aissatoulamarana",
      moi,
    });
  });

  it("503 (pas encore ouverte), 404 (API plus ancienne), 500 ou reponse inattendue : rien ne change sur le site", () => {
    for (const statut of [503, 404, 500])
      expect(etatDepuis(statut, null)).toEqual({ etat: "fermee" });
    expect(etatDepuis(200, { login: 3 })).toEqual({ etat: "fermee" });
  });
});
