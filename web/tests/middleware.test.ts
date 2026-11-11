import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "@/middleware";

const requete = (chemin: string, langues?: string) =>
  new NextRequest(`https://yitere.lynxatech.com${chemin}`, {
    headers: langues ? { "accept-language": langues } : {},
  });

describe("middleware de langue", () => {
  it("envoie la racine vers la langue du navigateur", () => {
    const reponse = middleware(requete("/", "en-US,en;q=0.9"));
    expect(reponse.status).toBe(307);
    expect(reponse.headers.get("location")).toBe(
      "https://yitere.lynxatech.com/en",
    );
    expect(reponse.headers.get("vary")).toBe("Accept-Language");
  });

  it("garde le chemin demandé, et prend le français à défaut", () => {
    const reponse = middleware(requete("/services/npm"));
    expect(reponse.headers.get("location")).toBe(
      "https://yitere.lynxatech.com/fr/services/npm",
    );
  });

  it("laisse passer une adresse qui porte déjà sa langue", () => {
    const reponse = middleware(requete("/en/carte", "fr"));
    expect(reponse.headers.get("location")).toBeNull();
  });
});
