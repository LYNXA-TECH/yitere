import { lieu, signature } from "@/lib/affichage/publications";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoutonConnexion } from "@/components/BoutonConnexion";
import { BoutonCopier } from "@/components/BoutonCopier";
import { compterVilles } from "@/components/CartePublication";
import { Etiquette } from "@/components/Etiquette";
import { MentionFrancais } from "@/components/MentionFrancais";
import styles from "@/components/echanges/publication.module.css";
import { teinte, texteHypothese } from "@/lib/affichage/verdicts";
import { lirePublications, lireSondes, lireVerdicts } from "@/lib/donnees";
import type { Publication, Sonde } from "@/lib/donnees/types";
import { heureUTC, minutesEntre } from "@/lib/format";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";

type Props = { params: Promise<{ langue: string; id: string }> };

// Rendue a chaque visite, a partir de GET /api/v1/publications (garde 60 s) : une
// publication validee apres le build a sa page. Pas de generateStaticParams : avec lui,
// le dynamicParams = false du gabarit [langue] l'emporte et toute publication publiee
// apres le build repondait 404. Un identifiant inconnu donne la page introuvable.
export const dynamic = "force-dynamic";

async function trouver(id: string): Promise<Publication> {
  const p = (await lirePublications()).donnees.find((x) => x.id === id);
  if (!p) notFound();
  return p;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await trouver((await params).id)).titre };
}

const HEURE_MS = 3_600_000;

