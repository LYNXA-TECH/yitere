import type {
  Cascade,
  Incident,
  DetailService,
  MesureNavigateur,
  PreuveSonde,
  Publication,
  ResumeService,
  Serie,
  Sonde,
  SondeDesignee,
  Verdict,
} from "../types";
import {
  CIBLES_JEU,
  INCIDENTS_JEU,
  MAINTENANT,
  NAVIGATEUR_JEU,
  PUBLICATIONS_JEU,
  REFERENCES_JEU,
  SONDES_JEU,
  VILLES_EXEMPLE,
  type CibleJeu,
  type IncidentJeu,
  type SondeJeu,
} from "./jeu";

/**
 * Le role de l'API, joue par l'exemple : a partir du jeu de la maquette, produit exactement
 * les objets du contrat (docs/CONTRAT-API-INTERFACE.md). Les regles sont celles de la
 * methodologie, section 6. Quand l'API reelle repondra, ce fichier ne servira plus qu'aux tests.
 */

type Mesure =
  | { aucune: true }
  | {
      aucune: false;
      valeur: number;
      habituel: number;
      disponibilite: number;
      degradee: boolean;
    };

const HEURE_MS = 3_600_000;

/** Heure ISO d'un pas relatif (en heures). */
export function iso(pas: number): string {
  return new Date(MAINTENANT + pas * HEURE_MS).toISOString();
}

/** « 14:10 » du jour d'exemple, en ISO. */
function isoHeure(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const jour = new Date(MAINTENANT);
  jour.setUTCHours(h, m, 0, 0);
  return jour.toISOString();
}

const sonde = (id: string): SondeJeu => {
  const s = SONDES_JEU.find((x) => x.id === id);
  if (!s) throw new Error(`Sonde d'exemple inconnue : ${id}`);
  return s;
};
const cible = (cle: string): CibleJeu | undefined =>
  CIBLES_JEU.find((c) => c.cle === cle) ??
  REFERENCES_JEU.find((c) => c.cle === cle);
const ville = (cle: string) =>
  VILLES_EXEMPLE[cle] ?? { cle, nom: cle, pays: "" };

const existe = (s: SondeJeu, pas: number) => pas > s.creee;
/** 24 h d'historique avant de compter dans un verdict (methodologie, section 5). */
const eligible = (s: SondeJeu, pas: number) =>
  s.type === "dev" && pas - s.creee >= 24;

/** Bruit deterministe : les memes courbes a chaque compilation. */
function bruit(a: number, b: number): number {
  return (
    Math.sin(a * 12.9898 + b * 78.233) * 0.5 + Math.sin(a * 3.1 + b * 1.7) * 0.5
  );
}

function incidentDe(
  cle: string,
  idSonde: string,
  pas: number,
): IncidentJeu | undefined {
  const reference = REFERENCES_JEU.some((r) => r.cle === cle);
  return INCIDENTS_JEU.find(
    (i) =>
      (i.cibles === "*" ||
        i.cibles.includes(cle) ||
        (reference && i.references === true)) &&
      i.sondes.includes(idSonde) &&
      pas > i.de &&
      pas <= i.a,
  );
}

/** Mediane horaire d'une sonde pour une cible, au pas donne. */
function mesure(cle: string, idSonde: string, pas: number): Mesure {
  const c = cible(cle);
  const s = sonde(idSonde);
  const habituel = c?.base[idSonde];
  if (!c || habituel === undefined || !existe(s, pas)) return { aucune: true };
  if (c.sansDonneeDepuis && pas > c.sansDonneeDepuis.pas)
    return { aucune: true };

  let valeur =
    habituel * (1 + 0.06 * bruit(pas, idSonde.charCodeAt(0) + cle.length));
  let disponibilite = 0.998;
  const incident = incidentDe(cle, idSonde, pas);
  if (incident) {
    const fixe = incident.valeurs?.[idSonde];
    if (c.unite === "mbps") valeur = habituel / (incident.facteur ?? 3);
    else if (fixe !== undefined) valeur = fixe * (1 + 0.05 * bruit(pas, 7));
    else valeur = habituel * (incident.facteur ?? 3);
    disponibilite = incident.disponibilite;
  }
  const degradee =
    c.unite === "ms"
      ? valeur > 2 * habituel || disponibilite < 0.9
      : valeur < habituel / 2;
  return {
    aucune: false,
    valeur:
      c.unite === "ms" ? Math.round(valeur) : Math.round(valeur * 10) / 10,
    habituel,
    disponibilite,
    degradee,
  };
}

