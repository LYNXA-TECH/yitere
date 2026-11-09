import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  choisirSource,
  estService,
  lireCibles,
  lirePublications,
  lireSondes,
  lireVerdicts,
} from "@/lib/donnees";

const seed = readFileSync(
  new URL("../../db/seed.sql", import.meta.url),
  "utf8",
);

describe("choix de la source de données", () => {
  it("prend la source « exemple » quand YITERE_SOURCE n'est pas définie", () => {
    expect(choisirSource(undefined)).toBe("exemple");
  });

  it("accepte « exemple » et « api » écrits explicitement", () => {
    expect(choisirSource("exemple")).toBe("exemple");
    expect(choisirSource("api")).toBe("api");
  });

  it("refuse une valeur inconnue au lieu de deviner", () => {
    expect(() => choisirSource("production")).toThrow(/YITERE_SOURCE/);
  });
});

describe("source « exemple »", () => {
  it("reprend chaque cible de db/seed.sql, avec le même nom", async () => {
    const { donnees } = await lireCibles("exemple");
    expect(donnees).toHaveLength(9);
    for (const c of donnees) {
      expect(seed).toMatch(new RegExp(`\\('${c.cle}',\\s+'${c.nom}'`));
    }
  });

  it("donne un verdict à chaque service, et aucun aux cibles de référence", async () => {
    const services = (await lireCibles("exemple")).donnees.filter(estService);
    const verdicts = (await lireVerdicts()).donnees;
    expect(verdicts.map((v) => v.cible.cle).sort()).toEqual(
      services.map((c) => c.cle).sort(),
    );
  });

  it("dit toujours qu'elle est un exemple, jamais lue à une heure donnée", async () => {
    for (const lecture of [
      await lireCibles("exemple"),
      await lireVerdicts(),
      await lireSondes(),
      await lirePublications(),
    ]) {
      expect(lecture.source).toBe("exemple");
      expect(lecture.lueLe).toBeNull();
    }
  });

  it("ne rattache les publications qu'à des cibles qui existent", async () => {
    const cles = new Set(
      (await lireCibles("exemple")).donnees.map((c) => c.cle),
    );
    for (const p of (await lirePublications()).donnees) {
      expect(cles).toContain(p.cible);
    }
  });
});

describe("source « api »", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("lit GET /api/v1/cibles et convertit les noms de colonnes", async () => {
    vi.stubEnv("YITERE_API_URL", "http://127.0.0.1:8787/");
    const appel = vi.fn(async () =>
      Response.json({
        cibles: [
          {
            cle: "npm",
            nom: "registry.npmjs.org",
            famille: "Registres",
            url: "https://registry.npmjs.org/",
            methode: "entete",
            cadence_minutes: 10,
            taille_attendue: "262144",
            code_attendu: 200,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", appel);

    const lecture = await lireCibles("api");

    expect(appel).toHaveBeenCalledWith(
      "http://127.0.0.1:8787/api/v1/cibles",
      expect.anything(),
    );
    expect(lecture.source).toBe("api");
    expect(lecture.lueLe).not.toBeNull();
    expect(lecture.donnees[0]).toMatchObject({
      cle: "npm",
      cadenceMinutes: 10,
      tailleAttendue: 262144,
      codeAttendu: 200,
    });
  });

  it("échoue clairement sur une réponse inattendue plutôt que d'afficher n'importe quoi", async () => {
    vi.stubEnv("YITERE_API_URL", "http://127.0.0.1:8787");
    vi.stubGlobal("fetch", async () =>
      Response.json({ erreur: "base injoignable" }),
    );
    await expect(lireCibles("api")).rejects.toThrow(/reponse inattendue/);
  });

  it("refuse de partir sans adresse d'API", async () => {
    vi.stubEnv("YITERE_API_URL", "");
    await expect(lireCibles("api")).rejects.toThrow(/YITERE_API_URL/);
  });
});
