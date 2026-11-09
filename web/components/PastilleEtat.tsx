import type { Etat } from "@/lib/donnees/types";
import styles from "./PastilleEtat.module.css";

/** Forme de chaque etat. La forme double la couleur : un etat se lit sans voir les couleurs. */
const FORMES: Record<Etat, string> = {
  normal: "point",
  degrade: "point-anneau",
  "pas-de-donnee": "anneau",
};

/** Le libelle vient du dictionnaire de la langue de la page (textes.etats). */
export function PastilleEtat({
  etat,
  libelle,
}: {
  etat: Etat;
  libelle: string;
}) {
  const forme = FORMES[etat];
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
