/**
 * Le nom d'operateur a afficher pour une sonde. L'API renvoie null quand l'operateur
 * n'a pas ete detecte : on le dit, plutot que d'ecrire « null » ou de laisser un trou.
 */
export function nomOperateur(
  operateur: string | null,
  inconnu: string,
): string {
  return operateur ?? inconnu;
}

/**
 * Les operateurs d'un groupe de sondes, pour les info-bulles de la carte : chacun une
 * fois, avec son nombre de sondes s'il en a plusieurs (« Orange ×2, MTN »). Le repere
 * de Madrid est un centre de donnees, pas une connexion d'hote : il n'est pas compte.
 */
export function resumeOperateurs(
  sondes: { operateur: string; repere: boolean }[],
): { texte: string; nombre: number } {
  const compte = new Map<string, number>();
  for (const s of sondes)
    if (!s.repere) compte.set(s.operateur, (compte.get(s.operateur) ?? 0) + 1);
  return {
    texte: [...compte]
      .map(([nom, n]) => (n > 1 ? `${nom} ×${n}` : nom))
      .join(", "),
    nombre: compte.size,
  };
}
