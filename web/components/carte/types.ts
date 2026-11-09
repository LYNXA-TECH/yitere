/**
 * Ce que la page Carte transmet a son composant client : des donnees deja mises en forme
 * et des textes deja traduits. Aucune fonction ne passe au navigateur, et aucun dictionnaire.
 */

export type EtatSonde = "normal" | "degrade" | "pas-de-donnee" | "absente";

export type SondeCarte = {
  id: string;
  libelle: string;
  repere: boolean;
  enRodage: boolean;
  /** Etat par cle de cible, un par heure (24 valeurs, la derniere : maintenant). */
  etats: Record<string, EtatSonde[]>;
};

export type VilleCarte = {
  nom: string;
  pays: string;
  /** Position dans le repere SVG, ou null hors du cadre (Madrid). */
  x: number | null;
  y: number | null;
  sondes: SondeCarte[];
};

export type Bande = { de: number; a: number; teinte: "degrade" | "vide" };

export type TextesCarte = {
  tousServices: string;
  serviceAffiche: string;
  afrique: string;
  niveau: string;
  calques: string;
  mesuresNavigateur: string;
  entraide: string;
  affichage: string;
  vueCarte: string;
  vueListe: string;
  zoomer: string;
  dezoomer: string;
  legende: string;
  legendeNormal: string;
  legendeDegrade: string;
  legendeRodage: string;
  legendeRepere: string;
  legendeLien: string;
  legendePulse: string;
  repere: string;
  description: string;
  listeDetail: string;
  /** « Vue liste · {heure} » */
  listeTitre: string;
  /** « {sondes} sondes · {degradees} degradees », deja accorde pour chaque cas utile. */
  etats: Record<EtatSonde | "rodage", string>;
  lire: string;
  pause: string;
  enDirect: string;
  sousDirect: string;
  /** Une phrase par heure : « Relecture · heure se terminant a 14:00 ». */
  sousRelecture: string[];
  vitesse: string[];
  heureAffichee: string;
  periode: string;
  h24: string;
  sondesEntraide: string;
  publication: string;
  mesureNavigateur: string;
  fermer: string;
  ville: string;
  sondes: string;
  repereHorsCalcul: string;
};
