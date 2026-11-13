import type { Publication } from "@/lib/donnees/types";
import { minutesEntre, nomPays } from "@/lib/format";
import type { Dictionnaire } from "@/lib/i18n";

/** « Publiee pendant la degradation npm · Operateur A · Conakry », ou « Publiee il y a 20 h, hors incident · Dakar ». */
export function contexte(
  p: Publication,
  t: Dictionnaire,
  maintenant: string,
): string {
  const demande = p.type === "demande";
  if (p.contexte)
    return t.carte.contexteIncident(
      demande,
      t.services.nomCourt(p.contexte.cible),
      p.contexte.operateur,
      p.contexte.ville,
    );
  return t.carte.contexteLibre(
    demande,
    t.publication.ilYA(minutesEntre(p.creeLe, maintenant)),
    lieu(p, t.locale),
  );
}

export type Statut = {
  cle: "confirmee" | "aucune" | "attente" | "repondue";
  texte: string;
};

/** Ce que la communaute ou les sondes ont repondu a une publication. */
export function statut(p: Publication, t: Dictionnaire): Statut {
  if (p.demande)
    return p.demande.sondeSurPlace
      ? { cle: "repondue", texte: t.carte.repondue }
      : { cle: "attente", texte: t.carte.attente(p.demande.ville) };
  if (p.confirmations.length === 0)
    return { cle: "aucune", texte: t.carte.pasConfirmee };
  const villes = [...new Set(p.confirmations.map((x) => x.ville))].join(", ");
  return {
    cle: "confirmee",
    texte: t.carte.aMarchePour(p.confirmations.length, villes, p.confirmee),
  };
}

/**
 * Le nom de l'auteur : « @pseudo » pour un compte GitHub verifie, le pseudonyme seul pour
 * une publication deposee sans connexion (il est choisi librement, il ne prouve rien).
 */
export function signature(p: Publication): string {
  return p.verifie ? `@${p.auteur}` : p.auteur;
}

/** La ville si la publication la donne, sinon le pays, sinon rien. */
export function lieu(p: Publication, locale: string): string {
  return p.ville || (p.pays ? nomPays(locale, p.pays) : "");
}
