/**
 * Jeu de donnees d'EXEMPLE, repris tel quel de la maquette v3. Rien ici n'est une mesure reelle.
 * Horloge d'exemple : « maintenant » est le 3 novembre 2026 a 17:00 GMT.
 * Un pas h (entier, de -167 a 0) est l'heure qui se termine a 17:00 + h.
 */

export const MAINTENANT = Date.UTC(2026, 10, 3, 17, 0);

export type Ville = { cle: string; nom: string; pays: string };

export const VILLES_EXEMPLE: Record<string, Ville> = {
  cky: { cle: "cky", nom: "Conakry", pays: "GN" },
  abj: { cle: "abj", nom: "Abidjan", pays: "CI" },
  dkr: { cle: "dkr", nom: "Dakar", pays: "SN" },
  bko: { cle: "bko", nom: "Bamako", pays: "ML" },
  lfw: { cle: "lfw", nom: "Lomé", pays: "TG" },
  mad: { cle: "mad", nom: "Madrid", pays: "ES" },
};

export type SondeJeu = {
  id: string;
  type: "dev" | "repere";
  ville: string;
  operateur: string;
  numero: number;
  pseudonyme: string;
  /** Heure relative de la premiere mesure. */
  creee: number;
};

export const SONDES_JEU: SondeJeu[] = [
  {
    id: "a1",
    type: "dev",
    ville: "cky",
    operateur: "Opérateur A",
    numero: 1,
    pseudonyme: "lynx-conakry-1",
    creee: -288,
  },
  {
    id: "a2",
    type: "dev",
    ville: "cky",
    operateur: "Opérateur A",
    numero: 2,
    pseudonyme: "kaloum-dev",
    creee: -216,
  },
  {
    id: "b1",
    type: "dev",
    ville: "cky",
    operateur: "Opérateur B",
    numero: 1,
    pseudonyme: "ratoma-node",
    creee: -264,
  },
  {
    id: "c1",
    type: "dev",
    ville: "abj",
    operateur: "Opérateur C",
    numero: 1,
    pseudonyme: "plateau-ci",
    creee: -72,
  },
  {
    id: "d1",
    type: "dev",
    ville: "abj",
    operateur: "Opérateur D",
    numero: 1,
    pseudonyme: "cocody-sonde",
    creee: -6,
  },
  {
    id: "md",
    type: "repere",
    ville: "mad",
    operateur: "Datacloud (Systalink)",
    numero: 1,
    pseudonyme: "repere-madrid",
    creee: -312,
  },
];

export type CibleJeu = {
  /** Cle de db/seed.sql. */
  cle: string;
  unite: "ms" | "mbps";
  /** Valeur habituelle de chaque sonde (absente : la sonde ne mesure pas cette cible). */
  base: Record<string, number>;
  /** Plus aucune donnee apres ce pas, et heure de la derniere mesure. */
  sansDonneeDepuis?: { pas: number; heure: string };
};

/** Les cibles de db/seed.sql, sauf les deux references. */
export const CIBLES_JEU: CibleJeu[] = [
  {
    cle: "npm",
    unite: "ms",
    base: { a1: 330, a2: 360, b1: 310, c1: 280, d1: 290, md: 95 },
  },
  {
    cle: "docker",
    unite: "ms",
    base: { a1: 380, a2: 400, b1: 370, c1: 340, d1: 350, md: 110 },
  },
  {
    cle: "github-api",
    unite: "ms",
    base: { a1: 320, a2: 340, b1: 300, c1: 260, d1: 270, md: 90 },
  },
  {
    cle: "github-raw",
    unite: "ms",
    base: { a1: 300, a2: 310, b1: 280, c1: 250, d1: 255, md: 80 },
  },
  {
    cle: "pypi",
    unite: "ms",
    base: { a1: 420, a2: 450, b1: 410, c1: 380, d1: 390, md: 120 },
  },
  {
    cle: "jsdelivr-min",
    unite: "ms",
    base: { a1: 160, a2: 170, b1: 150, c1: 120, d1: 130, md: 40 },
    sansDonneeDepuis: { pas: -1.67, heure: "15:20" },
  },
  {
    cle: "jsdelivr-obj",
    unite: "mbps",
    base: { a1: 12.4, a2: 11.8, b1: 13.1, c1: 16.0, d1: 15.2, md: 48 },
  },
];

export const REFERENCES_JEU: CibleJeu[] = [
  {
    cle: "ref-dns",
    unite: "ms",
    base: { a1: 24, a2: 26, b1: 22, c1: 20, d1: 21, md: 6 },
  },
  {
    cle: "ref-contenu",
    unite: "ms",
    base: { a1: 120, a2: 125, b1: 118, c1: 100, d1: 105, md: 30 },
  },
];

export type IncidentJeu = {
  id: string;
  /** Cles touchees, ou « * » pour toutes. */
  cibles: string[] | "*";
  sondes: string[];
  /** Un pas h est touche si de < h <= a. */
  de: number;
  a: number;
  depuis: string;
  jusqua?: string;
  valeurs?: Record<string, number>;
  facteur?: number;
  /** Les references de la sonde sont touchees aussi (connexion locale). */
  references?: boolean;
  disponibilite: number;
};

export const INCIDENTS_JEU: IncidentJeu[] = [
  {
    id: "inc-npm",
    cibles: ["npm"],
    sondes: ["a1", "a2"],
    de: -2.83,
    a: 0,
    depuis: "14:10",
    valeurs: { a1: 1250, a2: 1180 },
    disponibilite: 0.83,
  },
  {
    id: "inc-docker",
    cibles: ["docker"],
    sondes: ["b1"],
    de: -2,
    a: 0,
    depuis: "15:00",
    valeurs: { b1: 1150 },
    disponibilite: 0.97,
  },
  {
    id: "inc-c1",
    cibles: "*",
    sondes: ["c1"],
    de: -11,
    a: -9,
    depuis: "06:00",
    jusqua: "08:00",
    facteur: 3.4,
    references: true,
    disponibilite: 0.88,
  },
];

