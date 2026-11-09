import type { Lecture } from "@/lib/donnees/types";
import type { Dictionnaire } from "@/lib/i18n";
import styles from "./BandeauSource.module.css";

type Props = {
  /** Toutes les lectures dont la page affiche le contenu. */
  lectures: Lecture<unknown>[];
  textes: Dictionnaire["source"];
};

/**
 * Dit d'ou viennent les chiffres de la page. Des qu'une seule lecture est un exemple,
 * le badge « Donnees d'exemple » s'affiche (directive de Cellou). Sinon, l'heure de la
 * lecture la plus ancienne : c'est elle qui borne la fraicheur de la page.
 */
export function BandeauSource({ lectures, textes: t }: Props) {
  if (lectures.some((l) => l.source === "exemple")) {
    return (
      <p className={styles.bandeau} data-source="exemple" role="note">
        <span className={styles.badge}>{t.exemple}</span>
        {t.exempleDetail}
      </p>
    );
  }
  const plusAncienne = lectures
    .map((l) => l.lueLe)
    .filter((d): d is string => d !== null)
    .sort()[0];
  if (!plusAncienne) return null;
  return (
    <p className={styles.bandeau} data-source="api">
      {t.lueLe(plusAncienne)}
    </p>
  );
}
