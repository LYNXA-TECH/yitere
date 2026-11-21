"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "@/styles/document.module.css";

/**
 * Une page qui n'a pas pu etre rendue (l'API ne repond pas, une reponse inattendue) :
 * on le dit en clair, sans detail technique, avec de quoi reessayer. Comme la page
 * introuvable, elle parle les deux langues : Next.js ne lui donne pas la langue.
 */
export default function Erreur({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Le detail reste dans la console du navigateur et le journal du serveur, jamais a l'ecran.
    console.error(error);
  }, [error]);
  return (
    <main className={styles.page}>
      <h1>
        <span lang="fr">Cette page n&apos;a pas pu s&apos;afficher</span> ·{" "}
        <span lang="en">This page could not be displayed</span>
      </h1>
      <p lang="fr">
        Les mesures sont peut-être momentanément injoignables. Rien n&apos;est
        perdu : réessayez dans un instant.
      </p>
      <p lang="en">
        The measurements may be briefly unreachable. Nothing is lost: try again
        in a moment.
      </p>
      <p className={styles.ligne}>
        <button type="button" className={styles.bouton} onClick={reset}>
          <span lang="fr">Réessayer</span> · <span lang="en">Try again</span>
        </button>
        <Link href="/fr" lang="fr">
          Retour à la carte
        </Link>
        <Link href="/en" lang="en">
          Back to the map
        </Link>
      </p>
      {error.digest && (
        <p className={styles.petit}>
          <span lang="fr">Référence</span> : <code>{error.digest}</code>
        </p>
      )}
    </main>
  );
}
