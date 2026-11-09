import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoutonConnexion } from "@/components/BoutonConnexion";
import { CarteDemande, CarteSolution } from "@/components/CartePublication";
import { Cascades } from "@/components/fiche/Cascades";
import { Diagnostic } from "@/components/fiche/Diagnostic";
import { Graphique } from "@/components/fiche/Graphique";
import styles from "@/components/fiche/fiche.module.css";
import { valeur } from "@/lib/affichage/verdicts";
import {
  estService,
  lireCibles,
  lireDetail,
  lirePublications,
  lireResumes,
  lireVerdicts,
} from "@/lib/donnees";
import type {
  DetailService,
  PreuveSonde,
  ResumeService,
  Verdict,
} from "@/lib/donnees/types";
import { dictionnaire, type Dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";

type Props = { params: Promise<{ langue: string; cle: string }> };

export const revalidate = 60;

/**
 * Une fiche par service connu a la compilation. Une cible ajoutee ensuite dans la base
 * obtient sa fiche a la premiere visite, sans une ligne de code (decision 0002, D11).
 */
export async function generateStaticParams() {
  const cibles = await lireCibles();
  return cibles.donnees.filter(estService).map(({ cle }) => ({ cle }));
}

async function trouverService(cle: string) {
  const cibles = await lireCibles();
  const cible = cibles.donnees.find((c) => c.cle === cle && estService(c));
  if (!cible) notFound();
  return cible;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cle } = await params;
  return { title: (await trouverService(cle)).nom };
}

export default async function FicheService({ params }: Props) {
  const langue = await langueDe(params);
  const { cle } = await params;
  const t = dictionnaire(langue);
  const cible = await trouverService(cle);
  const [verdicts, resumes, detail, publications] = await Promise.all([
    lireVerdicts(),
    lireResumes(),
    lireDetail(cle),
    lirePublications(),
  ]);
  const verdict = verdicts.donnees.find((v) => v.cible.cle === cle);
  const resume = resumes.donnees.find((r) => r.cle === cle);
  if (!verdict || !resume || !detail.donnees) notFound();
  const maintenant = verdicts.lueLe ?? new Date().toISOString();
  const nomCourt = t.services.nomCourt(cle);

  // D'abord les solutions publiees pendant l'incident en cours, puis par confirmations et votes.
  const enCours = (p: (typeof publications.donnees)[number]) =>
    p.contexte?.enCours === true;
  const solutions = publications.donnees
    .filter((p) => p.cible === cle && p.type === "contournement")
    .sort(
      (a, b) =>
        (enCours(b) ? 1000 : 0) +
        b.confirmations.length * 10 +
        b.votes -
        ((enCours(a) ? 1000 : 0) + a.confirmations.length * 10 + a.votes),
    );
  const demandes = publications.donnees.filter(
    (p) => p.cible === cle && p.type === "demande",
  );

  return (
    <main className={styles.page}>
      <div className={styles.entete}>
        <nav aria-label={t.fiche.filAriane} className={styles.ariane}>
          <Link href={lien(langue, "/services")}>{t.navigation.services}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{cible.nom}</span>
        </nav>
        <div className={styles.titre}>
          <div className={styles.bloc}>
            <h1>{cible.nom}</h1>
            <span className={styles.discret}>
              {t.fiche.meta(
                t.services.famille(cible.famille),
                t.services.cadence(cible.cadenceMinutes),
                cible.codeAttendu,
                resume.passages,
              )}
            </span>
          </div>
          <div className={styles.boutons}>
            <Link href={lien(langue)} className={styles.boutonSecondaire}>
              {t.fiche.voirCarte}
            </Link>
            {verdict.observation.etat === "degrade" && (
              <BoutonConnexion
                className={styles.boutonSecondaire}
                message={t.publication.connexionRequise}
              >
                {t.fiche.suivre}
              </BoutonConnexion>
            )}
          </div>
        </div>
      </div>

      <Diagnostic
        verdict={verdict}
        t={t}
        calculeLe={maintenant}
        lienMethode={lien(langue, "/methodologie")}
      />

      <section
        id="solutions"
        aria-labelledby="titre-solutions"
        className={styles.solutions}
      >
        <div className={styles.titreSection}>
          <div>
            <h2 id="titre-solutions">{t.fiche.solutionsTitre}</h2>
            <span className={styles.discret}>{t.fiche.solutionsDetail}</span>
          </div>
          <Link href={lien(langue, "/publier")} className={styles.bouton}>
            {t.fiche.partager}
          </Link>
        </div>
        {solutions.length === 0 ? (
          <p className={styles.vide}>
            {t.fiche.aucuneSolution}{" "}
            <Link href={lien(langue, "/publier")}>{t.fiche.premiere}</Link>
          </p>
        ) : (
          <ul className={styles.liste}>
            {solutions.map((p) => (
              <li key={p.id}>
                <CarteSolution
                  publication={p}
                  t={t}
                  maintenant={maintenant}
                  nomCourt={nomCourt}
                  pendantIncident={enCours(p)}
                  lienDetail={lien(langue, `/echanges/${p.id}`)}
                />
              </li>
            ))}
          </ul>
        )}
        {demandes.map((p) => (
          <CarteDemande
            key={p.id}
            publication={p}
            t={t}
            maintenant={maintenant}
          />
        ))}
        <Link href={lien(langue, "/publier")} className={styles.lienSeul}>
          {t.fiche.demanderAutreVille}
        </Link>
      </section>

      <Tuiles verdict={verdict} resume={resume} detail={detail.donnees} t={t} />

      <Graphique
        detail={detail.donnees}
        langue={langue}
        t={t.fiche}
        lecture={lectureGraphique(verdict, t.fiche)}
        note={t.fiche.noteBande(
          detail.donnees.repere.valeur === null
            ? t.fiche.tuileRepereEtat("exclu")
            : `${valeur(detail.donnees.repere.valeur, detail.donnees.unite, t.services)}, ${t.fiche.tuileRepereEtat(detail.donnees.repere.etat)}`,
        )}
      />

      {detail.donnees.cascades.length > 0 && (
        <Cascades
          cascades={detail.donnees.cascades}
          t={t.fiche}
          ms={t.services.ms}
          lecture={
            verdict.hypothese?.cause === "operateur"
              ? t.fiche.tempsLectureOperateur(verdict.hypothese.operateur ?? "")
              : t.fiche.tempsLecture
          }
        />
      )}
    </main>
  );
}

