import type { Sonde, Verdict } from "./types";

export type ResumeVille = {
  ville: string;
  pays: string;
  sondes: number;
  enRodage: number;
  /** Le repere de centre de donnees, qui n'entre dans aucun calcul. */
  repere: boolean;
  /** Les services dont le verdict en cours nomme cette ville. */
  verdicts: { cle: string; nom: string }[];
};

/**
 * Regroupe les sondes par ville. C'est un simple comptage : aucun etat n'est
 * calcule ici, la ville est seulement rapprochee des verdicts qui la nomment.
 */
export function resumerVilles(
  sondes: Sonde[],
  verdicts: Verdict[],
): ResumeVille[] {
  const villes = new Map<string, ResumeVille>();
  for (const s of sondes) {
    if (!s.ville) continue;
    const v = villes.get(s.ville) ?? {
      ville: s.ville,
      pays: s.pays,
      sondes: 0,
      enRodage: 0,
      repere: s.type === "datacenter",
      verdicts: verdicts
        .filter(
          (d) =>
            d.observation.etat === "degrade" && d.hypothese?.ville === s.ville,
        )
        .map((d) => d.cible),
    };
    v.sondes += 1;
    if (s.enRodage) v.enRodage += 1;
    villes.set(s.ville, v);
  }
  return [...villes.values()].sort(
    (a, b) => b.sondes - a.sondes || a.ville.localeCompare(b.ville),
  );
}
