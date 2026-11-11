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
