import type { Dictionnaire } from "@/lib/i18n";
import styles from "./PiedDePage.module.css";

export function PiedDePage({ textes: t }: { textes: Dictionnaire["pied"] }) {
  return (
    <footer className={styles.pied}>
      <p>{t.licence}</p>
      <p>
        <a href="https://github.com/LYNXA-TECH/yitere">{t.depot}</a>
      </p>
    </footer>
  );
}
