import { categoriePluriel, heureUTC, nombre } from "@/lib/format";

/**
 * Tous les textes du site en francais. C'est la langue de reference :
 * son type definit les cles que les autres langues peuvent fournir.
 * Une phrase avec des variables est une fonction : l'ordre des mots reste libre dans chaque langue.
 */

const L = "fr";
const pluriel = (n: number) => categoriePluriel(L, n) !== "one";
const compter = (n: number, un: string, plusieurs: string) =>
  `${nombre(L, n)} ${pluriel(n) ? plusieurs : un}`;
const heure = (iso: string) => heureUTC(L, iso);

export const fr = {
  site: {
    devise: "Ma connexion, mon opérateur, ou le service ?",
    description:
      "Observatoire des conditions réseau du développement africain : ma connexion, mon opérateur, ou le service ?",
    accueil: "YITERE, accueil",
  },
  navigation: {
    principale: "Navigation principale",
    mobile: "Navigation mobile",
    carte: "Carte",
    services: "Services",
    echanges: "Échanges",
    contribuer: "Contribuer",
    mesurer: "Mesurer",
    moi: "Moi",
    seConnecter: "Se connecter",
    bientot: "Bientôt",
    bientotTitre: "La connexion avec GitHub arrive après le 23 novembre.",
    mesurerChezMoi: "Mesurer depuis chez moi",
    langue: "Langue",
    allerAuContenu: "Aller au contenu",
  },
  source: {
    exemple: "Données d'exemple",
    exempleTitre:
      "Des valeurs affichées sur ce site sont des exemples, pas des mesures réelles.",
    partieExemple:
      "Données d'exemple : les courbes et la décomposition du temps ci-dessous attendent encore leur route dans l'API.",
  },
  pageEnFrancais: "Cette page n'existe qu'en français pour l'instant.",
  verdict: {
    observe: "Observé",
    hypothese: "Hypothèse",
    indetermine: "Indéterminé",
    aucuneDegradation: "Aucune dégradation observée",
    operateurInconnu: "Opérateur non détecté",
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
    lienMethode: "Comment c'est calculé",
  },
  services: {
    titre: "Services mesurés",
    intro: (
      services: number,
      facons: number,
      references: number,
      iso: string,
    ) =>
      `${compter(services, "service", "services")} du quotidien des développeurs, mesurés de ${nombre(L, facons)} façons (jsDelivr par une petite requête et par un objet témoin), plus ${compter(references, "référence qui isole", "références qui isolent")} la connexion elle-même. État à ${heureUTC(L, iso)}.`,
    attention: "Ce qui demande votre attention",
    decompte: (degradations: number, normaux: number, sansDonnee: number) =>
      `${compter(degradations, "dégradation observée", "dégradations observées")} · ${compter(normaux, "mesure normale", "mesures normales")} · ${nombre(L, sansDonnee)} sans donnée récente`,
    depuis: (iso: string) => `depuis ${heureUTC(L, iso)}`,
    plusLentes: (n: number, valeur: string) =>
      `${compter(n, "sonde nettement plus lente", "sondes nettement plus lentes")} que d'habitude (${valeur})`,
    enRodage: "En rodage",
    sansDonnee: (iso: string | null) =>
      iso ? `Pas de donnée depuis ${heureUTC(L, iso)}` : "Pas de donnée",
    sansHypothese: "Aucune hypothèse sans mesure",
    detailSansDonnee: (iso: string | null) =>
      `Aucune sonde n'a reçu de réponse exploitable${iso ? ` depuis ${heureUTC(L, iso)}` : ""}. Ce n'est pas zéro : c'est une absence de mesure.`,
    detailAlerte: (
      touchees: number,
      epargnees: number,
      repere: string,
      mesures: number,
    ) =>
      `${compter(touchees, "touchée", "touchées")} · ${compter(epargnees, "épargnée", "épargnées")} · Repère Madrid (hors calcul) : ${repere} · ${compter(mesures, "mesure", "mesures")} sur l'heure`,
    repere: (etat: "normal" | "degrade" | "exclu") =>
      ({ normal: "normal", degrade: "dégradé aussi", exclu: "exclu" })[etat],
    diagnostic: "Diagnostic et preuves",
    solutions: (n: number) => `Solutions · ${nombre(L, n)}`,
    toutes: "Toutes les mesures",
    toutesDetail: "Un type de sonde à la fois : ils ne sont jamais mélangés.",
    typeSonde: "Type de sonde",
    typeDeveloppeur: (n: number) => `Développeur · ${nombre(L, n)}`,
    typeRepere: (n: number) => `Point de repère · ${nombre(L, n)}`,
    typeNavigateur: (n: number) => `Navigateur · ${nombre(L, n)}`,
    legendeDeveloppeur: (rodage: number) =>
      `Sondes développeur · valeur de la dernière heure · disponibilité et passages sur 24 h${rodage ? ` · ${compter(rodage, "sonde en rodage comptée", "sondes en rodage comptées")} dans les passages, pas dans les diagnostics` : ""}`,
    legendeRepere:
      "Point de repère à Madrid (Espagne) · dernière heure · ne représente aucun pays africain, n'entre dans aucun diagnostic",
    colService: "Service",
    colEtat: (iso: string) => `État · ${heureUTC(L, iso)}`,
    colPremierOctet: "Premier octet",
    colDebit: "Débit estimé",
    colDisponibilite: "Disponibilité 24 h",
    colPassages: "Passages 24 h",
    colEchanges: "Échanges",
    etatNormal: "Normal",
    etatOperateur: (operateur: string) =>
      `Dégradé · cause probable : ${operateur}`,
    etatService: "Dégradé · cause probable : le service",
    etatLocal: "Dégradé · connexion locale",
    etatIndetermine: "Dégradation isolée · cause indéterminée",
    etatRepere: "Repère · hors diagnostic",
    famille: (famille: string) =>
      ({
        Code: "Code",
        Registres: "Registres",
        Diffusion: "Diffusion",
        Plateforme: "Plateforme",
      })[famille] ?? famille,
    cadence: (minutes: number) =>
      minutes < 60
        ? `toutes les ${nombre(L, minutes)} min`
        : `toutes les ${nombre(L, minutes / 60)} h`,
    codeAttendu: (code: number) => `code attendu ${code}`,
    nomCourt: (cle: string) =>
      ({
        npm: "npm",
        docker: "Docker",
        "github-api": "GitHub API",
        "github-raw": "GitHub raw",
        pypi: "PyPI",
        "jsdelivr-min": "jsDelivr",
        "jsdelivr-obj": "jsDelivr témoin",
      })[cle] ?? cle,
    entier: (n: number) => nombre(L, n),
    ms: (n: number) => `${nombre(L, n)} ms`,
    mbps: (n: number) => `${nombre(L, n, 1)} Mbit/s`,
    pourcent: (part: number) => `${nombre(L, part * 100, 1)} %`,
    autres: (touchees: number, autres: string) =>
      `${compter(touchees, "touchée", "touchées")} · autres ${autres}`,
    medianeDe: (n: number) => `médiane de ${compter(n, "sonde", "sondes")}`,
    pasDeDonnee: "pas de donnée",
    exclu: "exclu",
    madrid: "Madrid, Espagne",
    echanges: (solutions: number, demandes: number) =>
      solutions || demandes
        ? [
            solutions ? compter(solutions, "solution", "solutions") : "",
            demandes ? compter(demandes, "demande", "demandes") : "",
          ]
            .filter(Boolean)
            .join(" · ")
        : "aucun échange",
    mobilePremierOctet: (valeur: string) => `Premier octet ${valeur}`,
    mobileDebit: (valeur: string) => `Débit ${valeur}`,
    mobileDisponibilite: (valeur: string) => `${valeur} sur 24 h`,
    navigateurTitre: "Les mesures navigateur ne sont pas agrégées par service",
    navigateurTexte: (n: number, villes: string) =>
      n === 0
        ? "Aucune mesure navigateur reçue pour l'instant : la page Mesurer garde ses résultats dans votre navigateur. Ce sont des mesures ponctuelles, jamais comptées dans un diagnostic."
        : `${compter(n, "mesure navigateur", "mesures navigateur")} sur 24 h, depuis ${villes}. Chacune est une mesure ponctuelle, sans détail DNS ni connexion : elles apparaissent sur la carte, jamais dans un tableau par service ni dans un diagnostic.`,
    faireMaMesure: "Faire ma mesure",
    noteReferences:
      "Références (pour isoler la connexion elle-même) : résolveur DNS public et contenu très disponible, normales sur toutes les sondes. Aucun classement entre opérateurs ou pays tant qu'il y a moins de 3 sondes par pays. Les valeurs « pas de donnée » ne sont jamais des zéros.",
    commentCestCalcule: "Comment c'est calculé",
    lentTitre: "Un service vous semble lent chez vous ?",
    lentTexte:
      "Mesurez en 10 secondes, comparez avec les sondes de votre ville, puis voyez ce qui a marché chez les autres.",
    voirEchanges: "Voir les échanges",
  },
  fiche: {
    filAriane: "Fil d'Ariane",
    meta: (famille: string, cadence: string, code: number, passages: number) =>
      `${famille} · mesuré ${cadence} · code attendu ${code} · ${compter(passages, "passage", "passages")} sur 24 h`,
    voirCarte: "Voir sur la carte",
    suivre: "Suivre cet incident",
    diagnostic: (iso: string) =>
      `Diagnostic · dernière heure, à ${heureUTC(L, iso)}`,
    observationService: "Toutes les sondes sont touchées.",
    observationOperateur: (n: number, operateur: string) =>
      `${compter(n, "sonde", "sondes")} de ${operateur} nettement plus ${pluriel(n) ? "lentes" : "lente"} que d'habitude ; les autres opérateurs sont épargnés.`,
    observationLocale:
      "Une seule sonde est touchée, et ses mesures de référence aussi.",
    observationIsolee:
      "Une seule sonde est touchée, et ses références sont normales : aucune règle ne s'applique.",
    observationIndeterminee:
      "Les sondes touchées ne forment aucun des cas prévus par les règles.",
    observationNormale: "Chaque sonde est dans ses valeurs habituelles.",
    observationRodage: (n: number) =>
      `${compter(n, "sonde mesure", "sondes mesurent")} ce service, mais ${pluriel(n) ? "elles sont" : "elle est"} encore en rodage : moins de 24 h d'historique, pas encore ${pluriel(n) ? "comptées" : "comptée"} dans un verdict.`,
    observationVide:
      "Aucune sonde n'a reçu de réponse exploitable sur la dernière heure. Ce n'est pas zéro : c'est une absence de mesure.",
    limiteOperateur:
      "Elle ne prouve pas la cause : un problème de routage chez cet opérateur donnerait les mêmes mesures.",
    limiteService:
      "Hypothèse calculée par des règles publiques : elle oriente, elle ne prouve pas.",
    limiteLocale:
      "Les autres sondes sont épargnées : le service et les opérateurs fonctionnent.",
    limiteIndeterminee:
      "Il faudrait 2 sondes du même opérateur touchées, ou des sondes dans 2 pays, pour proposer une cause.",
    limiteVide: "Une absence de donnée peut venir des sondes comme du service.",
    preuves: "Preuves",
    touchee: "Touchée",
    epargnee: "Épargnée",
    repere: "Repère",
    rodage: "Rodage",
    preuveTouchee: (sonde: string, valeur: string, habituel: string) =>
      `${sonde} : ${valeur} (habituel ${habituel})`,
    preuveEpargnee: (sonde: string, valeur: string) =>
      `${sonde} : ${valeur}, normale`,
    preuveRepere: (etat: "normal" | "degrade" | "exclu") =>
      etat === "exclu"
        ? "Madrid : exclu pour ce service (même serveur)"
        : `Madrid (hors calcul) : ${etat === "normal" ? "normal" : "dégradé aussi"}`,
    preuveRodage: (n: number) =>
      `${compter(n, "sonde", "sondes")} en rodage (moins de 24 h d'historique), ${pluriel(n) ? "non comptées" : "non comptée"}`,
    piedPreuves: (mesures: number) =>
      `${compter(mesures, "mesure", "mesures")} des sondes développeur sur la dernière heure · repère et mesures navigateur hors calcul`,
    solutionsTitre: "Ce qui a marché chez d'autres développeurs",
    solutionsDetail:
      "Les solutions publiées pendant cet incident viennent en premier. Non vérifiées par YITERE : les confirmations le sont par la communauté.",
    partager: "Partager ce qui a marché",
    aucuneSolution:
      "Aucune solution publiée pour ce service. Vous avez trouvé un contournement ?",
    premiere: "Soyez la première personne à le partager.",
    demanderAutreVille: "Demander une mesure depuis une autre ville",
    demandeEnAttente: (ville: string) =>
      `Aucune sonde à ${ville} pour l'instant : la question reste ouverte. Le point de repère de Madrid voit ce service normal, donc le service fonctionne. Vous êtes à ${ville} ? Installez une sonde pour répondre.`,
    demandeRepondue: "Réponse des sondes : voir le diagnostic ci-dessus.",
    tuilePremierOctetTouchees: (n: number) =>
      `Premier octet · ${compter(n, "sonde touchée", "sondes touchées")}`,
    tuilePremierOctet: "Premier octet · sondes développeur",
    tuileDebit: "Débit estimé · sondes développeur",
    tuileHabituel: (valeur: string) => `habituel ${valeur}`,
    tuilePiedTouchees: (mesures: number, epargnees: string) =>
      `Dernière heure · ${compter(mesures, "mesure", "mesures")} · sondes épargnées : ${epargnees} en moyenne · habituel : médiane sur 7 jours`,
    tuilePiedMediane: (mesures: number) =>
      `Médiane de la dernière heure · ${compter(mesures, "mesure", "mesures")}`,
    tuileDisponibilite: "Disponibilité · sondes développeur",
    tuilePiedDisponibilite: (passages: number) =>
      `Passages aboutis sur 24 h · ${compter(passages, "passage", "passages")}`,
    tuileRepere: (unite: "ms" | "mbps") =>
      unite === "ms"
        ? "Premier octet · point de repère"
        : "Débit · point de repère",
    tuileRepereEtat: (etat: "normal" | "degrade" | "exclu") =>
      ({ normal: "normal", degrade: "dégradé", exclu: "exclu" })[etat],
    tuilePiedRepere:
      "Madrid, Espagne · dernière heure · 6 mesures · ne représente aucun pays africain",
    graphiqueTitre: (unite: "ms" | "mbps") =>
      unite === "ms"
        ? "Temps au premier octet · sondes développeur"
        : "Débit estimé · sondes développeur",
    graphiqueSous24:
      "Médiane horaire, 24 h · une ligne par sonde · zone orangée : dégradation observée",
    graphiqueSous7j:
      "Médiane par pas de 6 h, 7 jours · une ligne par sonde · zone orangée : dégradation observée",
    periode: "Période",
    h24: "24 h",
    j7: "7 jours",
    maintenant: "maintenant",
    jourMoins: (n: number) => `J−${n}`,
    abregeSonde: (operateur: string | null, numero: number, ville: string) =>
      `${(operateur ?? "?").replace(/^Opérateur /, "Op. ")}·${numero} ${ville.slice(0, 3)}`,
    enRodage: "(rodage)",
    lectureOperateur: (operateur: string) =>
      `Seules les sondes de ${operateur} décrochent, au même moment. Les autres opérateurs restent dans leurs valeurs habituelles, et le repère de Madrid aussi : le service fonctionne, le problème est sur le chemin.`,
    lectureIsolee: (sonde: string) =>
      `Une seule sonde décroche (${sonde}). Ses mesures de référence restent normales et aucune autre sonde n'est touchée : les règles ne permettent pas de désigner une cause.`,
    lectureNormale: "Aucune sonde ne décroche sur la période.",
    lectureVide:
      "Les courbes s'arrêtent à la dernière mesure reçue : la suite est une absence de donnée, pas un zéro.",
    alternative: (sondes: number, periode: string, lecture: string) =>
      `Une courbe par sonde, ${compter(sondes, "sonde", "sondes")} sur ${periode}. ${lecture}`,
    noteBande: (repere: string) =>
      `Bande grise : valeurs habituelles des sondes (médiane sur 7 jours). Le point de repère de Madrid et les mesures navigateur sont affichés à part, jamais dans ce graphique. Repère Madrid : ${repere}.`,
    tempsTitre: "Où part le temps",
    tempsDetail:
      "Dernier passage de deux sondes de Conakry. Même échelle pour les deux barres.",
    dns: "DNS",
    connexion: "Connexion",
    tls: "Chiffrement TLS",
    premierOctet: "Premier octet",
    total: (valeur: string) => `Total ${valeur}`,
    tempsLectureOperateur: (operateur: string) =>
      `Chez ${operateur}, la connexion et le chiffrement prennent plus du double, et l'attente du premier octet s'allonge fortement. La résolution DNS, elle, change peu : le nom du service est bien trouvé, c'est l'échange avec le serveur qui est lent. Les mesures ne disent pas où, sur le chemin.`,
    tempsLecture:
      "Seule l'attente du premier octet s'allonge pour la sonde touchée ; DNS, connexion et chiffrement restent proches de l'autre sonde.",
  },
  carte: {
    titre: "Carte",
    resume: (sondes: number, villes: number, pays: number) =>
      `${compter(sondes, "sonde développeur", "sondes développeur")} dans ${compter(villes, "ville", "villes")} de ${nombre(L, pays)} pays, et un point de repère à Madrid (Espagne). Mesures toutes les 10 minutes.`,
    serviceAffiche: "Service affiché sur la carte",
    tousServices: "Tous les services (pire état)",
    enCeMoment: "En ce moment",
    lesMesures: (n: number) => `Les ${nombre(L, n)} mesures`,
    aucuneDegradation: (n: number) =>
      `Aucune dégradation observée sur les ${nombre(L, n)} mesures.`,
    montrer: "Montrer sur la carte",
    compteurs: (
      touchees: number,
      epargnees: number,
      mesures: number,
      rodage: number,
    ) =>
      `${compter(touchees, "touchée", "touchées")} · ${compter(epargnees, "épargnée", "épargnées")} · ${compter(mesures, "mesure", "mesures")} sur l'heure${rodage ? ` · ${nombre(L, rodage)} en rodage, ${pluriel(rodage) ? "non comptées" : "non comptée"}` : ""}`,
    aucuneMesure: "Aucune mesure exploitable sur la dernière heure",
    communaute: "Ce que la communauté partage",
    tousEchanges: "Tous les échanges",
    aMarchePour: (n: number, villes: string, confirmee: boolean) =>
      `✓ A marché pour ${compter(n, "personne", "personnes")} · ${villes}${confirmee ? " · confirmée par la communauté" : ""}`,
    pasConfirmee: "Pas encore confirmée",
    attente: (ville: string) => `En attente d'une sonde à ${ville}`,
    repondue: "Répondue par la donnée",
    contexteIncident: (
      demande: boolean,
      service: string,
      operateur: string,
      ville: string,
    ) =>
      `${demande ? "Demandée" : "Publiée"} pendant la dégradation ${service} · ${operateur} · ${ville}`,
    contexteLibre: (demande: boolean, quand: string, ville: string) =>
      `${demande ? "Demandée" : "Publiée"} ${quand}${demande ? "" : ", hors incident"} · ${ville}`,
    lentTitre: "Lent chez vous en ce moment ?",
    lentTexte:
      "Votre navigateur mesure les services suivis en une dizaine de secondes et vous dit si les sondes de votre ville voient la même chose.",
    note: "Les mesures navigateur et le point de repère de Madrid ne comptent jamais dans les diagnostics.",
    afrique: "Afrique",
    niveau: "Niveau de la carte",
    calques: "Calques",
    mesuresNavigateur: "Mesures navigateur",
    entraide: "Entraide",
    affichage: "Affichage",
    vueCarte: "Carte",
    vueListe: "Liste",
    zoomer: "Zoomer",
    dezoomer: "Dézoomer",
    legende: "Légende",
    legendeNormal: "Normal",
    legendeDegrade: "Dégradation observée",
    legendeRodage: "En rodage ou pas de donnée",
    legendeRepere: "Point de repère (Madrid, hors calcul)",
    legendeLien: "Lien d'entraide, pas un chemin réseau",
    legendePulse:
      "Un anneau qui pulse : la sonde a mesuré il y a moins de 15 min.",
    repere: "Point de repère · Madrid, Espagne",
    description: (sondes: number, villes: number) =>
      `Carte de l'Afrique : ${compter(sondes, "sonde", "sondes")} dans ${compter(villes, "ville", "villes")}. La vue Liste donne le même contenu en texte.`,
    listeTitre: (heure: string) => `Vue liste · ${heure}`,
    listeDetail: "Les mêmes informations que la carte, ville par ville.",
    etatSonde: (
      etat: "normal" | "degrade" | "pas-de-donnee" | "absente" | "rodage",
    ) =>
      ({
        normal: "Normal",
        degrade: "Dégradation observée",
        "pas-de-donnee": "Pas de donnée",
        absente: "Pas encore installée",
        rodage: "En rodage (moins de 24 h)",
      })[etat],
    sonde: (operateur: string, numero: number) => `${operateur} · ${numero}`,
    repereHorsCalcul: "Point de repère, hors calcul",
    lire: "Lire",
    pause: "Pause",
    enDirect: "En direct",
    sousDirect: (exemple: boolean) =>
      exemple
        ? "En direct · données d'exemple"
        : "En direct · mesures des sondes",
    sousRelecture: (heure: string) =>
      `Relecture · heure se terminant à ${heure}`,
    vitesse: (n: number) => `Vitesse ${n}×`,
    heureAffichee: "Heure affichée",
    periode: "Période",
    h24: "24 h",
    sondesEntraide: "Sondes et entraide",
    hier: (heure: string) => `${heure} hier`,
    maintenant: "maintenant",
    laneService: (service: string, operateur: string) =>
      `${service} · ${operateur}`,
    laneIndeterminee: (service: string) => `${service} · cause indéterminée`,
    laneAbsence: (service: string) => `${service} · pas de donnée`,
    laneLocale: (ville: string, sonde: string) =>
      `Connexion locale · ${ville} ${sonde}`,
    publication: "Publication",
    mesureNavigateur: "Mesure navigateur",
    fermer: "Fermer la sélection",
    ville: "Ville",
    sondes: "Sondes",
  },
  publication: {
    aucune: "Aucune publication pour l'instant.",
    prochaineEtape:
      "Publier, confirmer et répondre ouvriront avec la connexion GitHub, après le 23 novembre.",
    ilYA: (minutes: number) => {
      if (minutes < 1) return "à l'instant";
      if (minutes < 60) return `il y a ${nombre(L, Math.round(minutes))} min`;
      if (minutes < 1440) {
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return `il y a ${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""}`;
      }
      const jours = Math.round(minutes / 1440);
      return jours === 1 ? "hier" : `il y a ${jours} jours`;
    },
    solution: "Solution",
    demande: "Demande de mesure",
    confirmee: "Confirmée par la communauté",
    pendantIncident: "Publiée pendant cet incident",
    utile: "utile",
    voterUtile: (n: number) => `Utile, ${compter(n, "vote", "votes")}`,
    operateur: (nom: string) => nom.replace(/^Opérateur/, "opérateur"),
    pendantDegradation: (service: string, operateur: string) =>
      `pendant la dégradation ${service} · ${operateur.replace(/^Opérateur/, "opérateur")}`,
    horsIncident: "hors incident",
    copier: "Copier",
    copierCommande: "Copier la commande",
    copie: "Copié",
    aMarche: "A marché pour moi aussi",
    confirmations: (n: number, villes: string, operateurs: string) =>
      `${compter(n, "confirmation", "confirmations")} · ${villes}${operateurs ? ` · ${operateurs}` : ""}`,
    pasConfirmee:
      "Pas encore confirmée : essayez-la et dites si elle a marché.",
    reponses: (n: number) =>
      n ? compter(n, "réponse", "réponses") : "Répondre",
    signaler: "Signaler",
    connexionRequise:
      "Pour confirmer, voter ou signaler, il faut se connecter avec GitHub. La connexion ouvrira avec l'API des échanges.",
    statutAttente: (ville: string) => `en attente d'une sonde à ${ville}`,
    statutRepondue: "répondue par la donnée",
    suivent: (n: number) =>
      `${compter(n, "personne suit", "personnes suivent")} cette demande`,
  },
};

/** La forme que toute langue doit respecter. */
export type Dictionnaire = typeof fr;
