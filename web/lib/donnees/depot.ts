/*
 * Deposer une publication sans connexion GitHub : POST /api/v1/publications (PR
 * depot-publications de Cellou). Rien ne s'affiche avant relecture par l'equipe.
 *
 * Les noms des champs envoyes et ceux que l'API renvoie dans ses erreurs sont tous ici,
 * et seulement ici : s'ils changent cote serveur, c'est le seul endroit a corriger.
 */

export type Depot = {
  service: string;
  type: "contournement" | "demande";
  texte: string;
  commande: string;
  /** Code ISO du pays, ou vide. */
  pays: string;
  pseudonyme: string;
  /** Piege a robots : un humain ne voit pas ce champ et le laisse vide. */
  site: string;
};

export type ChampDepot = Exclude<keyof Depot, "site">;

/** Le corps de la requete, aux noms de l'API (les memes que GET /api/v1/publications). */
export function corpsDepot(d: Depot) {
  return {
    cible: d.service,
    type: d.type,
    contenu: d.texte.trim(),
    commande: d.commande.trim() || null,
    pays: d.pays || null,
    auteur: d.pseudonyme.trim(),
    site: d.site,
  };
}

/** Le champ du formulaire que designe une erreur de l'API (ses noms, ou les notres). */
const CHAMP_DE: Record<string, ChampDepot> = {
  cible: "service",
  service: "service",
  type: "type",
  contenu: "texte",
  texte: "texte",
  commande: "commande",
  pays: "pays",
  auteur: "pseudonyme",
  pseudonyme: "pseudonyme",
};

export type ResultatDepot =
  | { etat: "recu" }
  | { etat: "invalide"; champ: ChampDepot | null; erreur: string }
  | { etat: "plus-tard"; raison: "trop" | "indisponible" }
  | { etat: "echec" };

/** Lit la reponse de l'API : 201 recu, 400 erreur par champ, 429 et 503 plus tard. */
export async function lireReponseDepot(r: Response): Promise<ResultatDepot> {
  if (r.status === 201) return { etat: "recu" };
  if (r.status === 429) return { etat: "plus-tard", raison: "trop" };
  if (r.status === 503) return { etat: "plus-tard", raison: "indisponible" };
  if (r.status === 400) {
    const corps: unknown = await r.json().catch(() => null);
    const o =
      typeof corps === "object" && corps !== null
        ? (corps as Record<string, unknown>)
        : {};
    const champ =
      typeof o.champ === "string" ? (CHAMP_DE[o.champ] ?? null) : null;
    const erreur = typeof o.erreur === "string" ? o.erreur : "";
    return { etat: "invalide", champ, erreur };
  }
  return { etat: "echec" };
}

export async function deposer(
  d: Depot,
  envoyer: typeof fetch = fetch,
): Promise<ResultatDepot> {
  try {
    const r = await envoyer("/api/v1/publications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corpsDepot(d)),
    });
    return await lireReponseDepot(r);
  } catch {
    return { etat: "echec" };
  }
}
