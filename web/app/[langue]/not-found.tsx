import styles from "@/styles/page.module.css";

/**
 * Next.js ne transmet pas la langue a cette page : elle parle donc les deux,
 * et renvoie vers les deux accueils.
 */
export default function Introuvable() {
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>
        <span lang="fr">Page introuvable</span> ·{" "}
        <span lang="en">Page not found</span>
      </h1>
      <p className={styles.actions}>
        <a href="/fr" lang="fr">
          Retour à l&apos;accueil
        </a>
        <a href="/en" lang="en">
          Back to the home page
        </a>
      </p>
    </main>
  );
}
