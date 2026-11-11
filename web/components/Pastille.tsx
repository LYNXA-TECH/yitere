import type { Teinte } from "@/lib/affichage/verdicts";
import styles from "./Pastille.module.css";

/**
 * Un point d'etat devant un libelle. Plein : normal ou cause probable ; creux : cause
 * indeterminee ; pointille : pas de donnee. La couleur n'est jamais seule.
 */
export function Pastille({
  teinte,
  creuse = false,
  children,
}: {
  teinte: Teinte;
  creuse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={styles.pastille}
      data-teinte={teinte}
      data-creuse={creuse || undefined}
    >
      <span className={styles.point} aria-hidden="true" />
      {children}
    </span>
  );
}
