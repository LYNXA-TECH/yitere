import type { Metadata } from "next";
import Link from "next/link";
import {
  ListeEchanges,
  type CarteEchange,
} from "@/components/echanges/ListeEchanges";
import styles from "@/components/echanges/echanges.module.css";
import { MentionFrancais } from "@/components/MentionFrancais";
import {
  contexte,
  lieu,
  signature,
  statut,
} from "@/lib/affichage/publications";
import { ecritureOuverte, lirePublications, lireVerdicts } from "@/lib/donnees";
import { heureUTC, minutesEntre, nomPays } from "@/lib/format";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";

type Props = { params: Promise<{ langue: string }> };

export const revalidate = 60;

export const metadata: Metadata = { title: "Échanges" };

/** Page en francais seulement (decision 0002, D13) : le contenu vient de la communaute. */
export default async function Echanges({ params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire("fr");
  const [publications, verdicts] = await Promise.all([
    lirePublications(),
    lireVerdicts(),
  ]);
  const maintenant = verdicts.lueLe ?? new Date().toISOString();
  const nomDe = (cle: string) =>
    verdicts.donnees.find((v) => v.cible.cle === cle)?.cible.nom ?? cle;

  const cartes: CarteEchange[] = publications.donnees.map((p) => {
    const s = statut(p, t);
    return {
      id: p.id,
      type: p.type,
      cible: p.cible,
      pays: p.pays,
      operateurs: [
        ...new Set(
          [p.operateur, p.contexte?.operateur].filter((o): o is string =>
            Boolean(o),
          ),
        ),
      ],
      etiquettes: p.etiquettes,
      enCours: p.contexte?.enCours ?? false,
      votes: p.votes,
      confirmations: p.confirmations.length,
      creeLe: p.creeLe,
      confirmee: p.confirmee,
      genre:
        p.type === "demande" ? t.publication.demande : t.publication.solution,
      nomCible: nomDe(p.cible),
      titre: p.titre,
      contenu: p.contenu,
      contexte:
        contexte(p, t, maintenant) +
        (p.contexte?.enCours ? " · toujours en cours" : ""),
      statut: s.texte,
      statutCle: s.cle,
      signature: [
        signature(p),
        lieu(p, "fr"),
        t.publication.ilYA(minutesEntre(p.creeLe, maintenant)),
        p.reponses.length
          ? `${p.reponses.length} réponse${p.reponses.length > 1 ? "s" : ""}`
          : "aucune réponse",
        p.demande?.suivis ? `${p.demande.suivis} suivent` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      href: lien(langue, `/echanges/${p.id}`),
    };
  });
  const uniques = <T,>(valeurs: T[]) => [...new Set(valeurs)];
  const incidents = verdicts.donnees.filter(
    (v) => v.observation.etat === "degrade",
  );
  const enAttente = publications.donnees.filter(
    (p) => p.demande && !p.demande.sondeSurPlace,
  );

  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <div lang="fr" className={styles.entete}>
        <div>
          <h1>Échanges</h1>
          <p>
            Ce qui a marché chez d&apos;autres développeurs, et les questions en
            attente d&apos;une mesure. Chaque publication garde le contexte que
            les sondes observaient au moment où elle a été écrite.
          </p>
        </div>
        <div className={styles.boutons}>
          <Link
            href={lien(langue, "/publier?type=contournement")}
            className={styles.principal}
          >
            Partager une solution
          </Link>
          <Link
            href={lien(langue, "/publier?type=demande")}
            className={styles.secondaire}
          >
            Demander une mesure
          </Link>
        </div>
      </div>

      <div lang="fr">
        <ListeEchanges
          cartes={cartes}
          aucune={`${t.publication.aucune} ${ecritureOuverte(publications) ? "" : t.publication.prochaineEtape}`.trim()}
          services={verdicts.donnees.map((v) => ({
            valeur: v.cible.cle,
            libelle: v.cible.nom,
          }))}
          pays={uniques(publications.donnees.map((p) => p.pays)).map((iso) => ({
            valeur: iso,
            libelle: nomPays("fr", iso),
          }))}
          operateurs={uniques(cartes.flatMap((c) => c.operateurs))
            .sort()
            .map((o) => ({ valeur: o, libelle: o }))}
          etiquettes={uniques(
            publications.donnees.flatMap((p) => p.etiquettes),
          )}
          lienPublier={lien(langue, "/publier")}
          encadres={
            <aside className={styles.encadres}>
              <section aria-labelledby="incidents" className={styles.encadre}>
                <h2 id="incidents">
                  Incidents en cours · {heureUTC("fr", maintenant)}
                </h2>
                {incidents.length === 0 && (
                  <span className={styles.discret}>
                    Aucun incident en cours.
                  </span>
                )}
                {incidents.map((v) => {
                  const n = publications.donnees.filter(
                    (p) =>
                      p.cible === v.cible.cle &&
                      p.type === "contournement" &&
                      p.contexte?.enCours,
                  ).length;
                  return (
                    <Link
                      key={v.cible.cle}
                      href={lien(langue, `/services/${v.cible.cle}`)}
                      className={styles.incident}
                    >
                      <span className={styles.nomService}>{v.cible.nom}</span>
                      <span className={styles.orange}>
                        {v.observation.depuis
                          ? t.verdict.degradationDepuis(v.observation.depuis)
                          : t.verdict.degradation}
                      </span>
                      <span className={styles.petit}>
                        {v.hypothese?.cause === "operateur"
                          ? `Cause probable : ${v.hypothese.operateur}`
                          : "Cause indéterminée"}{" "}
                        · {n} solution{n > 1 ? "s publiées" : " publiée"}{" "}
                        pendant l&apos;incident
                      </span>
                    </Link>
                  );
                })}
              </section>
              {enAttente.length > 0 && (
                <section
                  aria-labelledby="attente"
                  className={styles.encadre}
                  data-genre="attente"
                >
                  <h2 id="attente">Demandes sans sonde pour répondre</h2>
                  {enAttente.map((p) => (
                    <span key={p.id}>
                      « {p.titre} »{" "}
                      <span className={styles.discret}>
                        {p.demande?.suivis
                          ? `· ${p.demande.suivis} personnes attendent`
                          : ""}
                      </span>
                    </span>
                  ))}
                  <span>
                    Une sonde dans cette ville répondrait automatiquement, par
                    la donnée.
                  </span>
                  <Link
                    href={lien(langue, "/contribuer/sonde")}
                    className={styles.lien}
                  >
                    Héberger une sonde
                  </Link>
                </section>
              )}
              <section
                aria-labelledby="regle"
                className={styles.encadre}
                data-genre="regle"
              >
                <h2 id="regle">La règle des échanges</h2>
                <span>
                  On partage des contournements techniques que d&apos;autres
                  peuvent essayer.
                </span>
                <span>
                  « A marché pour moi aussi » : une confirmation par personne,
                  avec sa ville et son opérateur. À partir de 3 confirmations
                  dans 2 villes, la solution est marquée « confirmée par la
                  communauté ».
                </span>
                <span>
                  Pas de publicité. Pas d&apos;accusation contre un opérateur
                  sans mesure à l&apos;appui : le contexte des sondes est joint
                  automatiquement.
                </span>
                <span>
                  Après 3 signalements, une publication est masquée en attendant
                  la relecture de l&apos;équipe.
                </span>
              </section>
            </aside>
          }
        />
      </div>
    </main>
  );
}
