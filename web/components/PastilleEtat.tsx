import type { Etat } from "@/lib/donnees/types";
import styles from "./PastilleEtat.module.css";

/** Libelle et forme de chaque etat. La forme double la couleur : un etat se lit sans voir les couleurs. */
const ETATS: Record<Etat, { libelle: string; forme: string }> = {
  normal: { libelle: "Normal", forme: "point" },
  degrade: { libelle: "Dégradation observée", forme: "point-anneau" },
  service: { libelle: "Cause probable : le service", forme: "triangle" },
  indetermine: { libelle: "Cause indéterminée", forme: "anneau-pointille" },
  "pas-de-donnee": { libelle: "Pas de donnée", forme: "anneau" },
};

export function PastilleEtat({ etat }: { etat: Etat }) {
  const { libelle, forme } = ETATS[etat];
  return (
    <span className={styles.pastille} data-etat={etat}>
      <svg
        className={styles.symbole}
        data-forme={forme}
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <Symbole forme={forme} />
      </svg>
      {libelle}
    </span>
  );
}

function Symbole({ forme }: { forme: string }) {
  switch (forme) {
    case "point":
      return <circle cx="8" cy="8" r="5" fill="currentColor" />;
    case "point-anneau":
      return (
        <>
          <circle
            cx="8"
            cy="8"
            r="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="8" cy="8" r="3.5" fill="currentColor" />
        </>
      );
    case "triangle":
      return <path d="M8 2 L14.5 13.5 H1.5 Z" fill="currentColor" />;
    case "anneau-pointille":
      return (
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2.5 2"
        />
      );
    default:
      return (
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      );
  }
}
