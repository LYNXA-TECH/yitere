import type { Teinte } from "@/lib/affichage/verdicts";
import styles from "./Etiquette.module.css";

/**
 * « Observe » en trait plein, de la couleur de l'etat ; « Hypothese » et « Indetermine »
 * en pointille : ce n'est pas une mesure.
 */
export function Etiquette({
  nature,
  teinte = "normal",
  children,
}: {
  nature: "observe" | "hypothese";
  teinte?: Teinte;
  children: React.ReactNode;
}) {
  return (
    <span
      className={styles.etiquette}
      data-nature={nature}
      data-teinte={teinte}
    >
      {children}
    </span>
  );
}
