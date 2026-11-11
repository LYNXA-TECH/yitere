import type {
  Cause,
  Etat,
  ResumeService,
  Sonde,
  Unite,
  Verdict,
} from "./types";

/*
 * Les reponses de l'API telles que serveur/api.js les envoie (main, 2e2a5bb),
 * et leur traduction vers les types de l'interface. Rien n'est calcule ici :
 * on renomme, on regroupe, on ne juge pas (decision 0001, principe directeur).
 *
 * Ecarts au contrat de docs/CONTRAT-API-INTERFACE.md, repris tels quels :
 * - operateur vaut null (operateur non detecte) ou « AS<numero> » ;
 * - le repere de Madrid a le type « datacenter », que l'interface appelle « repere » ;
 * - chaque sonde des preuves porte en plus mesures et echecs ;
 * - GET /api/v1/sondes ne donne ni le numero d'une sonde ni son historique.
 */

type EtatSondeApi = "touchee" | "epargnee";

export type VerdictApi = {
  cle: string;
  nom: string;
  etat: Etat;
  depuis: string | null;
  hypothese: { cause: Cause; operateur?: string; ville?: string } | null;
  preuves: {
    sondes_touchees: number;
    sondes_epargnees: number;
    sondes_en_rodage: number;
    mesures: number;
    periode_minutes: number;
    repere: "normal" | "degrade" | "exclu";
    sondes: {
      pseudonyme: string;
      operateur: string | null;
      ville: string;
      numero: number;
      statut: EtatSondeApi;
      valeur: number;
      habituel: number;
      unite: Unite;
      mesures: number;
      echecs: number;
    }[];
  };
};

export type ReponseVerdicts = { calcule_le: string; verdicts: VerdictApi[] };

export type ServiceApi = {
  cle: string;
  unite: Unite;
  valeur: number | null;
  valeur_autres: number | null;
  sondes_mesurees: number;
  disponibilite: number | null;
  passages: number;
  solutions: number;
  demandes: number;
  repere: number | null;
};

export type ReponseServices = { calcule_le: string; services: ServiceApi[] };

export type SondeApi = {
  pseudonyme: string;
  pays: string;
  ville: string;
  operateur: string | null;
  type: "dev" | "datacenter" | "navigateur";
  en_rodage: boolean;
};

export type ReponseSondes = { sondes: SondeApi[] };

export function verdictDepuisApi(v: VerdictApi): Verdict {
  return {
    cible: { cle: v.cle, nom: v.nom },
    observation: { etat: v.etat, depuis: v.depuis },
    hypothese: v.hypothese,
    preuves: {
      sondesTouchees: v.preuves.sondes_touchees,
      sondesEpargnees: v.preuves.sondes_epargnees,
      sondesEnRodage: v.preuves.sondes_en_rodage,
      mesures: v.preuves.mesures,
      periodeMinutes: v.preuves.periode_minutes,
      repere: v.preuves.repere,
      sondes: v.preuves.sondes.map((s) => ({
        pseudonyme: s.pseudonyme,
        operateur: s.operateur,
        ville: s.ville,
        numero: s.numero,
        statut: s.statut,
        valeur: s.valeur,
        habituel: s.habituel,
        unite: s.unite,
      })),
    },
  };
}

export function resumeDepuisApi(s: ServiceApi): ResumeService {
  return {
    cle: s.cle,
    unite: s.unite,
    valeur: s.valeur,
    valeurAutres: s.valeur_autres,
    sondesMesurees: s.sondes_mesurees,
    disponibilite: s.disponibilite,
    passages: s.passages,
    solutions: s.solutions,
    demandes: s.demandes,
    repere: s.repere,
  };
}

/** Nombre de pas de la frise des 24 heures (un par heure, le dernier : maintenant). */
export const PAS_FRISE = 24;

/**
 * Les sondes de l'API, completees par ce que les verdicts disent deja d'elles.
 *
 * - Le numero : l'API renvoie les sondes dans l'ordre de leur creation, et numerote
 *   par operateur et par ville dans ce meme ordre (serveur/verdicts.js, numeroter).
 *   Compter ici dans le meme ordre redonne le meme numero que les preuves.
 * - L'etat de chaque sonde, pour chaque service, est lu dans les preuves du verdict :
 *   touchee donne degrade, epargnee donne normal ; absente des preuves (en rodage,
 *   ou sans mesure sur la periode) donne « pas de donnee ». Le repere de Madrid prend
 *   l'etat que le verdict lui donne. L'API ne sert pas encore l'historique : les 23
 *   heures precedentes restent « absente », la carte n'invente rien.
 */
export function sondesDepuisApi(
  sondes: SondeApi[],
  verdicts: VerdictApi[],
): Sonde[] {
  const compte = new Map<string, number>();
  return sondes.map((s) => {
    const cle = `${s.operateur}|${s.ville}`;
    const numero = (compte.get(cle) ?? 0) + 1;
    compte.set(cle, numero);
    const repere = s.type === "datacenter";

    const etats: Sonde["etats"] = {};
    for (const v of verdicts) {
      const preuve = v.preuves.sondes.find(
        (p) => p.pseudonyme === s.pseudonyme,
      );
      const maintenant = repere
        ? v.preuves.repere === "exclu"
          ? "pas-de-donnee"
          : v.preuves.repere
        : preuve
          ? preuve.statut === "touchee"
            ? "degrade"
            : "normal"
          : "pas-de-donnee";
      etats[v.cle] = [
        ...Array.from({ length: PAS_FRISE - 1 }, () => "absente" as const),
        maintenant,
      ];
    }

    return {
      pseudonyme: s.pseudonyme,
      operateur: s.operateur,
      ville: s.ville,
      numero,
      pays: s.pays,
      type: s.type === "datacenter" ? "repere" : s.type,
      enRodage: s.en_rodage,
      etats,
    };
  });
}

/* Verifications de forme : une reponse inattendue est une erreur, jamais une devinette. */

const objet = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

export function estReponseVerdicts(x: unknown): x is ReponseVerdicts {
  return (
    objet(x) &&
    typeof x.calcule_le === "string" &&
    Array.isArray(x.verdicts) &&
    x.verdicts.every(
      (v) =>
        objet(v) &&
        typeof v.cle === "string" &&
        typeof v.etat === "string" &&
        objet(v.preuves) &&
        Array.isArray(v.preuves.sondes),
    )
  );
}

export function estReponseServices(x: unknown): x is ReponseServices {
  return (
    objet(x) &&
    typeof x.calcule_le === "string" &&
    Array.isArray(x.services) &&
    x.services.every(
      (s) => objet(s) && typeof s.cle === "string" && "valeur_autres" in s,
    )
  );
}

export function estReponseSondes(x: unknown): x is ReponseSondes {
  return (
    objet(x) &&
    Array.isArray(x.sondes) &&
    x.sondes.every(
      (s) =>
        objet(s) &&
        typeof s.pseudonyme === "string" &&
        typeof s.ville === "string" &&
        typeof s.en_rodage === "boolean",
    )
  );
}
