import { categoriePluriel, dateCourte, heureUTC, nombre } from "@/lib/format";

/**
 * Tous les textes du site en francais. C'est la langue de reference :
 * son type definit les cles que les autres langues peuvent fournir.
 * Une phrase avec des variables est une fonction : l'ordre des mots reste libre dans chaque langue.
 */

const L = "fr";
const pluriel = (n: number) => categoriePluriel(L, n) !== "one";
const compter = (n: number, un: string, plusieurs: string) =>
  `${nombre(L, n)} ${pluriel(n) ? plusieurs : un}`;
const heure = (iso: string) => `${heureUTC(L, iso)} GMT`;

export const fr = {
  site: {
    devise: "Ma connexion, mon opérateur, ou le service ?",
    description:
      "Observatoire des conditions réseau du développement africain : ma connexion, mon opérateur, ou le service ?",
    accueil: "YITERE, accueil",
  },
  navigation: {
    principale: "Navigation principale",
    carte: "Carte",
    services: "Services",
    echanges: "Échanges",
    methodologie: "Méthode",
    contribuer: "Contribuer",
    langue: "Langue",
    allerAuContenu: "Aller au contenu",
  },
  source: {
    exemple: "Données d'exemple",
    exempleDetail:
      "Ces chiffres montrent le fonctionnement de l'interface : ce ne sont pas encore des mesures réelles.",
    lueLe: (iso: string) => `Données lues à ${heure(iso)}`,
  },
  pageEnFrancais: "Cette page n'existe qu'en français pour l'instant.",
  etats: {
    normal: "Normal",
    degrade: "Dégradation observée",
    "pas-de-donnee": "Pas de donnée",
  },
  verdict: {
    aria: (service: string) => `Verdict pour ${service}`,
    observe: "Observé",
    hypothese: "Hypothèse",
    indetermine: "Indéterminé",
    aucuneDegradation: "Aucune dégradation observée",
    pasDeDonnee: "Pas de donnée",
    degradationDepuis: (iso: string) => `Dégradation depuis ${heure(iso)}`,
    degradation: "Dégradation",
    causeIndeterminee: "Cause indéterminée : données insuffisantes",
    causeProbable: (cause: string) => `Cause probable : ${cause}`,
    causeService: "le service lui-même",
    causeOperateur: (
      operateur: string | undefined,
      ville: string | undefined,
    ) => [operateur ?? "l'opérateur", ville].filter(Boolean).join(" à "),
    causeConnexionLocale: "la connexion locale de la sonde",
    sondesDegrade: (touchees: number, epargnees: number) =>
      `${compter(touchees, "sonde touchée", "sondes touchées")}, ${compter(epargnees, "épargnée", "épargnées")}`,
    sondesNormal: (n: number) =>
      `${compter(n, "sonde", "sondes")} dans ${pluriel(n) ? "leurs" : "ses"} valeurs habituelles`,
    mesures: (n: number, periodeMinutes: number) =>
      `${compter(n, "mesure", "mesures")}, ${periode(periodeMinutes)}`,
    aucuneMesure: (periodeMinutes: number) =>
      `Aucune mesure exploitable, ${periode(periodeMinutes)}`,
    rodage: (n: number) =>
      `${compter(n, "sonde", "sondes")} en rodage, ${pluriel(n) ? "non comptées" : "non comptée"}`,
    repere: (etat: "normal" | "degrade" | "exclu") =>
      `Repère de Madrid (hors calcul) : ${{ normal: "normal", degrade: "dégradé aussi", exclu: "exclu pour ce service" }[etat]}`,
    limite:
      "Hypothèse calculée par des règles publiques. Elle oriente, elle ne prouve pas.",
    lienMethode: "Comment c'est calculé",
  },
  accueil: {
    titre: "YITERE",
    intro:
      "Des sondes installées chez des développeurs africains mesurent en continu le temps d'accès à GitHub, npm, PyPI, Docker et jsDelivr. Quand un service ralentit, YITERE dit ce qui est observé, d'où vient probablement le problème, et ce qui a marché pour les autres.",
    enCeMoment: "En ce moment",
    aucuneDegradation: "Aucune dégradation observée sur les services suivis.",
    servicesNormaux: (n: number) =>
      `${compter(n, "autre service", "autres services")} dans ${pluriel(n) ? "leurs" : "ses"} valeurs habituelles.`,
    voirServices: "Voir tous les services",
    voirCarte: "Voir la carte",
    contribuerTitre: "Votre connexion compte aussi",
    contribuerTexte:
      "Une sonde de plus, c'est une ville ou un opérateur de plus dans les verdicts. Elle tient en un fichier, sans dépendance ni droit administrateur.",
    contribuerLien: "Héberger une sonde",
  },
  services: {
    titre: "Services",
    intro:
      "Les services dont dépend le travail quotidien d'un développeur, mesurés depuis chaque sonde.",
    famille: (famille: string) =>
      ({
        Code: "Code",
        Registres: "Registres de paquets",
        Diffusion: "Diffusion (CDN)",
      })[famille] ?? famille,
    cadence: (minutes: number) =>
      minutes < 60
        ? `toutes les ${nombre(L, minutes)} min`
        : `toutes les ${nombre(L, minutes / 60)} h`,
  },
  fiche: {
    retour: "Tous les services",
    adresse: "Adresse mesurée",
    cadence: "Fréquence",
    reponseAttendue: "Réponse attendue",
    codeAttendu: (code: number) =>
      code === 401
        ? "401, la réponse normale de ce registre sans authentification"
        : String(code),
    solutions: "Ce qui a marché pour les autres",
    aucuneSolution: "Aucune publication pour ce service pour l'instant.",
    voirEchanges: "Voir tous les échanges",
  },
  carte: {
    titre: "Carte des sondes",
    intro:
      "Chaque point est une ville où au moins une sonde mesure. Un anneau orange signale une ville citée par un verdict en cours.",
    vueCarte: "Carte",
    vueListe: "Liste",
    descriptionCarte: (villes: number, sondes: number) =>
      `Carte de l'Afrique : ${compter(sondes, "sonde", "sondes")} dans ${compter(villes, "ville", "villes")}. Le détail est dans la liste qui suit.`,
    legendeSondes: "Ville avec des sondes (le chiffre est leur nombre)",
    legendeVerdict: "Ville citée par un verdict en cours",
    ville: "Ville",
    pays: "Pays",
    sondes: "Sondes",
    verdicts: "Verdicts qui la citent",
    nbSondes: (n: number, rodage: number) =>
      rodage > 0
        ? `${nombre(L, n)}, dont ${nombre(L, rodage)} en rodage`
        : nombre(L, n),
    aucun: "Aucun",
    horsCarte:
      "Le repère de Madrid est un serveur en centre de données, hors d'Afrique : il sert de point de comparaison et n'entre dans aucun calcul.",
  },
  echanges: {
    titre: "Échanges",
    intro:
      "Ce qui a marché pour contourner une lenteur, et les questions en attente d'une mesure. Chaque publication est rattachée à un service mesuré.",
    contournement: "Solution",
    demande: "Demande",
    votes: (n: number) => compter(n, "confirmation", "confirmations"),
    publieeLe: (iso: string) => `publiée le ${dateCourte(L, iso)}`,
    publier:
      "La publication et les confirmations ouvriront avec la connexion GitHub.",
  },
  pied: {
    licence: "Code sous licence MIT. Une réalisation de l'équipe LYNXA.",
    depot: "Code source",
  },
};

function periode(minutes: number): string {
  if (minutes === 60) return "dernière heure";
  if (minutes % 60 === 0) return `${nombre(L, minutes / 60)} dernières heures`;
  return `${nombre(L, minutes)} dernières minutes`;
}

/** La forme que toute langue doit respecter. */
export type Dictionnaire = typeof fr;
