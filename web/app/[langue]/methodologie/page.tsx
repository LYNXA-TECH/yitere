import type { Metadata } from "next";
import Link from "next/link";
import { MentionFrancais } from "@/components/MentionFrancais";
import { langueDe } from "@/lib/i18n/params";
import { lireMethodologie } from "@/lib/methodologie";
import { lien } from "@/lib/navigation";
import styles from "@/styles/document.module.css";

type Props = { params: Promise<{ langue: string }> };

export const metadata: Metadata = { title: "Méthodologie" };

/**
 * Page en francais seulement (decision 0002, D13) : 1 600 mots de prose technique.
 * Le texte vient de docs/methodologie.md, la seule source (decision 0002, D11).
 */
export default async function Methodologie({ params }: Props) {
  const langue = await langueDe(params);
  const html = await lireMethodologie();
  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <div className={styles.entete} lang="fr">
        <span className={styles.surtitre}>Méthodologie</span>
        <h1>Ce que nous mesurons, comment, et ce que nous ne mesurons pas</h1>
        <p className={styles.chapeau}>
          Si un chiffre de YITERE vous semble faux, c&apos;est ici que vous
          devez pouvoir comprendre pourquoi.
        </p>
      </div>
      <article
        lang="fr"
        className={styles.prose}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <p className={styles.discret} lang="fr">
        Vous voyez une erreur ou une limite que nous n&apos;avons pas écrite ?{" "}
        <Link href={lien(langue, "/publier")}>
          Signalez-la dans les échanges.
        </Link>{" "}
        Vie privée et suppression :{" "}
        <Link href={lien(langue, "/confidentialite")}>
          politique de confidentialité
        </Link>
        .
      </p>
    </main>
  );
}
