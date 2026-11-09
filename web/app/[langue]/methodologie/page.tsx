import type { Metadata } from "next";
import { MentionFrancais } from "@/components/MentionFrancais";
import { langueDe } from "@/lib/i18n/params";
import { lireMethodologie } from "@/lib/methodologie";
import styles from "@/styles/page.module.css";
import prose from "@/styles/prose.module.css";

type Props = { params: Promise<{ langue: string }> };

export const metadata: Metadata = { title: "Méthodologie" };

/** Page en francais seulement (decision 0002, D13) : 1 600 mots de prose technique. */
export default async function Methodologie({ params }: Props) {
  const langue = await langueDe(params);
  const html = await lireMethodologie();
  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <article
        lang="fr"
        className={prose.prose}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