const designer = (s: SondeJeu): SondeDesignee => ({
  pseudonyme: s.pseudonyme,
  operateur: s.operateur,
  ville: ville(s.ville).nom,
  numero: s.numero,
});

const referencesDegradees = (idSonde: string, pas: number) =>
  REFERENCES_JEU.every((r) => {
    const m = mesure(r.cle, idSonde, pas);
    return !m.aucune && m.degradee;
  });

const NOMS: Record<string, string> = {
  npm: "registry.npmjs.org",
  docker: "registry-1.docker.io",
  "github-api": "api.github.com",
  "github-raw": "raw.githubusercontent.com",
  pypi: "pypi.org",
  "jsdelivr-min": "cdn.jsdelivr.net, petite requete",
  "jsdelivr-obj": "cdn.jsdelivr.net, objet temoin",
};

/** Verdict d'une cible au pas donne : observe, hypothese, preuves. */
export function verdict(cle: string, pas = 0): Verdict {
  const c = cible(cle);
  if (!c) throw new Error(`Cible d'exemple inconnue : ${cle}`);
  const developpeurs = SONDES_JEU.filter(
    (s) => s.type === "dev" && existe(s, pas),
  );
  const comptees = developpeurs.filter((s) => eligible(s, pas));
  const lignes = comptees.flatMap((s) => {
    const m = mesure(cle, s.id, pas);
    return m.aucune ? [] : [{ s, m }];
  });
  const repereMesure = mesure(cle, "md", pas);
  const repere: Verdict["preuves"]["repere"] = repereMesure.aucune
    ? "exclu"
    : repereMesure.degradee
      ? "degrade"
      : "normal";
  const parPassage = c.unite === "ms" ? 6 : 1;
  const enRodage = developpeurs.length - comptees.length;
  const base = { cible: { cle, nom: NOMS[cle] ?? cle } };

  if (lignes.length === 0) {
    return {
      ...base,
      observation: {
        etat: "pas-de-donnee",
        depuis: c.sansDonneeDepuis ? isoHeure(c.sansDonneeDepuis.heure) : null,
      },
      hypothese: null,
      preuves: {
        sondesTouchees: 0,
        sondesEpargnees: 0,
        sondesEnRodage: enRodage,
        mesures: 0,
        periodeMinutes: 60,
        repere,
        sondes: [],
      },
    };
  }

  const touchees = lignes.filter((l) => l.m.degradee);
  const epargnees = lignes.filter((l) => !l.m.degradee);
  const preuve = (
    l: (typeof lignes)[number],
    statut: PreuveSonde["statut"],
  ): PreuveSonde => ({
    ...designer(l.s),
    statut,
    valeur: l.m.valeur,
    habituel: l.m.habituel,
    unite: c.unite,
  });
  const preuves: Verdict["preuves"] = {
    sondesTouchees: touchees.length,
    sondesEpargnees: epargnees.length,
    sondesEnRodage: enRodage,
    mesures: lignes.length * parPassage,
    periodeMinutes: 60,
    repere,
    sondes: [
      ...touchees.map((l) => preuve(l, "touchee")),
      ...epargnees.map((l) => preuve(l, "epargnee")),
    ],
  };
  if (touchees.length === 0)
    return {
      ...base,
      observation: { etat: "normal", depuis: null },
      hypothese: null,
      preuves,
    };

  const premiere = touchees[0]!.s;
  const incident = incidentDe(cle, premiere.id, pas);
  const observation = {
    etat: "degrade" as const,
    depuis: incident ? isoHeure(incident.depuis) : null,
  };
  const pays = new Set(lignes.map((l) => ville(l.s.ville).pays)).size;
  const operateurs = new Set(touchees.map((l) => l.s.operateur));

  // Les regles s'appliquent dans cet ordre (methodologie, section 6).
  if (touchees.length === lignes.length && lignes.length >= 3 && pays >= 2)
    return { ...base, observation, hypothese: { cause: "service" }, preuves };
  if (
    touchees.length >= 2 &&
    operateurs.size === 1 &&
    epargnees.some((l) => l.s.operateur !== premiere.operateur)
  )
    return {
      ...base,
      observation,
      hypothese: {
        cause: "operateur",
        operateur: premiere.operateur,
        ville: ville(premiere.ville).nom,
      },
      preuves,
    };
  if (
    touchees.length === 1 &&
    epargnees.length >= 1 &&
    referencesDegradees(premiere.id, pas)
  )
    return {
      ...base,
      observation,
      hypothese: {
        cause: "connexion-locale",
        operateur: premiere.operateur,
        ville: ville(premiere.ville).nom,
      },
      preuves,
    };
  return { ...base, observation, hypothese: null, preuves };
}

