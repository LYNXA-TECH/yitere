import { describe, expect, it } from "vitest";
import {
  corpsDepot,
  deposer,
  lireReponseDepot,
  type Depot,
} from "@/lib/donnees/depot";

const depot: Depot = {
  service: "npm",
  type: "contournement",
  texte: "  Le miroir npmmirror marche pendant la coupure  ",
  commande: "",
  pays: "",
  pseudonyme: " awa-dkr ",
  site: "",
};

describe("depot d'une publication sans compte", () => {
  it("envoie les champs aux noms de l'API, nettoyes, vides devenus null", () => {
    expect(corpsDepot(depot)).toEqual({
      cible: "npm",
      type: "contournement",
      contenu: "Le miroir npmmirror marche pendant la coupure",
      commande: null,
      pays: null,
      auteur: "awa-dkr",
      site: "",
    });
  });

  it("201 : recu, rien d'autre", async () => {
    expect(await lireReponseDepot(new Response(null, { status: 201 }))).toEqual(
      { etat: "recu" },
    );
  });

  it("400 : l'erreur va sous le champ nomme, avec le nom de l'API ou le notre", async () => {
    const r = await lireReponseDepot(
      Response.json(
        { erreur: "Le texte est trop court.", champ: "contenu" },
        { status: 400 },
      ),
    );
    expect(r).toEqual({
      etat: "invalide",
      champ: "texte",
      erreur: "Le texte est trop court.",
    });
    const s = await lireReponseDepot(
      Response.json(
        { erreur: "Pseudonyme manquant.", champ: "pseudonyme" },
        { status: 400 },
      ),
    );
    expect(s).toMatchObject({ champ: "pseudonyme" });
    // champ inconnu ou absent : erreur generale
    const g = await lireReponseDepot(
      Response.json({ erreur: "Refuse." }, { status: 400 }),
    );
    expect(g).toEqual({ etat: "invalide", champ: null, erreur: "Refuse." });
  });

  it("429 et 503 : reessayer plus tard ; autre code ou reseau coupe : echec", async () => {
    expect(await lireReponseDepot(new Response(null, { status: 429 }))).toEqual(
      { etat: "plus-tard", raison: "trop" },
    );
    expect(await lireReponseDepot(new Response(null, { status: 503 }))).toEqual(
      { etat: "plus-tard", raison: "indisponible" },
    );
    expect(await lireReponseDepot(new Response(null, { status: 500 }))).toEqual(
      { etat: "echec" },
    );
    expect(
      await deposer(depot, async () => {
        throw new TypeError("reseau");
      }),
    ).toEqual({ etat: "echec" });
  });

  it("poste en JSON sur /api/v1/publications, a la meme adresse que le site", async () => {
    let appel: [string, RequestInit] | undefined;
    await deposer(depot, async (url, init) => {
      appel = [String(url), init!];
      return new Response(null, { status: 201 });
    });
    expect(appel![0]).toBe("/api/v1/publications");
    expect(appel![1].method).toBe("POST");
    expect(JSON.parse(String(appel![1].body)).auteur).toBe("awa-dkr");
  });
});