/** Page en francais seulement (decision 0002, D13). */
export default async function DetailPublication({ params }: Props) {
  const langue = await langueDe(params);
  const p = await trouver((await params).id);
  const t = dictionnaire("fr");
  const pub = t.publication;
  const [verdicts, sondes, publications] = await Promise.all([
    lireVerdicts(),
    lireSondes(),
    lirePublications(),
  ]);
  const maintenant = verdicts.lueLe ?? new Date().toISOString();
  const verdict = verdicts.donnees.find((v) => v.cible.cle === p.cible);
  const nomCible = verdict?.cible.nom ?? p.cible;
  const autres = publications.donnees.filter(
    (x) =>
      x.id !== p.id &&
      x.type === "contournement" &&
      x.cible === p.cible &&
      x.contexte?.enCours &&
      p.contexte?.enCours,
  );
  const fiche = lien(langue, `/services/${p.cible}`);

  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <nav aria-label="Fil d'Ariane" className={styles.ariane} lang="fr">
        <Link href={lien(langue, "/echanges")}>Échanges</Link>
        <span aria-hidden="true">/</span>
        <Link href={fiche}>{nomCible}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">
          {p.type === "demande" ? "Demande" : "Solution"}
        </span>
      </nav>

      <div className={styles.colonnes} lang="fr">
        <div className={styles.principal}>
          <article
            className={styles.carte}
            data-confirmee={p.confirmee || undefined}
          >
            <div className={styles.badges}>
              <span className={styles.genre} data-type={p.type}>
                {p.type === "demande" ? pub.demande : pub.solution}
              </span>
              {p.confirmee && (
                <span className={styles.confirmee}>{pub.confirmee}</span>
              )}
              {p.contexte && (
                <span className={styles.incident}>
                  Publiée pendant un incident
                </span>
              )}
              {p.etiquettes.map((e) => (
                <span key={e} className={styles.etiquette}>
                  {e}
                </span>
              ))}
            </div>
            <h1>{p.titre}</h1>
            {p.contenu && <p className={styles.chapeau}>{p.contenu}</p>}
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
              Par <span className={styles.auteur}>{signature(p)}</span>
              {lieu(p, "fr") ? ` · ${lieu(p, "fr")}` : ""}
              {p.operateur ? ` · ${pub.operateur(p.operateur)}` : ""} ·{" "}
              {pub.ilYA(minutesEntre(p.creeLe, maintenant))} (
              {heureUTC("fr", p.creeLe)}) · non vérifié par YITERE
            </span>
            <div className={styles.actions}>
              <BoutonConnexion
                className={styles.bouton}
                message={pub.connexionRequise}
              >
                {pub.aMarche}
              </BoutonConnexion>
              <BoutonConnexion
                className={styles.bouton}
                message={pub.connexionRequise}
              >
                Utile · {p.votes}
              </BoutonConnexion>
              <BoutonConnexion
                className={styles.bouton}
                message={pub.connexionRequise}
              >
                Suivre
              </BoutonConnexion>
              <span className={styles.ressort} />
              <BoutonConnexion
                className={styles.signaler}
                message={pub.connexionRequise}
              >
                {pub.signaler}
              </BoutonConnexion>
            </div>
          </article>

          {p.contexte && verdict && (
            <section
              aria-labelledby="contexte"
              className={styles.cadre}
              data-teinte="degrade"
            >
              <h2 id="contexte">
                Ce que les sondes observaient quand elle a été publiée
              </h2>
              <span className={styles.discret}>
                Joint automatiquement à la publication, à{" "}
                {heureUTC("fr", p.creeLe)}. Ce n&apos;est pas l&apos;avis de
                l&apos;auteur : ce sont les mesures.
              </span>
              <div className={styles.rangee}>
                <Etiquette nature="observe" teinte={teinte(verdict)}>
                  {t.verdict.observe}
                </Etiquette>
                <span>
                  {verdict.observation.depuis
                    ? t.verdict.degradationDepuis(verdict.observation.depuis)
                    : t.verdict.degradation}
                </span>
              </div>
              <div className={styles.rangee}>
                <Etiquette nature="hypothese">
                  {verdict.hypothese
                    ? t.verdict.hypothese
                    : t.verdict.indetermine}
                </Etiquette>
                <span>{texteHypothese(verdict, t.verdict)}</span>
              </div>
              <span className={styles.discret}>
                {t.carte.compteurs(
                  verdict.preuves.sondesTouchees,
                  verdict.preuves.sondesEpargnees,
                  verdict.preuves.mesures,
                  0,
                )}
              </span>
              {p.contexte.enCours && (
                <span className={styles.encore}>
                  À {heureUTC("fr", maintenant)} : toujours en cours (
                  {texteHypothese(verdict, t.verdict)}).
                </span>
              )}
              <Link href={fiche} className={styles.lien}>
                Diagnostic complet et courbes
              </Link>
            </section>
          )}

          {p.confirmations.length > 0 && (
            <section aria-labelledby="confirmations" className={styles.cadre}>
              <div className={styles.titreCadre}>
                <h2 id="confirmations">
                  A marché pour {p.confirmations.length} personne
                  {p.confirmations.length > 1 ? "s" : ""}
                </h2>
                <span className={styles.discret}>
                  {compterVilles(p.confirmations.map((c) => c.ville))}
                </span>
              </div>
              <div className={styles.defilement}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Ville</th>
                      <th scope="col">Opérateur</th>
                      <th scope="col">Quand</th>
                      <th scope="col">Sondes de cet opérateur, à ce moment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...p.confirmations].reverse().map((c, i) => {
                      const etat = sondesAuMoment(
                        sondes.donnees,
                        c.ville,
                        c.operateur,
                        p.cible,
                        c.le,
                        maintenant,
                      );
                      return (
                        <tr key={i}>
                          <td>{c.ville}</td>
                          <td>{c.operateur ?? "non détecté"}</td>
                          <td className={styles.chiffres}>
                            {heureUTC("fr", c.le)}
                          </td>
                          <td data-etat={etat.cle}>{etat.texte}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <span className={styles.petit}>
                Une confirmation par personne connectée. La ville et
                l&apos;opérateur viennent de la connexion au moment du clic,
                jamais l&apos;adresse IP. À partir de 3 confirmations dans 2
                villes : « confirmée par la communauté ».
              </span>
            </section>
          )}

          <section aria-labelledby="reponses" className={styles.reponses}>
            <h2 id="reponses">Réponses · {p.reponses.length}</h2>
            {p.reponses.map((r, i) => (
              <article key={i} className={styles.reponse}>
                <span className={styles.petit}>
                  <strong>@{r.auteur}</strong> · {r.ville} ·{" "}
                  {pub.ilYA(minutesEntre(r.le, maintenant))}
                </span>
                <p>{r.contenu}</p>
              </article>
            ))}
            <form className={styles.formulaire} action={lien(langue, "/moi")}>
              <label htmlFor="reponse" className={styles.gras}>
                Votre réponse
              </label>
              <textarea
                id="reponse"
                name="reponse"
                rows={4}
                maxLength={600}
                placeholder="Précisez votre contexte : ville, opérateur, version..."
              />
              <span className={styles.petit}>
                Restez technique : ce qui a marché, ce qui n&apos;a pas marché.
                600 caractères au plus.
              </span>
              <BoutonConnexion
                className={styles.envoyer}
                message={pub.connexionRequise}
              >
                Répondre
              </BoutonConnexion>
            </form>
          </section>
        </div>

        <aside className={styles.cote}>
          {autres.length > 0 && (
            <section aria-labelledby="autres" className={styles.cadre}>
              <h2 id="autres">Autres solutions pour cet incident</h2>
              {autres.map((x) => (
                <Link
                  key={x.id}
                  href={lien(langue, `/echanges/${x.id}`)}
                  className={styles.autre}
                >
                  <span className={styles.gras}>{x.titre}</span>
                  <span className={styles.petit}>
                    {x.confirmations.length} confirmation
                    {x.confirmations.length > 1 ? "s" : ""} · {x.votes} votes
                  </span>
                </Link>
              ))}
            </section>
          )}
          <section aria-labelledby="suivre" className={styles.cadre}>
            <h2 id="suivre">
              Suivre cette {p.type === "demande" ? "demande" : "solution"}
            </h2>
            <span className={styles.corps}>
              Vous serez prévenue dans YITERE si quelqu&apos;un répond, ou si
              l&apos;incident se termine. Pas d&apos;e-mail.
            </span>
          </section>
        </aside>
      </div>
    </main>
  );
}

/** Ce que voyaient les sondes du meme operateur et de la meme ville, a l'heure d'une confirmation. */
function sondesAuMoment(
  sondes: Sonde[],
  ville: string,
  operateur: string | null,
  cible: string,
  le: string,
  maintenant: string,
): { cle: "aucune" | "degrade" | "normal"; texte: string } {
  const pas =
    23 - Math.floor((Date.parse(maintenant) - Date.parse(le)) / HEURE_MS);
  const concernees = sondes.filter(
    (s) =>
      s.type === "dev" &&
      s.ville === ville &&
      (operateur === null || s.operateur === operateur),
  );
  if (concernees.length === 0)
    return { cle: "aucune", texte: `aucune sonde à ${ville}` };
  const degradees = concernees.filter(
    (s) => s.etats[cible]?.[pas] === "degrade",
  ).length;
  return degradees
    ? {
        cle: "degrade",
        texte: `${degradees} sur ${concernees.length} dégradée${degradees > 1 ? "s" : ""}`,
      }
    : {
        cle: "normal",
        texte: `${concernees.length} normale${concernees.length > 1 ? "s" : ""}`,
      };
}
