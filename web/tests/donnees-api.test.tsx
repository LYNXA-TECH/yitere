import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Accueil from "@/app/[langue]/page";
import FicheService from "@/app/[langue]/services/[cle]/page";
import HebergerSonde from "@/app/[langue]/contribuer/sonde/page";
import Echanges from "@/app/[langue]/echanges/page";
import MonEspace from "@/app/[langue]/moi/page";
import Publier from "@/app/[langue]/publier/page";
import Services from "@/app/[langue]/services/page";
import type {
  ReponseServices,
  ReponseSondes,
  ReponseVerdicts,
  VerdictApi,
} from "@/lib/donnees/api";
import {
  lireCibles,
  lireResumes,
  lireSondes,
  lireVerdicts,
  siteEnExemple,
} from "@/lib/donnees";

vi.mock("next/navigation", () => ({ usePathname: () => "/fr" }));

/*
 * Des reponses ecrites a la forme exacte de serveur/api.js (main, 2e2a5bb) :
 * deux sondes a Conakry, dont une sans operateur detecte, et le repere de Madrid.
 */

const CALCULE_LE = "2026-11-12T09:30:00.000Z";

const SONDES: ReponseSondes = {
  sondes: [
    {
      pseudonyme: "lynx-conakry-1",
      pays: "GN",
      ville: "Conakry",
      operateur: "AS37461",
      type: "dev",
      en_rodage: false,
    },
    {
      pseudonyme: "lynx-conakry-2",
      pays: "GN",
      ville: "Conakry",
      operateur: "AS37461",
      type: "dev",
      en_rodage: true,
    },
    {
      pseudonyme: "lynx-dakar-1",
      pays: "SN",
      ville: "Dakar",
      operateur: null,
      type: "dev",
      en_rodage: false,
    },
    {
      pseudonyme: "lynx-madrid-1",
      pays: "ES",
      ville: "Madrid",
      operateur: null,
      type: "datacenter",
      en_rodage: false,
    },
  ],
};

const preuve = (
  pseudonyme: string,
  operateur: string | null,
  ville: string,
  statut: "touchee" | "epargnee",
  valeur: number,
) => ({
  pseudonyme,
  operateur,
  ville,
  numero: 1,
  statut,
  valeur,
  habituel: 300,
  unite: "ms" as const,
  mesures: 6,
  echecs: 0,
});

const verdict = (
  cle: string,
  nom: string,
  v: Partial<VerdictApi> = {},
): VerdictApi => ({
  cle,
  nom,
  etat: "normal",
  depuis: null,
  hypothese: null,
  preuves: {
    sondes_touchees: 0,
    sondes_epargnees: 2,
    sondes_en_rodage: 1,
    mesures: 12,
    periode_minutes: 60,
    repere: "normal",
    sondes: [
      preuve("lynx-conakry-1", "AS37461", "Conakry", "epargnee", 310),
      preuve("lynx-dakar-1", null, "Dakar", "epargnee", 290),
    ],
  },
  ...v,
});

const CIBLES = [
  ["github-api", "api.github.com", "Code"],
  ["github-raw", "raw.githubusercontent.com", "Code"],
  ["npm", "registry.npmjs.org", "Registres"],
  ["pypi", "pypi.org", "Registres"],
  ["docker", "registry-1.docker.io", "Registres"],
  ["jsdelivr-obj", "cdn.jsdelivr.net (objet)", "Diffusion"],
  ["jsdelivr-min", "cdn.jsdelivr.net", "Diffusion"],
  ["ref-dns", "résolution DNS", "Reference"],
  ["ref-contenu", "contenu de référence", "Reference"],
] as const;

const VERDICTS: ReponseVerdicts = {
  calcule_le: CALCULE_LE,
  verdicts: CIBLES.filter(([, , f]) => f !== "Reference").map(([cle, nom]) =>
    cle === "npm"
      ? verdict(cle, nom, {
          etat: "degrade",
          depuis: "2026-11-12T08:50:00.000Z",
          preuves: {
            sondes_touchees: 1,
            sondes_epargnees: 1,
            sondes_en_rodage: 1,
            mesures: 12,
            periode_minutes: 60,
            repere: "degrade",
            sondes: [
              preuve("lynx-conakry-1", "AS37461", "Conakry", "touchee", 1210),
              preuve("lynx-dakar-1", null, "Dakar", "epargnee", 290),
            ],
          },
        })
      : cle === "pypi"
        ? verdict(cle, nom, {
            etat: "pas-de-donnee",
            depuis: "2026-11-12T07:10:00.000Z",
            preuves: {
              ...verdict(cle, nom).preuves,
              sondes_epargnees: 0,
              sondes: [],
              repere: "exclu",
            },
          })
        : verdict(cle, nom),
  ),
};