const mediane = (valeurs: number[]): number | null => {
  const tri = [...valeurs].sort((a, b) => a - b);
  return tri.length ? (tri[Math.floor(tri.length / 2)] ?? null) : null;
};
const moyenne = (valeurs: number[]) =>
  Math.round(valeurs.reduce((a, b) => a + b, 0) / valeurs.length);

export function resume(cle: string): ResumeService {
  const c = cible(cle)!;
  const v = verdict(cle);
  const developpeurs = SONDES_JEU.filter((s) => s.type === "dev");
  let passages = 0;
  let aboutis = 0;
  for (let pas = -23; pas <= 0; pas++)
    for (const s of developpeurs) {
      if (!existe(s, pas)) continue;
      const parPas = c.unite === "ms" ? 6 : pas % 3 === 0 ? 1 : 0;
      const m = mesure(cle, s.id, pas);
      if (m.aucune) continue;
      passages += parPas;
      aboutis += parPas * m.disponibilite;
    }
  const touchees = v.preuves.sondes.filter((p) => p.statut === "touchee");
  const epargnees = v.preuves.sondes.filter((p) => p.statut === "epargnee");
  const toutes = v.preuves.sondes.map((p) => p.valeur);
  const publications = PUBLICATIONS_JEU.filter((p) => p.cible === cle);
  const repere = mesure(cle, "md", 0);
  return {
    cle,
    unite: c.unite,
    valeur: touchees.length
      ? moyenne(touchees.map((p) => p.valeur))
      : mediane(toutes),
    valeurAutres:
      touchees.length && epargnees.length
        ? moyenne(epargnees.map((p) => p.valeur))
        : null,
    sondesMesurees: toutes.length,
    disponibilite: passages ? aboutis / passages : null,
    passages: Math.round(passages),
    solutions: publications.filter((p) => p.type === "contournement").length,
    demandes: publications.filter((p) => p.type === "demande").length,
    repere: repere.aucune ? null : repere.valeur,
  };
}

function series(cle: string, pas: number[], v: Verdict): Serie[] {
  const touchees = new Set(
    v.preuves.sondes
      .filter((p) => p.statut === "touchee")
      .map((p) => p.pseudonyme),
  );
  return SONDES_JEU.filter((s) => s.type === "dev").map((s) => ({
    sonde: designer(s),
    statut: !eligible(s, 0)
      ? "rodage"
      : touchees.has(s.pseudonyme)
        ? "touchee"
        : "epargnee",
    points: pas.map((h) => {
      const m = mesure(cle, s.id, h);
      return m.aucune ? null : m.valeur;
    }),
  }));
}

export function detail(cle: string): DetailService {
  const c = cible(cle)!;
  const v = verdict(cle);
  const pas24 = Array.from({ length: 24 }, (_, i) => i - 23);
  const pas7j = Array.from({ length: 28 }, (_, i) => (i - 27) * 6);
  const habituels = SONDES_JEU.filter((s) => eligible(s, 0)).flatMap((s) => {
    const b = c.base[s.id];
    return b === undefined ? [] : [b];
  });
  const touchee = v.preuves.sondes.find((p) => p.statut === "touchee");
  const incident = touchee
    ? INCIDENTS_JEU.find(
        (i) => (i.cibles === "*" || i.cibles.includes(cle)) && i.a === 0,
      )
    : undefined;
  const debut = incident ? pas24.findIndex((h) => h > incident.de) : -1;
  const repere = mesure(cle, "md", 0);
  return {
    cle,
    unite: c.unite,
    heures24: pas24.map(iso),
    heures7j: pas7j.map(iso),
    series24: series(cle, pas24, v),
    series7j: series(cle, pas7j, v),
    habituel: {
      min: habituels.length ? Math.min(...habituels) : 0,
      max: habituels.length ? Math.max(...habituels) : 0,
    },
    debutIncident24: debut >= 0 ? debut : null,
    repere: {
      valeur: repere.aucune ? null : repere.valeur,
      etat: v.preuves.repere,
    },
    cascades: cascades(cle, v),
  };
}

/** Dernier passage de deux sondes de Conakry : une touchee, une epargnee. */
function cascades(cle: string, v: Verdict): Cascade[] {
  if (cible(cle)?.unite !== "ms") return [];
  const touchee = v.preuves.sondes.find((p) => p.statut === "touchee");
  const epargnee = v.preuves.sondes.find(
    (p) => p.statut === "epargnee" && p.ville === "Conakry",
  );
  const operateur = v.hypothese?.cause === "operateur";
  return [touchee, epargnee].flatMap((p) => {
    if (!p) return [];
    const lente = p.statut === "touchee" && operateur;
    return [
      {
        sonde: {
          pseudonyme: p.pseudonyme,
          operateur: p.operateur,
          ville: p.ville,
          numero: p.numero,
        },
        statut: p.statut,
        dns: lente ? 38 : 23,
        connexion: lente ? 186 : 76,
        tls: lente ? 352 : 144,
        premierOctet: p.valeur,
      },
    ];
  });
}

