"use client";

import Link from "next/link";
import { urlConnexion, useCompte } from "@/lib/compte";
import styles from "./compte.module.css";

/**
 * L'en-tete, cote compte : rien tant que la connexion n'est pas ouverte ; « Se connecter »,
 * un simple lien vers GitHub ; connectee, le login qui mene a Mon espace.
 */
export function BoutonCompte({
  libelle,
  espace,
}: {
  libelle: string;
  espace: string;
}) {
  const compte = useCompte();
  if (compte.etat === "connecte")
    return (
      <Link href={espace} className={styles.compte} title="Mon espace">
        <span className={styles.avatar} aria-hidden="true">
          {compte.login.charAt(0).toUpperCase()}
        </span>
        @{compte.login}
      </Link>
    );
  if (compte.etat === "anonyme")
    return (
      <a href={urlConnexion()} className={styles.compte}>
        {libelle}
      </a>
    );
  return null;
}