const SERVICES: ReponseServices = {
  calcule_le: CALCULE_LE,
  services: VERDICTS.verdicts.map((v) => ({
    cle: v.cle,
    unite: v.cle === "jsdelivr-obj" ? "mbps" : "ms",
    valeur: v.cle === "npm" ? 1210 : v.cle === "pypi" ? null : 300,
    valeur_autres: v.cle === "npm" ? 290 : null,
    sondes_mesurees: v.preuves.sondes.length,
    disponibilite: v.cle === "pypi" ? null : 0.9861,
    passages: v.cle === "pypi" ? 0 : 144,
    // 2 pour npm : le compteur de l'accueil doit venir d'ici, pas des publications (vides)
    solutions: v.cle === "npm" ? 2 : 0,
    demandes: 0,
    repere: 62,
  })),
};

const REPONSES: Record<string, unknown> = {
  "/api/v1/cibles": {
    cibles: CIBLES.map(([cle, nom, famille]) => ({
      cle,
      nom,
      famille,
      url: `https://${nom.split(" ")[0]}/`,
      methode: cle === "jsdelivr-obj" ? "objet" : "entete",
      cadence_minutes: cle === "jsdelivr-obj" ? 180 : 10,
      taille_attendue: null,
      code_attendu: 200,
    })),
  },
  "/api/v1/verdicts": VERDICTS,
  "/api/v1/services": SERVICES,
  "/api/v1/sondes": SONDES,
  // serveur/publications.js : liste vide au depart, en lecture seule
  "/api/v1/publications": { publications: [] },
};

const appel = vi.fn(async (url: string) => {
  const chemin = new URL(url).pathname;
  return chemin in REPONSES
    ? Response.json(REPONSES[chemin])
    : Response.json({ erreur: "route inconnue" }, { status: 404 });
});

beforeEach(() => {
  vi.stubEnv("YITERE_API_URL", "http://127.0.0.1:8787");
  vi.stubGlobal("fetch", appel);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  appel.mockClear();
});