/** Les sondes et leur etat pour chaque cible sur 24 h, pour la carte. */
export function sondes(): Sonde[] {
  const pas24 = Array.from({ length: 24 }, (_, i) => i - 23);
  return SONDES_JEU.map((s) => ({
    ...designer(s),
    pays: ville(s.ville).pays,
    type: s.type,
    enRodage: s.type === "dev" && !eligible(s, 0),
    etats: Object.fromEntries(
      CIBLES_JEU.map((c) => [
        c.cle,
        pas24.map((h) => {
          if (!existe(s, h)) return "absente";
          const m = mesure(c.cle, s.id, h);
          return m.aucune ? "pas-de-donnee" : m.degradee ? "degrade" : "normal";
        }),
      ]),
    ),
  }));
}

export function mesuresNavigateur(): MesureNavigateur[] {
  return NAVIGATEUR_JEU.map((m) => ({
    ville: ville(m.ville).nom,
    pays: ville(m.ville).pays,
    le: iso(m.t),
  }));
}

export function publications(): Publication[] {
  const villesSondees = new Set(
    SONDES_JEU.filter((s) => s.type === "dev" && existe(s, 0)).map(
      (s) => s.ville,
    ),
  );
  return PUBLICATIONS_JEU.map((p) => {
    const incident = p.incident
      ? INCIDENTS_JEU.find((i) => i.id === p.incident)
      : undefined;
    const sondeIncident = incident ? sonde(incident.sondes[0]!) : undefined;
    return {
      id: p.id,
      cible: p.cible,
      auteur: p.auteur,
      ville: ville(p.ville).nom,
      pays: ville(p.ville).pays,
      operateur: p.operateur,
      type: p.type,
      titre: p.titre,
      contenu: p.contenu,
      commande: p.commande,
      etiquettes: p.etiquettes,
      votes: p.votes,
      creeLe: iso(p.t),
      contexte:
        incident && sondeIncident
          ? {
              cible: p.cible,
              operateur: sondeIncident.operateur,
              ville: ville(sondeIncident.ville).nom,
              enCours: incident.a === 0,
            }
          : null,
      confirmations: p.confirmations.map((c) => ({
        ville: ville(c.ville).nom,
        operateur: c.operateur,
        le: iso(c.t),
      })),
      confirmee:
        p.confirmations.length >= 3 &&
        new Set(p.confirmations.map((c) => c.ville)).size >= 2,
      reponses: p.reponses.map((r) => ({
        auteur: r.auteur,
        ville: ville(r.ville).nom,
        le: iso(r.t),
        contenu: r.contenu,
      })),
      demande: p.villeDemandee
        ? {
            ville: ville(p.villeDemandee).nom,
            suivis: p.suivis ?? 0,
            sondeSurPlace: villesSondees.has(p.villeDemandee),
          }
        : null,
    };
  });
}

/** Les degradations et absences de donnee des 24 dernieres heures. */
export function incidents(): Incident[] {
  const degradations: Incident[] = INCIDENTS_JEU.map((i) => {
    const premiereCible = i.cibles === "*" ? null : (i.cibles[0] ?? null);
    const v = premiereCible ? verdict(premiereCible) : null;
    return {
      cible: premiereCible,
      sondes: i.sondes.map((id) => designer(sonde(id))),
      nature: "degradation",
      cause: i.references ? "connexion-locale" : (v?.hypothese?.cause ?? null),
      debut: isoHeure(i.depuis),
      fin: i.a === 0 ? null : iso(i.a),
    };
  });
  const absences: Incident[] = CIBLES_JEU.flatMap((c) =>
    c.sansDonneeDepuis
      ? [
          {
            cible: c.cle,
            sondes: [],
            nature: "absence" as const,
            cause: null,
            debut: isoHeure(c.sansDonneeDepuis.heure),
            fin: null,
          },
        ]
      : [],
  );
  return [...degradations, ...absences];
}

/** Les cles des cibles du jeu, dans l'ordre de la maquette. */
export const CLES_EXEMPLE = CIBLES_JEU.map((c) => c.cle);
export const CALCULE_LE = iso(0);