export type ConfirmationJeu = {
  ville: string;
  operateur: string | null;
  t: number;
};

export type PublicationJeu = {
  id: string;
  type: "contournement" | "demande";
  cible: string;
  auteur: string;
  ville: string;
  operateur: string | null;
  /** Heure relative de publication. */
  t: number;
  etiquettes: string[];
  incident: string | null;
  titre: string;
  contenu: string;
  commande: string | null;
  votes: number;
  confirmations: ConfirmationJeu[];
  reponses: { auteur: string; ville: string; t: number; contenu: string }[];
  suivis?: number;
  villeDemandee?: string;
};

const A = "Opérateur A";
const B = "Opérateur B";
const C = "Opérateur C";

export const PUBLICATIONS_JEU: PublicationJeu[] = [
  {
    id: "p1",
    type: "contournement",
    cible: "npm",
    auteur: "mariama-dev",
    ville: "cky",
    operateur: A,
    t: -2.58,
    etiquettes: ["npm"],
    incident: "inc-npm",
    titre: "Allonger le délai de nouvelle tentative de npm",
    contenu:
      "Le réseau n'est pas plus rapide, mais l'installation finit au lieu d'échouer.",
    commande: "npm config set fetch-retry-maxtimeout 120000",
    votes: 14,
    confirmations: [
      { ville: "cky", operateur: A, t: -2.1 },
      { ville: "cky", operateur: A, t: -1.75 },
      { ville: "cky", operateur: B, t: -1.4 },
      { ville: "abj", operateur: C, t: -1.2 },
      { ville: "dkr", operateur: null, t: -0.8 },
    ],
    reponses: [
      {
        auteur: "plateau-ci",
        ville: "abj",
        t: -1.15,
        contenu:
          "Marche aussi chez l'opérateur C à Abidjan, même sans lenteur : utile pour les installations longues.",
      },
    ],
  },
  {
    id: "p3",
    type: "contournement",
    cible: "npm",
    auteur: "fatou-k",
    ville: "cky",
    operateur: A,
    t: -1.58,
    etiquettes: ["npm"],
    incident: "inc-npm",
    titre: "Passer par un autre opérateur le temps de l'incident",
    contenu:
      "Partage de connexion d'un téléphone sur l'opérateur B : installation terminée en 2 minutes.",
    commande: null,
    votes: 4,
    confirmations: [
      { ville: "cky", operateur: A, t: -1.1 },
      { ville: "cky", operateur: A, t: -0.5 },
    ],
    reponses: [],
  },
  {
    id: "p2",
    type: "contournement",
    cible: "npm",
    auteur: "thierno-codes",
    ville: "dkr",
    operateur: null,
    t: -20,
    etiquettes: ["npm", "CI"],
    incident: null,
    titre: "Réutiliser le cache local",
    contenu: "Quand le paquet a déjà été installé une fois sur la machine.",
    commande: "npm ci --prefer-offline",
    votes: 9,
    confirmations: [{ ville: "dkr", operateur: null, t: -8 }],
    reponses: [],
  },
  {
    id: "p6",
    type: "contournement",
    cible: "docker",
    auteur: "kaloum-dev",
    ville: "cky",
    operateur: A,
    t: -0.7,
    etiquettes: ["Docker"],
    incident: "inc-docker",
    titre: "Tirer les images depuis un miroir du registre Docker",
    contenu:
      "À tester si le registre est lent depuis votre opérateur. Pas encore confirmé chez l'opérateur B.",
    commande: '"registry-mirrors": ["https://mirror.gcr.io"]',
    votes: 3,
    confirmations: [],
    reponses: [],
  },
  {
    id: "p4",
    type: "demande",
    cible: "npm",
    auteur: "awa-sn",
    ville: "dkr",
    operateur: null,
    t: -1.33,
    etiquettes: ["npm"],
    incident: null,
    titre: "npm est-il lent depuis Dakar en ce moment ?",
    contenu: "",
    commande: null,
    votes: 6,
    suivis: 4,
    villeDemandee: "dkr",
    confirmations: [],
    reponses: [],
  },
  {
    id: "p5",
    type: "demande",
    cible: "docker",
    auteur: "ib-diallo",
    ville: "cky",
    operateur: B,
    t: -1.0,
    etiquettes: ["Docker"],
    incident: "inc-docker",
    titre: "Docker Hub est-il lent à Conakry chez l'opérateur B ?",
    contenu: "",
    commande: null,
    votes: 2,
    suivis: 2,
    villeDemandee: "cky",
    confirmations: [],
    reponses: [],
  },
];

/** Mesures navigateur des dernieres 24 h : ville et heure. Elles ne comptent jamais dans les verdicts. */
export const NAVIGATEUR_JEU: { ville: string; t: number }[] = [
  { ville: "cky", t: -0.2 },
  { ville: "cky", t: -0.9 },
  { ville: "cky", t: -1.6 },
  { ville: "cky", t: -3.1 },
  { ville: "cky", t: -7.5 },
  { ville: "dkr", t: -1.3 },
  { ville: "dkr", t: -5.2 },
  { ville: "dkr", t: -12.4 },
  { ville: "bko", t: -2.2 },
  { ville: "bko", t: -16.0 },
  { ville: "abj", t: -4.4 },
  { ville: "abj", t: -9.9 },
  { ville: "lfw", t: -6.6 },
];
