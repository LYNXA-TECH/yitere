import Link from "next/link";
import { BoutonConnexion } from "@/components/BoutonConnexion";
import { BoutonCopier } from "@/components/BoutonCopier";
import { lieu, signature } from "@/lib/affichage/publications";
import type { Publication } from "@/lib/donnees/types";
import { minutesEntre } from "@/lib/format";
import type { Dictionnaire } from "@/lib/i18n";
import styles from "./CartePublication.module.css";

type Props = {
  publication: Publication;
  t: Dictionnaire;
  /** Heure de reference pour « il y a ». */
  maintenant: string;
  /** Nom court du service (« npm ») pour le contexte de l'incident. */
  nomCourt: string;
  /** La publication date de l'incident affiche sur la page. */
  pendantIncident: boolean;
  lienDetail: string;
};

/** Une solution, sur une fiche de service : votes, commande, contexte et confirmations. */
export function CarteSolution({
  publication: p,
  t,
  maintenant,
  nomCourt,
  pendantIncident,
  lienDetail,
}: Props) {
  const pub = t.publication;
  const villes = compterVilles(p.confirmations.map((c) => c.ville));
  const operateurs = [
    ...new Set(
      p.confirmations.flatMap((c) =>
        c.operateur ? [pub.operateur(c.operateur)] : [],
      ),
    ),
  ];
  return (
    <article className={styles.carte} data-confirmee={p.confirmee || undefined}>
      <div className={styles.vote}>
        <BoutonConnexion
          className={styles.boutonVote}
          message={pub.connexionRequise}
          aria-label={pub.voterUtile(p.votes)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
          <span className={styles.chiffre}>{p.votes}</span>
        </BoutonConnexion>
        <span className={styles.utile}>{pub.utile}</span>
      </div>
      <div className={styles.contenu}>
        <div className={styles.badges}>
          {p.confirmee && (
            <span className={styles.confirmee}>{pub.confirmee}</span>
          )}
          {pendantIncident && (
            <span className={styles.incident}>{pub.pendantIncident}</span>
          )}
          {p.etiquettes.map((e) => (
            <span key={e} className={styles.etiquette}>
              {e}
            </span>
          ))}
        </div>
        <h3>{p.titre}</h3>
        <p className={styles.corps}>{p.contenu}</p>
        {p.commande && (
          <div className={styles.commande}>
            <code>{p.commande}</code>
            <BoutonCopier
              texte={p.commande}
              libelle={pub.copier}
              libelleCopie={pub.copie}
              titre={pub.copierCommande}
              className={styles.copier}
            />
          </div>
        )}
        <span className={styles.petit}>
          {[
            signature(p),
            lieu(p, t.locale),
            p.operateur ? pub.operateur(p.operateur) : "",
            pub.ilYA(minutesEntre(p.creeLe, maintenant)),
            p.contexte
              ? pub.pendantDegradation(nomCourt, p.contexte.operateur)
              : pub.horsIncident,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <div className={styles.actions}>
          <BoutonConnexion
            className={styles.confirmer}
            message={pub.connexionRequise}
          >
            {pub.aMarche}
          </BoutonConnexion>
          <span
            className={
              p.confirmations.length ? styles.confirmations : styles.petit
            }
          >
            {p.confirmations.length
              ? pub.confirmations(
                  p.confirmations.length,
                  villes,
                  operateurs.join(", "),
                )
              : pub.pasConfirmee}
          </span>
          <span className={styles.ressort} />
          <Link href={lienDetail} className={styles.lienReponses}>
            {pub.reponses(p.reponses.length)}
          </Link>
          <BoutonConnexion
            className={styles.signaler}
            message={pub.connexionRequise}
          >
            {pub.signaler}
          </BoutonConnexion>
        </div>
      </div>
    </article>
  );
}

/** « Conakry (3), Abidjan, Dakar » : chaque ville une fois, avec son nombre s'il depasse 1. */
export function compterVilles(villes: string[]): string {
  const nombres = new Map<string, number>();
  for (const v of villes) nombres.set(v, (nombres.get(v) ?? 0) + 1);
  return [...nombres].map(([v, n]) => (n > 1 ? `${v} (${n})` : v)).join(", ");
}

/** Une demande de mesure : en attente d'une sonde, ou deja repondue par la donnee. */
export function CarteDemande({
  publication: p,
  t,
  maintenant,
}: {
  publication: Publication;
  t: Dictionnaire;
  maintenant: string;
}) {
  const pub = t.publication;
  const demande = p.demande;
  if (!demande) return null;
  return (
    <article className={styles.demande}>
      <span className={styles.surtitre}>
        {pub.demande} ·{" "}
        {demande.sondeSurPlace
          ? pub.statutRepondue
          : pub.statutAttente(demande.ville)}
      </span>
      <span className={styles.titreDemande}>{p.titre}</span>
      <span className={styles.corps}>
        {demande.sondeSurPlace
          ? t.fiche.demandeRepondue
          : t.fiche.demandeEnAttente(demande.ville)}
      </span>
      <span className={styles.petit}>
        {[
          signature(p),
          lieu(p, t.locale),
          pub.ilYA(minutesEntre(p.creeLe, maintenant)),
          demande.suivis ? pub.suivent(demande.suivis) : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </article>
  );
}
