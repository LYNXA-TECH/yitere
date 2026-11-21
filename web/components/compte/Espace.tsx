"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { seDeconnecter, urlConnexion, useCompte, type Moi } from "@/lib/compte";
import styles from "@/styles/document.module.css";
import petits from "./compte.module.css";

const STATUT_PUBLICATION: Record<
  Moi["publications"][number]["statut"],
  string
> = {
  publiee: "Publiée",
  "en-attente": "En attente de relecture",
  refusee: "Refusée à la relecture",
};

const date = (iso: string) =>
  new Intl.DateTimeFormat("fr", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso)) + " UTC";

/**
 * Mon espace (GET /api/v1/moi, contrat section 6), lu dans le navigateur.
 * Rendu sur le serveur, et tant que la connexion n'est pas ouverte : fallback, la page
 * « bientot » d'avant. 401 : le bouton de connexion. Sinon : le login, les sondes et les
 * publications avec leur statut, et « Se deconnecter ».
 * Page en francais seulement (decision 0002, D13).
 */
export function Espace({
  fallback,
  guide,
  echanges,
  publier,
  confidentialite,
}: {
  fallback: ReactNode;
  guide: string;
  echanges: string;
  publier: string;
  confidentialite: string;
}) {
  const compte = useCompte();
  // Apres un retour de GitHub qui a echoue : /fr/moi?connexion=echec
  const [echec, setEchec] = useState(false);
  useEffect(() => {
    setEchec(
      new URLSearchParams(window.location.search).get("connexion") === "echec",
    );
  }, []);

  if (compte.etat === "chargement" || compte.etat === "fermee")
    return <>{fallback}</>;

  if (compte.etat === "anonyme")
    return (
      <main className={styles.page}>
        <div className={styles.entete} lang="fr">
          <span className={styles.surtitre}>Mon espace</span>
          <h1>Connectez-vous avec GitHub</h1>
          {echec && (
            <p role="alert" className={petits.alerte}>
              La connexion n&apos;a pas abouti. Réessayez.
            </p>
          )}
          <p className={styles.chapeau}>
            Pour voir vos sondes et vos publications, et dire qu&apos;une
            solution a marché pour vous. YITERE ne garde que votre identifiant
            GitHub et son numéro : ni votre adresse e-mail, ni accès à vos
            dépôts.
          </p>
          <p>
            <a href={urlConnexion()} className={styles.bouton}>
              Se connecter avec GitHub
            </a>
          </p>
          <p className={styles.petit}>
            <Link href={confidentialite}>Vos données et vos droits</Link>
          </p>
        </div>
      </main>
    );

  const { moi } = compte;
  return (
    <main className={`${styles.page} ${styles.large}`}>
      <div className={styles.profil} lang="fr">
        <span className={styles.avatar} aria-hidden="true">
          {moi.login.charAt(0).toUpperCase()}
        </span>
        <div className={styles.entete}>
          <h1>@{moi.login}</h1>
          <span className={styles.chapeau}>
            Ce que vous publiez porte votre identifiant GitHub. Jamais votre
            adresse e-mail ni votre adresse IP.
          </span>
          <p>
            <button
              type="button"
              className={styles.secondaire}
              onClick={() => void seDeconnecter()}
            >
              Se déconnecter
            </button>
          </p>
        </div>
      </div>

      <section
        className={styles.section}
        aria-labelledby="mes-sondes"
        lang="fr"
      >
        <h2 id="mes-sondes">Mes sondes · {moi.sondes.length}</h2>
        {moi.sondes.length === 0 ? (
          <p className={styles.discret}>
            Aucune sonde liée à votre compte. Vous hébergez déjà une sonde ?
            L&apos;équipe la relie à votre identifiant GitHub sur demande. Sinon
            : <Link href={guide}>héberger une sonde</Link>.
          </p>
        ) : (
          moi.sondes.map((s) => (
            <div key={s.pseudonyme} className={styles.cadre}>
              <div className={styles.titreLigne}>
                <span className={`${styles.gras} ${styles.mono}`}>
                  {s.pseudonyme}
                </span>
                <span className={s.active ? styles.gras : styles.discret}>
                  {s.active ? "Active" : "Désactivée"}
                </span>
              </div>
              <span className={styles.discret}>
                {[s.ville, s.pays, s.asn ? `AS${s.asn}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <dl className={styles.chiffres}>
                <div>
                  <dt>Mesures sur 24 h</dt>
                  <dd>{s.mesures_24h}</dd>
                </div>
                <div>
                  <dt>Dernier passage</dt>
                  <dd>{s.vue_le ? date(s.vue_le) : "jamais"}</dd>
                </div>
              </dl>
            </div>
          ))
        )}
      </section>

      <section
        className={styles.section}
        aria-labelledby="mes-publications"
        lang="fr"
      >
        <h2 id="mes-publications">
          Mes publications · {moi.publications.length}
        </h2>
        {moi.publications.length === 0 ? (
          <p className={styles.discret}>
            Rien pour l&apos;instant. <Link href={publier}>Publier</Link>
          </p>
        ) : (
          <ul>
            {moi.publications.map((p) => (
              <li key={p.id}>
                {p.statut === "publiee" ? (
                  <Link href={`${echanges}/${p.id}`}>
                    {p.contenu.slice(0, 90)}
                  </Link>
                ) : (
                  <span>{p.contenu.slice(0, 90)}</span>
                )}{" "}
                <span className={styles.petit}>
                  · {STATUT_PUBLICATION[p.statut] ?? p.statut} · {p.votes}{" "}
                  {p.votes > 1 ? "votes" : "vote"} · {date(p.cree_le)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className={styles.petit}>
          Supprimer votre compte ou en demander une copie : écrivez-nous, voir{" "}
          <Link href={confidentialite}>vos données et vos droits</Link>.
        </p>
      </section>
    </main>
  );
}