describe("source « api » : verdicts, services, sondes", () => {
  it("lit les verdicts et donne l'heure du calcul, pas l'heure de lecture", async () => {
    const lecture = await lireVerdicts("api");
    expect(lecture.source).toBe("api");
    expect(lecture.lueLe).toBe(CALCULE_LE);
    const npm = lecture.donnees.find((v) => v.cible.cle === "npm")!;
    expect(npm.cible).toEqual({ cle: "npm", nom: "registry.npmjs.org" });
    expect(npm.observation).toEqual({
      etat: "degrade",
      depuis: "2026-11-12T08:50:00.000Z",
    });
    expect(npm.preuves).toMatchObject({
      sondesTouchees: 1,
      sondesEpargnees: 1,
      sondesEnRodage: 1,
      periodeMinutes: 60,
      repere: "degrade",
    });
    expect(npm.preuves.sondes[1]).toEqual({
      pseudonyme: "lynx-dakar-1",
      operateur: null,
      ville: "Dakar",
      numero: 1,
      statut: "epargnee",
      valeur: 290,
      habituel: 300,
      unite: "ms",
    });
  });

  it("lit le tableau des services et renomme ses colonnes", async () => {
    const lecture = await lireResumes("api");
    expect(lecture.lueLe).toBe(CALCULE_LE);
    expect(lecture.donnees.find((r) => r.cle === "npm")).toEqual({
      cle: "npm",
      unite: "ms",
      valeur: 1210,
      valeurAutres: 290,
      sondesMesurees: 2,
      disponibilite: 0.9861,
      passages: 144,
      solutions: 2,
      demandes: 0,
      repere: 62,
    });
    expect(lecture.donnees.find((r) => r.cle === "pypi")?.valeur).toBeNull();
  });

  it("numerote les sondes par operateur et par ville, comme le serveur", async () => {
    const { donnees } = await lireSondes("api");
    expect(donnees.map((s) => [s.pseudonyme, s.operateur, s.numero])).toEqual([
      ["lynx-conakry-1", "AS37461", 1],
      ["lynx-conakry-2", "AS37461", 2],
      ["lynx-dakar-1", null, 1],
      ["lynx-madrid-1", null, 1],
    ]);
  });

  it("appelle « repere » le datacenter de Madrid", async () => {
    const { donnees } = await lireSondes("api");
    expect(donnees.map((s) => s.type)).toEqual(["dev", "dev", "dev", "repere"]);
    expect(donnees.map((s) => s.enRodage)).toEqual([false, true, false, false]);
  });

  it("lit l'etat de chaque sonde dans les preuves, sans inventer d'historique", async () => {
    const { donnees } = await lireSondes("api");
    const etat = (pseudo: string, cle: string) =>
      donnees.find((s) => s.pseudonyme === pseudo)!.etats[cle]!;
    expect(etat("lynx-conakry-1", "npm").at(-1)).toBe("degrade");
    expect(etat("lynx-dakar-1", "npm").at(-1)).toBe("normal");
    // en rodage : absente des preuves
    expect(etat("lynx-conakry-2", "npm").at(-1)).toBe("pas-de-donnee");
    expect(etat("lynx-madrid-1", "npm").at(-1)).toBe("degrade");
    expect(etat("lynx-madrid-1", "pypi").at(-1)).toBe("pas-de-donnee");
    // 24 pas ; les 23 premiers ne sont pas servis par l'API
    expect(etat("lynx-conakry-1", "npm")).toHaveLength(24);
    expect(new Set(etat("lynx-conakry-1", "npm").slice(0, 23))).toEqual(
      new Set(["absente"]),
    );
  });

  it("echoue clairement si une route repond une erreur ou une forme inattendue", async () => {
    vi.stubGlobal("fetch", async () =>
      Response.json({ erreur: "base injoignable" }, { status: 500 }),
    );
    await expect(lireVerdicts("api")).rejects.toThrow(/verdicts a repondu 500/);
    vi.stubGlobal("fetch", async () => Response.json({ verdicts: "non" }));
    await expect(lireResumes("api")).rejects.toThrow(/reponse inattendue/);
    await expect(lireSondes("api")).rejects.toThrow(/reponse inattendue/);
  });
});

