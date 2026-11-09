import { categoriePluriel, dateCourte, heureUTC, nombre } from "@/lib/format";
import type { Partielle } from "./partielle";
import type { Dictionnaire } from "./fr";

/**
 * Textes en anglais. Une cle absente n'empeche pas la compilation : le site affiche
 * le texte francais precede de la marque [FR] (decision 0002, D13, jusqu'apres le concours).
 * Pages traduites : accueil, services, fiche d'un service, carte.
 */

const L = "en";
const pluriel = (n: number) => categoriePluriel(L, n) !== "one";
const compter = (n: number, un: string, plusieurs: string) =>
  `${nombre(L, n)} ${pluriel(n) ? plusieurs : un}`;
const heure = (iso: string) => `${heureUTC(L, iso)} GMT`;

export const en: Partielle<Dictionnaire> = {
  site: {
    devise: "My connection, my operator, or the service?",
    description:
      "Observatory of network conditions for African developers: my connection, my operator, or the service?",
    accueil: "YITERE, home",
  },
  navigation: {
    principale: "Main navigation",
    carte: "Map",
    services: "Services",
    echanges: "Exchanges",
    methodologie: "Method",
    contribuer: "Contribute",
    langue: "Language",
    allerAuContenu: "Skip to content",
  },
  source: {
    exemple: "Sample data",
    exempleDetail:
      "These figures show how the interface works: they are not real measurements yet.",
    lueLe: (iso: string) => `Data read at ${heure(iso)}`,
  },
  pageEnFrancais: "This page is only available in French for now.",
  etats: {
    normal: "Normal",
    degrade: "Degradation observed",
    "pas-de-donnee": "No data",
  },
  verdict: {
    aria: (service: string) => `Verdict for ${service}`,
    observe: "Observed",
    hypothese: "Hypothesis",
    indetermine: "Undetermined",
    aucuneDegradation: "No degradation observed",
    pasDeDonnee: "No data",
    degradationDepuis: (iso: string) => `Degraded since ${heure(iso)}`,
    degradation: "Degraded",
    causeIndeterminee: "Undetermined cause: not enough data",
    causeProbable: (cause: string) => `Probable cause: ${cause}`,
    causeService: "the service itself",
    causeOperateur: (
      operateur: string | undefined,
      ville: string | undefined,
    ) => [operateur ?? "the operator", ville].filter(Boolean).join(" in "),
    causeConnexionLocale: "the probe's local connection",
    sondesDegrade: (touchees: number, epargnees: number) =>
      `${compter(touchees, "probe affected", "probes affected")}, ${nombre(L, epargnees)} spared`,
    sondesNormal: (n: number) =>
      `${compter(n, "probe", "probes")} within ${pluriel(n) ? "their" : "its"} usual range`,
    mesures: (n: number, periodeMinutes: number) =>
      `${compter(n, "measurement", "measurements")}, ${periode(periodeMinutes)}`,
    aucuneMesure: (periodeMinutes: number) =>
      `No usable measurement, ${periode(periodeMinutes)}`,
    rodage: (n: number) =>
      `${compter(n, "probe", "probes")} warming up, not counted`,
    repere: (etat: "normal" | "degrade" | "exclu") =>
      `Madrid reference (not used in the calculation): ${{ normal: "normal", degrade: "degraded too", exclu: "excluded for this service" }[etat]}`,
    limite:
      "Hypothesis computed by public rules. It points a direction, it does not prove anything.",
    lienMethode: "How it is computed",
  },
  accueil: {
    titre: "YITERE",
    intro:
      "Probes run by African developers continuously measure how long it takes to reach GitHub, npm, PyPI, Docker and jsDelivr. When a service slows down, YITERE says what is observed, where the problem probably comes from, and what worked for others.",
    enCeMoment: "Right now",
    aucuneDegradation: "No degradation observed on the monitored services.",
    servicesNormaux: (n: number) =>
      `${compter(n, "other service", "other services")} within ${pluriel(n) ? "their" : "its"} usual range.`,
    voirServices: "See all services",
    voirCarte: "See the map",
    contribuerTitre: "Your connection counts too",
    contribuerTexte:
      "One more probe means one more city or operator in the verdicts. It is a single file, with no dependencies and no administrator rights.",
    contribuerLien: "Host a probe",
  },
  services: {
    titre: "Services",
    intro:
      "The services a developer's daily work depends on, measured from every probe.",
    famille: (famille: string) =>
      ({
        Code: "Code",
        Registres: "Package registries",
        Diffusion: "Delivery (CDN)",
      })[famille] ?? famille,
    cadence: (minutes: number) =>
      minutes < 60
        ? `every ${nombre(L, minutes)} min`
        : `every ${nombre(L, minutes / 60)} h`,
  },
  fiche: {
    retour: "All services",
    adresse: "Measured address",
    cadence: "Frequency",
    reponseAttendue: "Expected response",
    codeAttendu: (code: number) =>
      code === 401
        ? "401, this registry's normal answer without authentication"
        : String(code),
    solutions: "What worked for others",
    aucuneSolution: "No post for this service yet.",
    voirEchanges: "See all exchanges",
  },
  carte: {
    titre: "Probe map",
    intro:
      "Each dot is a city where at least one probe is measuring. An orange ring marks a city named by a current verdict.",
    vueCarte: "Map",
    vueListe: "List",
    descriptionCarte: (villes: number, sondes: number) =>
      `Map of Africa: ${compter(sondes, "probe", "probes")} in ${compter(villes, "city", "cities")}. Details are in the list below.`,
    legendeSondes: "City with probes (the number is how many)",
    legendeVerdict: "City named by a current verdict",
    ville: "City",
    pays: "Country",
    sondes: "Probes",
    verdicts: "Verdicts naming it",
    nbSondes: (n: number, rodage: number) =>
      rodage > 0
        ? `${nombre(L, n)}, ${nombre(L, rodage)} warming up`
        : nombre(L, n),
    aucun: "None",
    horsCarte:
      "The Madrid reference is a data-centre server outside Africa: it is a point of comparison and is never used in a calculation.",
  },
  echanges: {
    contournement: "Solution",
    demande: "Request",
    votes: (n: number) => compter(n, "confirmation", "confirmations"),
    publieeLe: (iso: string) => `posted on ${dateCourte(L, iso)}`,
  },
  pied: {
    licence: "Code under the MIT licence. Built by the LYNXA team.",
    depot: "Source code",
  },
};

function periode(minutes: number): string {
  if (minutes === 60) return "last hour";
  if (minutes % 60 === 0) return `last ${nombre(L, minutes / 60)} hours`;
  return `last ${nombre(L, minutes)} minutes`;
}
