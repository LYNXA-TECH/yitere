/*
 * La demande de cle de sonde, tant que la connexion GitHub n'existe pas : le formulaire
 * prepare l'e-mail, la personne n'a plus qu'a l'envoyer depuis sa messagerie. Le site
 * n'envoie ni ne garde rien : la reponse part vers l'adresse d'ou vient l'e-mail.
 */

export type DemandeCle = {
  /** Nom du pays en francais, deja choisi dans la liste. */
  pays: string;
  ville: string;
  operateur: string;
  pseudonyme: string;
  systeme: "" | "Linux" | "macOS" | "Windows";
};

export const DEMANDE_VIDE: DemandeCle = {
  pays: "Guinée",
  ville: "",
  operateur: "",
  pseudonyme: "",
  systeme: "",
};

/** L'objet et le texte de l'e-mail, prets a relire. Les champs vides sont omis. */
export function messageDemande(d: DemandeCle): {
  objet: string;
  texte: string;
} {
  const ville = d.ville.trim();
  const lignes = [
    ["Pays", d.pays],
    ["Ville", ville],
    ["Opérateur", d.operateur.trim()],
    ["Pseudonyme souhaité", d.pseudonyme.trim()],
    ["Système", d.systeme],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `${k} : ${v}`);
  return {
    objet: `Héberger une sonde YITERE · ${ville}, ${d.pays}`,
    texte: [
      "Bonjour l'équipe YITERE,",
      "",
      "Je souhaite héberger une sonde. Voici mes informations :",
      "",
      ...lignes,
      "",
      "Merci de m'envoyer ma clé à cette adresse.",
    ].join("\n"),
  };
}

/** Le lien mailto: complet ; encodeURIComponent garde les accents et les retours a la ligne. */
export function lienDemande(adresse: string, d: DemandeCle): string {
  const { objet, texte } = messageDemande(d);
  return `mailto:${adresse}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(texte)}`;
}
