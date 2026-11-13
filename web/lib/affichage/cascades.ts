import type { Cascade } from "@/lib/donnees/types";
import type { Dictionnaire } from "@/lib/i18n";

const ETAPES = ["dns", "connexion", "tls", "attente"] as const;
export type Etape = (typeof ETAPES)[number];

/**
 * Ce que disent les passages decomposes, tire des chiffres et rien de plus : l'etape qui
 * s'allonge le plus pour la sonde touchee, comparee a la sonde epargnee.
 */
export function lectureCascades(
  cascades: Cascade[],
  t: Dictionnaire["fiche"],
  ms: (n: number) => string,
): string {
  const touchee = cascades.find((c) => c.statut === "touchee");
  const epargnee = cascades.find((c) => c.statut === "epargnee");
  if (!touchee || !epargnee) return t.tempsLectureSeul;
  const ecarts = ETAPES.map((e) => ({ e, d: touchee[e] - epargnee[e] }));
  const plus = ecarts.reduce((a, b) => (b.d > a.d ? b : a));
  if (plus.d <= 0) return t.tempsLecturePareil;
  const nom: Record<Etape, string> = {
    dns: t.dns,
    connexion: t.connexion,
    tls: t.tls,
    attente: t.attente,
  };
  return t.tempsLectureEcart(
    nom[plus.e],
    ms(touchee[plus.e]),
    ms(epargnee[plus.e]),
  );
}
