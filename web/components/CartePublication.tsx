import type { Publication } from "@/lib/donnees/types";
import type { Dictionnaire } from "@/lib/i18n";
import styles from "./CartePublication.module.css";

type Props = {
  publication: Publication;
  textes: Dictionnaire["echanges"];
  /** Nom de la cible et lien vers sa fiche ; absent quand la carte est deja sur cette fiche. */
  service?: { nom: string; href: string };
  nomPays: (iso: string) => string;
};

/** Une publication garde son contexte : quel service, ou, et combien l'ont confirmee. */
export function CartePublication({
  publication: p,
  textes: t,
  service,
  nomPays,
}: Props) {
  return (
    <article className={styles.carte} data-type={p.type}>
      <p className={styles.entete}>
        <span className={styles.type}>
          {p.type === "contournement" ? t.contournement : t.demande}
        </span>
        {service && <a href={service.href}>{service.nom}</a>}
      </p>
      <p className={styles.contenu}>{p.contenu}</p>
      {p.commande && (
        <pre className={styles.commande}>
          <code>{p.commande}</code>
        </pre>
      )}
      <p className={styles.meta}>
        {[
          p.auteur,
          p.pays && nomPays(p.pays),
          t.publieeLe(p.creeLe),
          t.votes(p.votes),
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </article>
  );
}
