import type { VilleCarte } from "@/components/carte/types";
import type { Publication, Sonde } from "@/lib/donnees/types";
import { nomVille } from "@/lib/geo/villes";

/**
 * Les publications de chaque ville, pour l'info-bulle de la carte. Une publication de l'API
 * ne donne que son pays : elle compte pour une ville seulement si c'est la seule ville de
 * ce pays sur la carte. Sinon on ne sait pas laquelle, et on ne devine pas.
 */
export function avecEntraide(
  villes: VilleCarte[],
  sondes: Sonde[],
  publications: Publication[],
): VilleCarte[] {
  const paysDe = new Map(sondes.map((s) => [nomVille(s.ville), s.pays]));
  const villesDuPays = (pays: string) =>
    villes.filter((v) => paysDe.get(v.nom) === pays);
  for (const p of publications) {
    const ville = p.ville
      ? villes.find((v) => v.nom === nomVille(p.ville))
      : villesDuPays(p.pays).length === 1
        ? villesDuPays(p.pays)[0]
        : undefined;
    if (!ville) continue;
    if (p.type === "demande") ville.entraide.demandes += 1;
    else ville.entraide.solutions += 1;
  }
  return villes;
}
