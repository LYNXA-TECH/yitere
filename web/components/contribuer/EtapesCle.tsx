"use client";

import Link from "next/link";
import { useCompte } from "@/lib/compte";
import { DemandeCle } from "./DemandeCle";
import styles from "./contribuer.module.css";

/**
 * Les deux premieres etapes d'Heberger une sonde : obtenir sa cle.
 * Avec la connexion GitHub ouverte (contrat, section 6) : se connecter et demander la
 * sonde dans Mon espace, puis generer sa cle une fois la demande acceptee. Rendu sur le
 * serveur, et tant que la connexion n'est pas ouverte : la demande par e-mail d'avant.
 */
export function EtapesCle({
  adresse,
  pays,
  espace,
}: {
  adresse: string;
  pays: { iso: string; nom: string }[];
  /** Le chemin de Mon espace, dans la langue de la page. */
  espace: string;
}) {
  const compte = useCompte();
  const ouverte = compte.etat === "anonyme" || compte.etat === "connecte";

  if (!ouverte)
    return (
      <>
        <div className={styles.etape} data-active>
          <span className={styles.numero}>1 · à faire maintenant</span>
          <h3>Demander votre clé</h3>
          <p className={styles.corps}>
            Votre ville, votre pays, et c&apos;est envoyé : l&apos;équipe vous
            répond avec une clé personnelle.
          </p>
          <DemandeCle adresse={adresse} pays={pays} espace={espace} />
          <p className={styles.petit}>
            La connexion avec GitHub, qui donnera la clé directement, ouvre
            après le 23 novembre.
          </p>
        </div>
        <div className={styles.etape}>
          <span className={styles.numero}>2 · ensuite</span>
          <h3>Recevoir votre clé</h3>
          <p className={styles.corps}>
            L&apos;équipe enregistre votre sonde sous un pseudonyme, avec votre
            pays et votre ville, jamais plus précis. Jamais votre nom.
          </p>
          <p className={styles.petit}>
            La clé est personnelle : ne la publiez pas.
          </p>
        </div>
      </>
    );

  return (
    <>
      <div className={styles.etape} data-active>
        <span className={styles.numero}>1 · à faire maintenant</span>
        <h3>Demander votre sonde</h3>
        <p className={styles.corps}>
          {compte.etat === "connecte" ? (
            <>
              Vous êtes connectée en tant que <strong>@{compte.login}</strong>.
              Dans Mon espace, indiquez votre pays, votre ville et votre
              opérateur : aucune adresse e-mail.
            </>
          ) : (
            <>
              Connectez-vous avec GitHub, puis indiquez dans Mon espace votre
              pays, votre ville et votre opérateur : aucune adresse e-mail.
              YITERE ne garde que votre identifiant GitHub.
            </>
          )}
        </p>
        <DemandeCle adresse={adresse} pays={pays} espace={espace} />
      </div>
      <div className={styles.etape}>
        <span className={styles.numero}>2 · ensuite</span>
        <h3>Générer votre clé</h3>
        <p className={styles.corps}>
          Dès que l&apos;équipe accepte votre demande, votre sonde apparaît dans{" "}
          <Link href={espace}>Mon espace</Link> avec le bouton « Générer ma clé
          ». Elle s&apos;affiche une seule fois : notez-la tout de suite.
        </p>
        <p className={styles.petit}>
          La clé est personnelle : ne la publiez pas. Perdue, vous pouvez la
          régénérer ; l&apos;ancienne cesse alors de marcher.
        </p>
      </div>
    </>
  );
}