function Tuiles({
  verdict: v,
  resume: r,
  detail,
  t,
}: {
  verdict: Verdict;
  resume: ResumeService;
  detail: DetailService;
  t: Dictionnaire;
}) {
  const f = t.fiche;
  const fmt = (n: number) => valeur(n, r.unite, t.services);
  const moyenne = (p: PreuveSonde[], champ: "valeur" | "habituel") =>
    Math.round(p.reduce((s, x) => s + x[champ], 0) / p.length);
  const touchees = v.preuves.sondes.filter((p) => p.statut === "touchee");
  const epargnees = v.preuves.sondes.filter((p) => p.statut === "epargnee");
  const premiere =
    touchees.length > 0
      ? {
          titre: f.tuilePremierOctetTouchees(touchees.length),
          valeur: fmt(moyenne(touchees, "valeur")),
          comparaison: f.tuileHabituel(fmt(moyenne(touchees, "habituel"))),
          degrade: true,
          pied: f.tuilePiedTouchees(
            touchees.length * 6,
            epargnees.length ? fmt(moyenne(epargnees, "valeur")) : "—",
          ),
        }
      : {
          titre: r.unite === "ms" ? f.tuilePremierOctet : f.tuileDebit,
          valeur: r.valeur === null ? "—" : fmt(r.valeur),
          comparaison: detail.habituel.max
            ? f.tuileHabituel(
                fmt(
                  Math.round((detail.habituel.min + detail.habituel.max) / 2),
                ),
              )
            : "",
          degrade: false,
          pied: f.tuilePiedMediane(v.preuves.mesures),
        };
  const tuiles = [
    premiere,
    {
      titre: f.tuileDisponibilite,
      valeur:
        r.disponibilite === null ? "—" : t.services.pourcent(r.disponibilite),
      comparaison: "",
      degrade: false,
      pied: f.tuilePiedDisponibilite(r.passages),
    },
    {
      titre: f.tuileRepere(r.unite),
      valeur: detail.repere.valeur === null ? "—" : fmt(detail.repere.valeur),
      comparaison: f.tuileRepereEtat(detail.repere.etat),
      degrade: false,
      pied: f.tuilePiedRepere,
    },
  ];
  return (
    <section aria-label={t.fiche.preuves} className={styles.tuiles}>
      {tuiles.map((x) => (
        <div key={x.titre} className={styles.tuile}>
          <span>{x.titre}</span>
          <span className={styles.valeurTuile}>
            <strong data-teinte={x.degrade ? "degrade" : undefined}>
              {x.valeur}
            </strong>
            <span className={styles.discret}>{x.comparaison}</span>
          </span>
          <span className={styles.petit}>{x.pied}</span>
        </div>
      ))}
    </section>
  );
}

function lectureGraphique(v: Verdict, f: Dictionnaire["fiche"]): string {
  if (v.observation.etat === "pas-de-donnee") return f.lectureVide;
  if (v.observation.etat === "normal") return f.lectureNormale;
  if (v.hypothese?.cause === "operateur")
    return f.lectureOperateur(v.hypothese.operateur ?? "");
  const touchees = v.preuves.sondes.filter((p) => p.statut === "touchee");
  return f.lectureIsolee(
    touchees.map((p) => `${p.operateur} · ${p.numero}`).join(", "),
  );
}
