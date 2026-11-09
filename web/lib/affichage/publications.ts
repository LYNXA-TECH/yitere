import type { Publication } from "@/lib/donnees/types";
import { minutesEntre } from "@/lib/format";
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
    p.ville,
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