describe("pages traduites branchees sur l'API", () => {
  beforeEach(() => vi.stubEnv("YITERE_SOURCE", "api"));

  it("retire le badge : verdicts, services, sondes et publications sont reels", async () => {
    expect((await lireCibles()).source).toBe("api");
    expect(await siteEnExemple()).toBe(false);
  });

  it("accueil : aucune publication d'exemple, et les solutions comptees par /services", async () => {
    const html = renderToStaticMarkup(
      await Accueil({ params: Promise.resolve({ langue: "fr" }) }),
    );
    expect(html).toContain("Aucune publication pour l&#x27;instant.");
    expect(html).toContain("après le 23 novembre");
    expect(html).toContain("Solutions · 2");
    expect(html).not.toContain("Confirmée");
  });

  it("fiche npm : un etat vide honnete, sans « Publiee pendant cet incident »", async () => {
    const html = renderToStaticMarkup(
      await FicheService({
        params: Promise.resolve({ langue: "fr", cle: "npm" }),
      }),
    );
    expect(html).toContain("Aucune publication pour l&#x27;instant.");
    expect(html).not.toContain("Publiée pendant cet incident");
    expect(html).not.toContain("Confirmée par la communauté");
    expect(html).not.toContain('href="/fr/publier"');
    const en = renderToStaticMarkup(
      await FicheService({
        params: Promise.resolve({ langue: "en", cle: "npm" }),
      }),
    );
    expect(en).toContain("No posts yet.");
  });

  it("echanges : la liste vide, et rien a publier avant la connexion GitHub", async () => {
    const html = renderToStaticMarkup(
      await Echanges({ params: Promise.resolve({ langue: "fr" }) }),
    );
    expect(html).toContain("Aucune publication pour l&#x27;instant.");
    expect(html).not.toContain("Rien ne correspond à ces filtres");
    expect(html).not.toContain("Partager une solution");
  });

  it("publier et mon espace : « Bientot », jamais le profil d'une vraie sonde", async () => {
    for (const Page of [Publier, MonEspace]) {
      const html = renderToStaticMarkup(
        (await Page({ params: Promise.resolve({ langue: "fr" }) }))!,
      );
      expect(html).toContain("<h1>Bientôt</h1>");
      expect(html).not.toContain("@lynx-conakry-1");
    }
  });

  it("heberger une sonde : la cle se demande par courriel, pas « Se connecter avec GitHub »", async () => {
    const html = renderToStaticMarkup(
      await HebergerSonde({ params: Promise.resolve({ langue: "fr" }) }),
    );
    expect(html).toContain("Demander votre clé");
    expect(html).toContain('href="mailto:contact@lynxatech.com');
    expect(html).toContain("ouvre après le 23 novembre");
    expect(html).not.toContain("Se connecter avec GitHub");
  });

  it("services : l'onglet navigateur ne compte plus de mesures d'exemple", async () => {
    const html = renderToStaticMarkup(
      await Services({ params: Promise.resolve({ langue: "fr" }) }),
    );
    expect(html).toContain("Navigateur · 0");
    expect(html).toContain(
      "Aucune mesure navigateur reçue pour l&#x27;instant",
    );
    expect(html).not.toContain("Abidjan");
  });

  it("pas-de-donnee avec des sondes en rodage : « En rodage », pas « Pas de donnee depuis »", async () => {
    const html = renderToStaticMarkup(
      await Services({ params: Promise.resolve({ langue: "fr" }) }),
    );
    // pypi : aucune sonde comptee, une en rodage
    expect(html).toContain("En rodage");
    expect(html).not.toContain("Pas de donnée depuis");
    const fiche = renderToStaticMarkup(
      await FicheService({
        params: Promise.resolve({ langue: "en", cle: "pypi" }),
      }),
    );
    expect(fiche).toContain("Warming up");
    expect(fiche).not.toContain("No data since");
  });

  it("services : les chiffres de l'API, et l'operateur non detecte nomme comme tel", async () => {
    const fr = renderToStaticMarkup(
      await Services({ params: Promise.resolve({ langue: "fr" }) }),
    );
    expect(fr).toContain("1\u202f210 ms");
    expect(fr).not.toContain("null");
    const en = renderToStaticMarkup(
      await Services({ params: Promise.resolve({ langue: "en" }) }),
    );
    expect(en).toContain("1,210 ms");
  });

  it("fiche npm : la sonde sans operateur detecte est designee, jamais « null »", async () => {
    const html = renderToStaticMarkup(
      await FicheService({
        params: Promise.resolve({ langue: "fr", cle: "npm" }),
      }),
    );
    expect(html).toContain("Opérateur non détecté · Dakar · 1");
    expect(html).toContain("AS37461 · Conakry · 1");
    // les courbes restent un exemple, et la fiche le dit ; les tuiles, elles, sont reelles
    expect(html).toContain('data-source="exemple"');
    expect(html).toContain("62 ms");
    expect(html).not.toContain("null");
  });

  it("accueil : les villes des sondes de l'API, et rien de l'exemple sur la frise", async () => {
    const html = renderToStaticMarkup(
      await Accueil({ params: Promise.resolve({ langue: "fr" }) }),
    );
    expect(html).toContain(">Conakry</text>");
    expect(html).toContain(">Dakar</text>");
    expect(html).not.toContain(">Abidjan</text>");
    expect(html).toContain('href="#service-npm"');
    expect(html).toContain('href="#service-pypi"');
    expect(html).not.toContain("null");
    // incidents, publications et mesures navigateur d'exemple : hors de la frise
    expect(html).not.toMatch(/data-teinte="[^"]*" style=/);
    expect(html).not.toMatch(/data-nature="(publication|navigateur)"/);
    // la frise ne parle plus d'exemple quand les verdicts sont reels
    expect(html).toContain("En direct · mesures des sondes");
    expect(html).not.toContain("En direct · données d&#x27;exemple");
  });
});
