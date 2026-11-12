import type { ResumeService, Unite, Verdict } from "@/lib/donnees/types";
import type { Dictionnaire } from "@/lib/i18n";

/** La teinte d'un verdict a l'ecran ; la forme du symbole la double toujours. */
export type Teinte = "normal" | "degrade" | "service" | "vide";

export function teinte(v: Verdict): Teinte {
  if (v.observation.etat === "normal") return "normal";
  if (v.observation.etat === "pas-de-donnee") return "vide";
  return v.hypothese?.cause === "service" ? "service" : "degrade";
}

/**
 * Un service sans donnee : « En rodage » si des sondes le mesurent sans etre encore
 * comptees (moins de 24 h d'historique), sinon « Pas de donnee depuis 17:00 ».
 */
export function libelleSansDonnee(
  v: Verdict,
  t: Dictionnaire["services"],
): string {
  return v.preuves.sondesEnRodage > 0
    ? t.enRodage
    : t.sansDonnee(v.observation.depuis);
}

/** L'etat d'un service en une ligne, comme dans le tableau des services. */
export function libelleEtat(v: Verdict, t: Dictionnaire["services"]): string {
  if (v.observation.etat === "normal") return t.etatNormal;
  if (v.observation.etat === "pas-de-donnee") return libelleSansDonnee(v, t);
  switch (v.hypothese?.cause) {
    case "operateur":
      return t.etatOperateur(v.hypothese.operateur ?? "");
    case "service":
      return t.etatService;
    case "connexion-locale":
      return t.etatLocal;
    default:
      return t.etatIndetermine;
  }
}

/** Une valeur avec son unite : « 1 222 ms », « 12,8 Mbit/s ». */
export function valeur(
  n: number,
  unite: Unite,
  t: Dictionnaire["services"],
): string {
  return unite === "ms" ? t.ms(n) : t.mbps(n);
}

/** Le sous-titre de la colonne « Premier octet ». */
export function detailValeur(
  r: ResumeService,
  v: Verdict,
  t: Dictionnaire["services"],
  cadence: number,
): string {
  if (r.unite === "mbps") return t.cadence(cadence);
  if (r.valeur === null) return "";
  if (v.preuves.sondesTouchees > 0 && r.valeurAutres !== null)
    return t.autres(v.preuves.sondesTouchees, t.ms(r.valeurAutres));
  return t.medianeDe(r.sondesMesurees);
}

/** La cause en clair : « Operateur A a Conakry », « le service lui-meme »... */
export function texteCause(
  h: NonNullable<Verdict["hypothese"]>,
  t: Dictionnaire["verdict"],
): string {
  switch (h.cause) {
    case "service":
      return t.causeService;
    case "operateur":
      return t.causeOperateur(h.operateur, h.ville);
    case "connexion-locale":
      return t.causeConnexionLocale;
  }
}

/** La ligne d'hypothese : « Cause probable : ... » ou « Cause indeterminee ». */
export function texteHypothese(v: Verdict, t: Dictionnaire["verdict"]): string {
  return v.hypothese
    ? t.causeProbable(texteCause(v.hypothese, t))
    : t.causeIndeterminee;
}
