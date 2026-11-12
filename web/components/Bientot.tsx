import Link from "next/link";
import type { Langue } from "@/lib/i18n/langues";
import { lien } from "@/lib/navigation";
import styles from "@/styles/document.module.css";

type Props = {
  langue: Langue;
  surtitre: string;
  titre: string;
  texte: string;
};

/**
 * Une page qui demande la connexion GitHub, tant qu'elle n'existe pas : on dit ce qui
 * viendra et quand, plutot que de montrer un espace ou un formulaire de demonstration.
 */
export function Bientot({ langue, surtitre, titre, texte }: Props) {
  return (
    <main className={styles.page}>
      <div className={styles.entete} lang="fr">
        <span className={styles.surtitre}>{surtitre}</span>
        <h1>{titre}</h1>
        <p className={styles.chapeau}>{texte}</p>
        <p>
          <Link href={lien(langue, "/echanges")}>Voir les échanges</Link>
          {" · "}
          <Link href={lien(langue, "/mesurer")}>
            Mesurer depuis chez moi, sans compte
          </Link>
        </p>
      </div>
    </main>
  );
}
