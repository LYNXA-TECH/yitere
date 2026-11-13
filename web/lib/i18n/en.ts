import { categoriePluriel, heureUTC, nombre } from "@/lib/format";
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
const heure = (iso: string) => heureUTC(L, iso);

export const en: Partielle<Dictionnaire> = {
  locale: "en",
  site: {
    devise: "My connection, my operator, or the service?",
    description:
      "Observatory of network conditions for African developers: my connection, my operator, or the service?",
    accueil: "YITERE, home",
  },
  navigation: {
    principale: "Main navigation",
    mobile: "Mobile navigation",
    carte: "Map",
    services: "Services",
    echanges: "Exchanges",
    contribuer: "Contribute",
    mesurer: "Measure",
    moi: "Me",
    seConnecter: "Sign in",
    bientot: "Soon",
    bientotTitre: "Sign-in with GitHub is coming after 23 November.",
    mesurerChezMoi: "Measure from my place",
    langue: "Language",
    allerAuContenu: "Skip to content",
  },
  source: {
    exemple: "Sample data",
    exempleTitre:
      "Some values shown on this site are samples, not real measurements.",
    partieExemple:
      "Sample data: the charts and time breakdown below are not served by the API yet.",
  },
  pageEnFrancais: "This page is only available in French for now.",
  verdict: {
    observe: "Observed",
    hypothese: "Hypothesis",
    indetermine: "Undetermined",
    aucuneDegradation: "No degradation observed",
    operateurInconnu: "Operator not detected",
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
    lienMethode: "How it is computed",
  },
  services: {
    titre: "Measured services",
    intro: (
      services: number,
      facons: number,
      references: number,
      iso: string,
    ) =>
      `${compter(services, "service", "services")} developers use every day, measured in ${nombre(L, facons)} ways (jsDelivr through a small request and a reference object), plus ${compter(references, "reference that isolates", "references that isolate")} the connection itself. Status at ${heureUTC(L, iso)}.`,
    attention: "What needs your attention",
    decompte: (degradations: number, normaux: number, sansDonnee: number) =>
      `${compter(degradations, "degradation observed", "degradations observed")} · ${compter(normaux, "normal measurement", "normal measurements")} · ${nombre(L, sansDonnee)} without recent data`,
    depuis: (iso: string) => `since ${heureUTC(L, iso)}`,
    plusLentes: (n: number, valeur: string) =>
      `${compter(n, "probe clearly slower", "probes clearly slower")} than usual (${valeur})`,
    enRodage: "Warming up",
    sansDonnee: (iso: string | null) =>
      iso ? `No data since ${heureUTC(L, iso)}` : "No data",
    sansHypothese: "No hypothesis without measurements",
    detailSansDonnee: (iso: string | null) =>
      `No probe has received a usable answer${iso ? ` since ${heureUTC(L, iso)}` : ""}. This is not zero: it is a lack of measurement.`,
    detailAlerte: (
      touchees: number,
      epargnees: number,
      repere: string,
      mesures: number,
    ) =>
      `${nombre(L, touchees)} affected · ${nombre(L, epargnees)} spared · Madrid reference (not counted): ${repere} · ${compter(mesures, "measurement", "measurements")} over the hour`,
    repere: (etat: "normal" | "degrade" | "exclu") =>
      ({ normal: "normal", degrade: "degraded too", exclu: "excluded" })[etat],
    diagnostic: "Diagnosis and evidence",
    solutions: (n: number) => `Solutions · ${nombre(L, n)}`,
    toutes: "All measurements",
    toutesDetail: "One probe type at a time: they are never mixed.",
    typeSonde: "Probe type",
    typeDeveloppeur: (n: number) => `Developer · ${nombre(L, n)}`,
    typeRepere: (n: number) => `Reference point · ${nombre(L, n)}`,
    typeNavigateur: (n: number) => `Browser · ${nombre(L, n)}`,
    legendeDeveloppeur: (rodage: number) =>
      `Developer probes · value over the last hour · availability and runs over 24 h${rodage ? ` · ${compter(rodage, "probe warming up is", "probes warming up are")} counted in runs, not in diagnoses` : ""}`,
    legendeRepere:
      "Reference point in Madrid (Spain) · last hour · represents no African country, never used in a diagnosis",
    colService: "Service",
    colEtat: (iso: string) => `Status · ${heureUTC(L, iso)}`,
    colPremierOctet: "First byte",
    colDebit: "Estimated throughput",
    colDisponibilite: "Availability 24 h",
    colPassages: "Runs 24 h",
    colEchanges: "Exchanges",
    etatNormal: "Normal",
    etatOperateur: (operateur: string) =>
      `Degraded · probable cause: ${operateur}`,
    etatService: "Degraded · probable cause: the service",
    etatLocal: "Degraded · local connection",
    etatIndetermine: "Isolated degradation · undetermined cause",
    etatRepere: "Reference · not in diagnosis",
    famille: (famille: string) =>
      ({
        Code: "Code",
        Registres: "Registries",
        Diffusion: "Delivery",
        Plateforme: "Platform",
      })[famille] ?? famille,
    cadence: (minutes: number) =>
      minutes < 60
        ? `every ${nombre(L, minutes)} min`
        : `every ${nombre(L, minutes / 60)} h`,
    codeAttendu: (code: number) => `expected code ${code}`,
    nomCourt: (cle: string) =>
      ({
        npm: "npm",
        docker: "Docker",
        "github-api": "GitHub API",
        "github-raw": "GitHub raw",
        pypi: "PyPI",
        "jsdelivr-min": "jsDelivr",
        "jsdelivr-obj": "jsDelivr reference object",
      })[cle] ?? cle,
    entier: (n: number) => nombre(L, n),
    ms: (n: number) => `${nombre(L, n)} ms`,
    mbps: (n: number) => `${nombre(L, n, 1)} Mbit/s`,
    pourcent: (part: number) => `${nombre(L, part * 100, 1)}%`,
    autres: (touchees: number, autres: string) =>
      `${nombre(L, touchees)} affected · others ${autres}`,
    medianeDe: (n: number) => `median of ${compter(n, "probe", "probes")}`,
    pasDeDonnee: "no data",
    exclu: "excluded",
    madrid: "Madrid, Spain",
    echanges: (solutions: number, demandes: number) =>
      solutions || demandes
        ? [
            solutions ? compter(solutions, "solution", "solutions") : "",
            demandes ? compter(demandes, "request", "requests") : "",
          ]
            .filter(Boolean)
            .join(" · ")
        : "no exchange",
    mobilePremierOctet: (valeur: string) => `First byte ${valeur}`,
    mobileDebit: (valeur: string) => `Throughput ${valeur}`,
    mobileDisponibilite: (valeur: string) => `${valeur} over 24 h`,
    navigateurTitre: "Browser measurements are not aggregated by service",
    navigateurTexte: (n: number, villes: string) =>
      n === 0
        ? "No browser measurement received yet: the Measure page keeps its results in your browser. They are one-off measurements, never counted in a diagnosis."
        : `${compter(n, "browser measurement", "browser measurements")} over 24 h, from ${villes}. Each is a one-off measurement with no DNS or connection detail: they appear on the map, never in a per-service table or in a diagnosis.`,
    faireMaMesure: "Run my measurement",
    noteReferences:
      'References (to isolate the connection itself): a public DNS resolver and highly available content, normal on every probe. No ranking of operators or countries while there are fewer than 3 probes per country. "No data" values are never zeros.',
    commentCestCalcule: "How it is computed",
    lentTitre: "Does a service feel slow from your place?",
    lentTexte:
      "Measure in 10 seconds, compare with the probes in your city, then see what worked for others.",
    voirEchanges: "See the exchanges",
  },
  fiche: {
    filAriane: "Breadcrumb",
    meta: (famille: string, cadence: string, code: number, passages: number) =>
      `${famille} · measured ${cadence} · expected code ${code} · ${compter(passages, "run", "runs")} over 24 h`,
    voirCarte: "See on the map",
    suivre: "Follow this incident",
    diagnostic: (iso: string) =>
      `Diagnosis · last hour, at ${heureUTC(L, iso)}`,
    observationService: "Every probe is affected.",
    observationOperateur: (n: number, operateur: string) =>
      `${compter(n, "probe", "probes")} on ${operateur} clearly slower than usual; the other operators are spared.`,
    observationLocale:
      "A single probe is affected, and so are its reference measurements.",
    observationIsolee:
      "A single probe is affected and its references are normal: no rule applies.",
    observationIndeterminee:
      "The affected probes match none of the cases the rules cover.",
    observationNormale: "Every probe is within its usual range.",
    observationRodage: (n: number) =>
      `${compter(n, "probe measures", "probes measure")} this service, but ${pluriel(n) ? "they are" : "it is"} still warming up: less than 24 h of history, not yet counted in a verdict.`,
    observationVide:
      "No probe received a usable answer over the last hour. This is not zero: it is a lack of measurement.",
    limiteOperateur:
      "It does not prove the cause: a routing problem at this operator would give the same measurements.",
    limiteService:
      "Hypothesis computed by public rules: it points a direction, it proves nothing.",
    limiteLocale:
      "The other probes are spared: the service and the operators work.",
    limiteIndeterminee:
      "It would take 2 affected probes on the same operator, or probes in 2 countries, to suggest a cause.",
    limiteVide:
      "A lack of data can come from the probes as well as from the service.",
    preuves: "Evidence",
    touchee: "Affected",
    epargnee: "Spared",
    repere: "Reference",
    rodage: "Warming up",
    preuveTouchee: (sonde: string, valeur: string, habituel: string) =>
      `${sonde}: ${valeur} (usually ${habituel})`,
    preuveEpargnee: (sonde: string, valeur: string) =>
      `${sonde}: ${valeur}, normal`,
    preuveRepere: (etat: "normal" | "degrade" | "exclu") =>
      etat === "exclu"
        ? "Madrid: excluded for this service (same server)"
        : `Madrid (not counted): ${etat === "normal" ? "normal" : "degraded too"}`,
    preuveRodage: (n: number) =>
      `${compter(n, "probe", "probes")} warming up (less than 24 h of history), not counted`,
    piedPreuves: (mesures: number) =>
      `${compter(mesures, "measurement", "measurements")} from developer probes over the last hour · reference and browser measurements not counted`,
    solutionsTitre: "What worked for other developers",
    solutionsDetail:
      "Solutions posted during this incident come first. Not verified by YITERE: confirmations come from the community.",
    partager: "Share what worked",
    aucuneSolution: "No solution posted for this service. Found a workaround?",
    premiere: "Be the first to share it.",
    demanderAutreVille: "Ask for a measurement from another city",
    demandeEnAttente: (ville: string) =>
      !ville
        ? "No probe on site yet: the question stays open. You can answer it by installing a probe."
        : `No probe in ${ville} yet: the question stays open. The Madrid reference sees this service as normal, so the service works. Are you in ${ville}? Install a probe to answer.`,
    demandeRepondue: "Answer from the probes: see the diagnosis above.",
    tuilePremierOctetTouchees: (n: number) =>
      `First byte · ${compter(n, "affected probe", "affected probes")}`,
    tuilePremierOctet: "First byte · developer probes",
    tuileDebit: "Estimated throughput · developer probes",
    tuileHabituel: (valeur: string) => `usually ${valeur}`,
    tuilePiedTouchees: (mesures: number, epargnees: string) =>
      `Last hour · ${compter(mesures, "measurement", "measurements")} · spared probes: ${epargnees} on average · usual: 7-day median`,
    tuilePiedMediane: (mesures: number) =>
      `Median over the last hour · ${compter(mesures, "measurement", "measurements")}`,
    tuileDisponibilite: "Availability · developer probes",
    tuilePiedDisponibilite: (passages: number) =>
      `Successful runs over 24 h · ${compter(passages, "run", "runs")}`,
    tuileRepere: (unite: "ms" | "mbps") =>
      unite === "ms"
        ? "First byte · reference point"
        : "Throughput · reference point",
    tuileRepereEtat: (etat: "normal" | "degrade" | "exclu") =>
      ({ normal: "normal", degrade: "degraded", exclu: "excluded" })[etat],
    tuilePiedRepere:
      "Madrid, Spain · last hour · 6 measurements · represents no African country",
    graphiqueTitre: (unite: "ms" | "mbps") =>
      unite === "ms"
        ? "Time to first byte · developer probes"
        : "Estimated throughput · developer probes",
    graphiqueSous24:
      "Hourly median, 24 h · one line per probe · orange area: degradation observed",
    graphiqueSous7j:
      "Median per 6-hour step, 7 days · one line per probe · orange area: degradation observed",
    periode: "Period",
    h24: "24 h",
    j7: "7 days",
    maintenant: "now",
    jourMoins: (n: number) => `D−${n}`,
    // Sans operateur detecte, la sonde se nomme par sa ville : « Dakar·1 », jamais « ?·1 ».
    abregeSonde: (operateur: string | null, numero: number, ville: string) =>
      operateur === null
        ? `${ville}·${numero}`
        : `${operateur.replace(/^Opérateur /, "Op. ")}·${numero} ${ville.slice(0, 3)}`,
    enRodage: "(warming up)",
    lectureOperateur: (operateur: string) =>
      `Only the ${operateur} probes drop, at the same moment. The other operators stay within their usual range, and so does the Madrid reference: the service works, the problem is on the path.`,
    lectureIsolee: (sonde: string) =>
      `A single probe drops (${sonde}). Its reference measurements stay normal and no other probe is affected: the rules cannot point to a cause.`,
    lectureNormale: "No probe drops over the period.",
    lectureVide:
      "The lines stop at the last measurement received: what follows is a lack of data, not a zero.",
    alternative: (sondes: number, periode: string, lecture: string) =>
      `One line per probe, ${compter(sondes, "probe", "probes")} over ${periode}. ${lecture}`,
    noteBande: (repere: string) =>
      `Grey band: the probes' usual values (7-day median). The Madrid reference and browser measurements are shown separately, never in this chart. Madrid reference: ${repere}.`,
    tempsTitre: "Where the time goes",
    tempsDetail: "Last run of two probes in Conakry. Same scale for both bars.",
    dns: "DNS",
    connexion: "Connection",
    tls: "TLS handshake",
    premierOctet: "First byte",
    attente: "Server wait",
    total: (valeur: string) => `First byte ${valeur}`,
    tempsDetailApi:
      "Last run of one affected and one unaffected probe. Same scale for both bars.",
    tempsLectureEcart: (etape: string, touchee: string, epargnee: string) =>
      `For the affected probe, the "${etape}" step grows the most: ${touchee}, against ${epargnee} for the unaffected probe. The measurements do not say where on the path.`,
    tempsLecturePareil:
      "On this run, the affected probe is not slower than the unaffected one at any step.",
    tempsLectureSeul:
      "Only one run broken down so far: an affected and an unaffected probe are needed to compare.",
    tempsLectureOperateur: (operateur: string) =>
      `On ${operateur}, connection and encryption take more than twice as long, and the wait for the first byte grows sharply. DNS resolution barely changes: the service's name is found, it is the exchange with the server that is slow. The measurements do not say where on the path.`,
    tempsLecture:
      "Only the wait for the first byte grows for the affected probe; DNS, connection and encryption stay close to the other probe.",
  },
  carte: {
    titre: "Map",
    resume: (sondes: number, villes: number, pays: number) =>
      `${compter(sondes, "developer probe", "developer probes")} in ${compter(villes, "city", "cities")} across ${compter(pays, "country", "countries")}, and a reference point in Madrid (Spain). Measurements every 10 minutes.`,
    serviceAffiche: "Service shown on the map",
    tousServices: "All services (worst status)",
    enCeMoment: "Right now",
    lesMesures: (n: number) => `All ${nombre(L, n)} measurements`,
    aucuneDegradation: (n: number) =>
      `No degradation observed on the ${nombre(L, n)} measurements.`,
    montrer: "Show on the map",
    compteurs: (
      touchees: number,
      epargnees: number,
      mesures: number,
      rodage: number,
    ) =>
      `${nombre(L, touchees)} affected · ${nombre(L, epargnees)} spared · ${compter(mesures, "measurement", "measurements")} over the hour${rodage ? ` · ${nombre(L, rodage)} warming up, not counted` : ""}`,
    aucuneMesure: "No usable measurement over the last hour",
    communaute: "What the community shares",
    tousEchanges: "All exchanges",
    aMarchePour: (n: number, villes: string, confirmee: boolean) =>
      `✓ Worked for ${compter(n, "person", "people")} · ${villes}${confirmee ? " · confirmed by the community" : ""}`,
    pasConfirmee: "Not confirmed yet",
    attente: (ville: string) =>
      ville ? `Waiting for a probe in ${ville}` : "Waiting for a probe",
    repondue: "Answered by the data",
    contexteIncident: (
      demande: boolean,
      service: string,
      operateur: string,
      ville: string,
    ) =>
      `${demande ? "Asked" : "Posted"} during the ${service} degradation · ${operateur} · ${ville}`,
    contexteLibre: (demande: boolean, quand: string, ville: string) =>
      `${demande ? "Asked" : "Posted"} ${quand}${demande ? "" : ", outside any incident"}${ville ? ` · ${ville}` : ""}`,
    lentTitre: "Slow at your place right now?",
    lentTexte:
      "Your browser measures the monitored services in about ten seconds and tells you whether the probes in your city see the same thing.",
    note: "Browser measurements and the Madrid reference point never count in a diagnosis.",
    afrique: "Africa",
    niveau: "Map level",
    calques: "Layers",
    mesuresNavigateur: "Browser measurements",
    entraide: "Mutual help",
    affichage: "Display",
    vueCarte: "Map",
    vueListe: "List",
    zoomer: "Zoom in",
    dezoomer: "Zoom out",
    legende: "Legend",
    legendeNormal: "Normal",
    legendeDegrade: "Degradation observed",
    legendeRodage: "Warming up or no data",
    legendeRepere: "Reference point (Madrid, not counted)",
    legendeLien: "Mutual-help link, not a network path",
    legendePulse: "A pulsing ring: the probe measured less than 15 min ago.",
    repere: "Reference point · Madrid, Spain",
    description: (sondes: number, villes: number) =>
      `Map of Africa: ${compter(sondes, "probe", "probes")} in ${compter(villes, "city", "cities")}. The List view gives the same content as text.`,
    listeTitre: (heure: string) => `List view · ${heure}`,
    listeDetail: "The same information as the map, city by city.",
    etatSonde: (
      etat: "normal" | "degrade" | "pas-de-donnee" | "absente" | "rodage",
    ) =>
      ({
        normal: "Normal",
        degrade: "Degradation observed",
        "pas-de-donnee": "No data",
        absente: "Not installed yet",
        rodage: "Warming up (less than 24 h)",
      })[etat],
    sonde: (operateur: string, numero: number) => `${operateur} · ${numero}`,
    repereHorsCalcul: "Reference point, not counted",
    lire: "Play",
    pause: "Pause",
    enDirect: "Live",
    sousDirect: (exemple: boolean) =>
      exemple ? "Live · sample data" : "Live · probe measurements",
    sousRelecture: (heure: string) => `Replay · hour ending at ${heure}`,
    vitesse: (n: number) => `Speed ${n}×`,
    heureAffichee: "Hour shown",
    periode: "Period",
    h24: "24 h",
    sondesEntraide: "Probes and mutual help",
    hier: (heure: string) => `${heure} yesterday`,
    maintenant: "now",
    laneService: (service: string, operateur: string) =>
      `${service} · ${operateur}`,
    laneIndeterminee: (service: string) => `${service} · undetermined cause`,
    laneAbsence: (service: string) => `${service} · no data`,
    laneLocale: (ville: string, sonde: string) =>
      `Local connection · ${ville} ${sonde}`,
    publication: "Post",
    mesureNavigateur: "Browser measurement",
    fermer: "Close the selection",
    ville: "City",
    sondes: "Probes",
  },
  publication: {
    aucune: "No posts yet.",
    prochaineEtape:
      "Every post is reviewed by the team before it appears. Confirming and replying will open with GitHub sign-in, after 23 November.",
    publier: "Post",
    proposer: "Share a fix or ask for a measurement",
    ilYA: (minutes: number) => {
      if (minutes < 1) return "just now";
      if (minutes < 60) return `${nombre(L, Math.round(minutes))} min ago`;
      if (minutes < 1440) {
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return `${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""} ago`;
      }
      const jours = Math.round(minutes / 1440);
      return jours === 1 ? "yesterday" : `${jours} days ago`;
    },
    solution: "Solution",
    demande: "Measurement request",
    confirmee: "Confirmed by the community",
    pendantIncident: "Posted during this incident",
    utile: "useful",
    voterUtile: (n: number) => `Useful, ${compter(n, "vote", "votes")}`,
    operateur: (nom: string) => nom,
    pendantDegradation: (service: string, operateur: string) =>
      `during the ${service} degradation · ${operateur}`,
    horsIncident: "outside any incident",
    copier: "Copy",
    copierCommande: "Copy the command",
    copie: "Copied",
    aMarche: "Worked for me too",
    confirmations: (n: number, villes: string, operateurs: string) =>
      `${compter(n, "confirmation", "confirmations")} · ${villes}${operateurs ? ` · ${operateurs}` : ""}`,
    pasConfirmee: "Not confirmed yet: try it and say whether it worked.",
    reponses: (n: number) => (n ? compter(n, "reply", "replies") : "Reply"),
    signaler: "Report",
    connexionRequise:
      "To confirm, vote or report, sign in with GitHub. Sign-in opens with the exchanges API.",
    statutAttente: (ville: string) =>
      ville ? `waiting for a probe in ${ville}` : "waiting for a probe",
    statutRepondue: "answered by the data",
    suivent: (n: number) =>
      `${compter(n, "person follows", "people follow")} this request`,
  },
};
