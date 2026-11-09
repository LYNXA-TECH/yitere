import styles from "@/styles/document.module.css";

/**
 * Next.js ne transmet pas la langue a cette page : elle parle donc les deux,
 * et renvoie vers les deux accueils.
 */
export default function Introuvable() {
  return (
    <main className={styles.page}>
      <h1>
        <span lang="fr">Page introuvable</span> ·{" "}
        <span lang="en">Page not found</span>
      </h1>
      <p className={styles.ligne}>
        <a href="/fr" lang="fr">
          Retour à la carte
        </a>
        <a href="/en" lang="en">
          Back to the map
        </a>
      </p>
    </main>
  );
}
