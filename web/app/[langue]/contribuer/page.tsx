import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/contribuer/contribuer.module.css";
import { MentionFrancais } from "@/components/MentionFrancais";
import {
  lireMesuresNavigateur,
  lirePublications,
  lireSondes,
} from "@/lib/donnees";
import { nomPays } from "@/lib/format";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";

type Props = { params: Promise<{ langue: string }> };

export const revalidate = 60;

export const metadata: Metadata = { title: "Contribuer" };

/** Page en francais seulement (decision 0002, D13). */
export default async function Contribuer({ params }: Props) {
  const langue = await langueDe(params);
  const [sondes, navigateur, publications] = await Promise.all([
    lireSondes(),
    lireMesuresNavigateur(),
    lirePublications(),
  ]);
  const developpeurs = sondes.donnees.filter((s) => s.type === "dev");
  const villesSondees = new Set(developpeurs.map((s) => s.ville));

  // Les villes d'ou l'on demande ou mesure, sans sonde pour repondre.
  const manques = new Map<
    string,
    { pays: string; demandes: number; suivis: number; mesures: number }
  >();
  for (const m of navigateur.donnees) {
    if (villesSondees.has(m.ville)) continue;
    const v = manques.get(m.ville) ?? {
      pays: m.pays,
      demandes: 0,
      suivis: 0,
      mesures: 0,
    };
    v.mesures += 1;
    manques.set(m.ville, v);
  }
  for (const p of publications.donnees) {
    if (!p.demande || p.demande.sondeSurPlace) continue;
    const v = manques.get(p.demande.ville) ?? {
      pays: p.pays,
      demandes: 0,
      suivis: 0,
      mesures: 0,
    };
    v.demandes += 1;
    v.suivis += p.demande.suivis;
    manques.set(p.demande.ville, v);
  }
  const listeManques = [...manques].sort(
    ([, a], [, b]) =>
      b.demandes * 10 + b.mesures - (a.demandes * 10 + a.mesures),
  );

  const facons = [
    {
      duree: "5 minutes · le plus utile",
      titre: "Héberger une sonde",
      texte:
        "Une commande sur votre ordinateur. Votre connexion mesure les services suivis toutes les 10 minutes, et répond aux demandes de votre ville.",
      lien: lien(langue, "/contribuer/sonde"),
      action: "Commencer",
      avant: true,
    },
    {
      duree: "10 secondes",
      titre: "Mesurer depuis chez moi",
      texte:
        "Depuis votre navigateur, sans rien installer. Le résultat reste sur votre écran.",
      lien: lien(langue, "/mesurer"),
      action: "Mesurer",
    },
    {
      duree: "2 minutes",
      titre: "Partager ce qui a marché",
      texte:
        "Un miroir, un réglage, une heure qui marche. Le contexte mesuré est joint, pour que d'autres sachent si ça s'applique à eux.",
      lien: lien(langue, "/publier"),
      action: "Publier",
    },
    {
      duree: "1 clic",
      titre: "Confirmer une solution",
      texte:
        "« A marché pour moi aussi » : votre ville et votre opérateur aident les autres à savoir où une solution fonctionne.",
      lien: lien(langue, "/echanges"),
      action: "Voir les échanges",
    },
  ];
  const confirmations = publications.donnees.reduce(
    (s, p) => s + p.confirmations.length,
    0,
  );

  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <div className={styles.entete} lang="fr">
        <h1>Construire ensemble l&apos;observatoire</h1>
        <p className={styles.chapeau}>
          YITERE n&apos;a de valeur que par ce que les développeurs y apportent
          : des mesures depuis leur connexion, et ce qui a marché chez eux.
          Quatre façons d&apos;aider, de 10 secondes à quelques minutes.
        </p>
      </div>

      <div className={styles.grille} lang="fr">
        {facons.map((f) => (
          <div
            key={f.titre}
            className={styles.carte}
            data-mise-en-avant={f.avant || undefined}
          >
            <span className={styles.duree}>{f.duree}</span>
            <h3>{f.titre}</h3>
            <p className={styles.corps}>{f.texte}</p>
            <Link href={f.lien} className={styles.lienCarte}>
              {f.action}
            </Link>
          </div>
        ))}
      </div>

      {listeManques.length > 0 && (
        <section aria-labelledby="manque" className={styles.section} lang="fr">
          <h2 id="manque">Là où une sonde manque</h2>
          <p>
            Des développeurs ont posé une question à laquelle aucune sonde ne
            peut répondre, ou mesuré depuis une ville sans sonde. Une sonde dans
            ces villes y répondrait automatiquement.
          </p>
          <div className={styles.grille}>
            {listeManques.map(([ville, m]) => (
              <div key={ville} className={styles.manque}>
                <span className={styles.gras}>
                  {ville}{" "}
                  <span className={styles.discret}>
                    · {nomPays("fr", m.pays)}
                  </span>
                </span>
                <span className={styles.corps}>
                  {[
                    m.demandes
                      ? `${m.demandes} demande${m.demandes > 1 ? "s" : ""} en attente (${m.suivis} personnes la suivent)`
                      : "",
                    m.mesures
                      ? `${m.mesures} mesure${m.mesures > 1 ? "s" : ""} navigateur sur 24 h, sans sonde pour comparer`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <Link href={lien(langue, "/contribuer/sonde")}>
                  Héberger la première sonde à {ville}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="bilan" className={styles.bilan} lang="fr">
        <div className={styles.bilanTitre}>
          <h2 id="bilan">Ce que la communauté a apporté</h2>
        </div>
        <dl>
          <div>
            <dt>
              sondes développeur, dans{" "}
              {new Set(developpeurs.map((s) => s.pays)).size} pays
            </dt>
            <dd>{developpeurs.length}</dd>
          </div>
          <div>
            <dt>mesures navigateur sur 24 h</dt>
            <dd>{navigateur.donnees.length}</dd>
          </div>
          <div>
            <dt>solutions publiées</dt>
            <dd>
              {
                publications.donnees.filter((p) => p.type === "contournement")
                  .length
              }
            </dd>
          </div>
          <div>
            <dt>confirmations « a marché pour moi »</dt>
            <dd>{confirmations}</dd>
          </div>
          <div>
            <dt>demandes de mesure</dt>
            <dd>
              {publications.donnees.filter((p) => p.type === "demande").length}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
