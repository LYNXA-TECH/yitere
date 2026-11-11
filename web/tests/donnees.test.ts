import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  choisirSource,
  estService,
  lireCibles,
  lireDetail,
  lireIncidents,
  lirePublications,
  lireResumes,
  lireSondes,
  lireVerdicts,
  siteEnExemple,
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
    for (const c of donnees)
      expect(seed).toMatch(new RegExp(`\\('${c.cle}',\\s+'${c.nom}'`));
  });

  it("donne un verdict et un résumé à chaque service, et aucun aux cibles de référence", async () => {
    const services = (await lireCibles("exemple")).donnees
      .filter(estService)
      .map((c) => c.cle)
      .sort();
    expect(
      (await lireVerdicts()).donnees.map((v) => v.cible.cle).sort(),
    ).toEqual(services);
    expect((await lireResumes()).donnees.map((r) => r.cle).sort()).toEqual(
      services,
    );
    expect((await lireDetail("ref-dns")).donnees).toBeNull();
  });

  it("dit qu'elle est un exemple, et le dit à tout le site", async () => {
    for (const lecture of [
      await lireVerdicts(),
      await lireSondes(),
      await lirePublications(),
      await lireIncidents(),
    ]) {
      expect(lecture.source).toBe("exemple");
      expect(lecture.lueLe).toBe("2026-11-03T17:00:00.000Z");
    }
    expect(await siteEnExemple()).toBe(true);
  });

  it("ne rattache les publications qu'à des cibles qui existent", async () => {
    const cles = new Set(
      (await lireCibles("exemple")).donnees.map((c) => c.cle),
    );
    for (const p of (await lirePublications()).donnees)
      expect(cles).toContain(p.cible);
  });
});

describe("simulateur : les chiffres de la maquette v3", () => {
  const verdict = async (cle: string) =>
    (await lireVerdicts()).donnees.find((v) => v.cible.cle === cle)!;

  it("npm : opérateur A à Conakry, 2 sondes touchées et 2 épargnées", async () => {
    const v = await verdict("npm");
    expect(v.observation).toEqual({
      etat: "degrade",
      depuis: "2026-11-03T14:10:00.000Z",
    });
    expect(v.hypothese).toEqual({
      cause: "operateur",
      operateur: "Opérateur A",
      ville: "Conakry",
    });
    expect(v.preuves).toMatchObject({
      sondesTouchees: 2,
      sondesEpargnees: 2,
      sondesEnRodage: 1,
      mesures: 24,
      repere: "normal",
    });
  });

  it("Docker : une seule sonde touchée, références normales, donc cause indéterminée", async () => {
    const v = await verdict("docker");
    expect(v.observation.etat).toBe("degrade");
    expect(v.hypothese).toBeNull();
    expect(v.preuves.sondesTouchees).toBe(1);
  });

  it("jsDelivr : pas de donnée depuis 15:20, jamais un zéro", async () => {
    const v = await verdict("jsdelivr-min");
    expect(v.observation).toEqual({
      etat: "pas-de-donnee",
      depuis: "2026-11-03T15:20:00.000Z",
    });
    expect(v.preuves.sondes).toEqual([]);
    const r = (await lireResumes()).donnees.find(
      (x) => x.cle === "jsdelivr-min",
    );
    expect(r?.valeur).toBeNull();
  });

  it("le tableau des services reprend 1 222 ms, autres 295 ms, 98,6 % et 612 passages", async () => {
    const r = (await lireResumes()).donnees.find((x) => x.cle === "npm")!;
    expect(r).toMatchObject({
      valeur: 1222,
      valeurAutres: 295,
      passages: 612,
      solutions: 3,
      demandes: 1,
    });
    expect(r.disponibilite).toBeCloseTo(0.986, 3);
  });

  it("une solution est confirmée à partir de 3 confirmations dans 2 villes", async () => {
    const pubs = (await lirePublications()).donnees;
    expect(pubs.find((p) => p.id === "p1")?.confirmee).toBe(true);
    expect(pubs.find((p) => p.id === "p3")?.confirmee).toBe(false);
  });

  it("la frise connaît les trois incidents et la panne de données", async () => {
    const incidents = (await lireIncidents()).donnees;
    expect(incidents.map((i) => [i.cible, i.nature, i.cause])).toEqual([
      ["npm", "degradation", "operateur"],
      ["docker", "degradation", null],
      [null, "degradation", "connexion-locale"],
      ["jsdelivr-min", "absence", null],
    ]);
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
