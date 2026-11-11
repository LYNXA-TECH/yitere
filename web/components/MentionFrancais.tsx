import { dictionnaire, type Langue } from "@/lib/i18n";
import styles from "./MentionFrancais.module.css";

/**
 * Sur une page non traduite, dit dans la langue du visiteur que la suite est en francais
 * (decision 0002, D13). Rien en francais.
 */
export function MentionFrancais({ langue }: { langue: Langue }) {
  if (langue === "fr") return null;
  return (
    <p className={styles.mention} lang={langue} role="note">
      {dictionnaire(langue).pageEnFrancais}
    </p>
  );
}
