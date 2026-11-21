"use client";

import { useEffect, useState } from "react";

/*
 * La connexion GitHub, cote navigateur (serveur/connexion.js, contrat section 6).
 * Les pages restent rendues et gardees en cache sans cookie : seul ce qui depend de la
 * personne connectee est lu ici, depuis le navigateur, avec credentials: "same-origin".
 */

/** GET /api/v1/moi. */
export type Moi = {
  login: string;
  sondes: {
    pseudonyme: string;
    pays: string;
    ville: string | null;
    asn: number | null;
    active: boolean;
    vue_le: string | null;
    mesures_24h: number;
  }[];
  publications: {
    id: number;
    cible: string;
    type: "contournement" | "demande";
    contenu: string;
    commande: string | null;
    votes: number;
    statut: "publiee" | "en-attente" | "refusee";
    cree_le: string;
  }[];
};

/**
 * - « fermee » : la connexion n'est pas ouverte (API sans les variables GitHub : 503 ;
 *   API plus ancienne : 404 ; ou injoignable). Le site garde ses boutons « bientot ».
 * - « anonyme » : ouverte, personne n'est connecte (401).
 * - « connecte » : avec le login et l'espace.
 */
export type EtatCompte =
  | { etat: "chargement" }
  | { etat: "fermee" }
  | { etat: "anonyme" }
  | { etat: "connecte"; login: string; moi: Moi };

let lecture: Promise<EtatCompte> | null = null;

function estMoi(x: unknown): x is Moi {
  const o = x as Partial<Moi> | null;
  return (
    typeof o === "object" &&
    o !== null &&
    typeof o.login === "string" &&
    Array.isArray(o.sondes) &&
    Array.isArray(o.publications)
  );
}

/** L'etat que donne une reponse de GET /api/v1/moi : 401 anonyme, 200 connectee, sinon fermee. */
export function etatDepuis(statut: number, corps: unknown): EtatCompte {
  if (statut === 401) return { etat: "anonyme" };
  if (statut === 200 && estMoi(corps))
    return { etat: "connecte", login: corps.login, moi: corps };
  return { etat: "fermee" };
}

/** Lit GET /api/v1/moi une seule fois par page ; recharger() force une nouvelle lecture. */
function lire(): Promise<EtatCompte> {
  lecture ??= fetch("/api/v1/moi", {
    credentials: "same-origin",
    cache: "no-store",
  })
    .then(async (r) =>
      etatDepuis(r.status, r.ok ? await r.json().catch(() => null) : null),
    )
    .catch((): EtatCompte => ({ etat: "fermee" }));
  return lecture;
}

export function oublierCompte() {
  lecture = null;
}

export function useCompte(): EtatCompte {
  const [etat, setEtat] = useState<EtatCompte>({ etat: "chargement" });
  useEffect(() => {
    let vivant = true;
    lire().then((e) => vivant && setEtat(e));
    return () => {
      vivant = false;
    };
  }, []);
  return etat;
}

/** Le lien « Se connecter avec GitHub » : revient sur la page actuelle. */
export function urlConnexion(): string {
  const retour =
    typeof window === "undefined"
      ? "/fr/moi"
      : window.location.pathname + window.location.search;
  return `/api/v1/connexion/github?retour=${encodeURIComponent(retour)}`;
}

/** Envoie vers GitHub, puis ramene ici. */
export function seConnecter() {
  window.location.href = urlConnexion();
}

/** POST /api/v1/deconnexion (204), puis la page est rechargee. */
export async function seDeconnecter() {
  await fetch("/api/v1/deconnexion", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => null);
  oublierCompte();
  window.location.reload();
}
