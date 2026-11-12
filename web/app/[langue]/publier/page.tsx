import type { Metadata } from "next";
import Link from "next/link";
import { Bientot } from "@/components/Bientot";
import { BoutonConnexion } from "@/components/BoutonConnexion";
import { MentionFrancais } from "@/components/MentionFrancais";
import { Formulaire } from "@/components/publier/Formulaire";
import styles from "@/components/publier/publier.module.css";
import { texteCause } from "@/lib/affichage/verdicts";
import { ecritureOuverte, lirePublications, lireVerdicts } from "@/lib/donnees";
import { heureUTC } from "@/lib/format";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";

type Props = { params: Promise<{ langue: string }> };

export const revalidate = 60;

export const metadata: Metadata = { title: "Publier" };

/** Page en francais seulement (decision 0002, D13). */
export default async function Publier({ params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire("fr");
  const [verdicts, publications] = await Promise.all([
    lireVerdicts(),
    lirePublications(),
  ]);
  if (!ecritureOuverte(publications))
    return (
      <>
        <MentionFrancais langue={langue} />
        <Bientot
          langue={langue}
          surtitre="Publier"
          titre="Bientôt"
          texte={`${t.publication.aucune} ${t.publication.prochaineEtape}`}
        />
      </>
    );
  const heure = heureUTC("fr", verdicts.lueLe ?? new Date().toISOString());
  // Les services en incident d'abord : c'est la que l'on publie le plus.
  const services = [...verdicts.donnees]
    .sort(
      (a, b) =>
        Number(b.observation.etat === "degrade") -
        Number(a.observation.etat === "degrade"),
    )
    .map((v) => {
      const degrade = v.observation.etat === "degrade";
      const cause = v.hypothese
        ? `Cause probable : ${texteCause(v.hypothese, t.verdict)}`
        : "Cause indéterminée";
      return {
        cle: v.cible.cle,
        nom: v.cible.nom,
        contexte: degrade
          ? `À ${heure} : ${t.verdict.degradationDepuis(v.observation.depuis ?? "").toLowerCase()} · ${cause} · ${t.carte.compteurs(v.preuves.sondesTouchees, v.preuves.sondesEpargnees, v.preuves.mesures, 0)}`
          : null,
        apercu:
          degrade && v.hypothese?.operateur
            ? `Publiée pendant la dégradation ${t.services.nomCourt(v.cible.cle)} · ${v.hypothese.operateur} · ${v.hypothese.ville ?? ""}`
            : degrade
              ? `Publiée pendant la dégradation ${t.services.nomCourt(v.cible.cle)}`
              : null,
      };
    });
  const technologies = [
    ...new Set([
      "npm",
      "Docker",
      "pip",
      "Git",
      "CI",
      ...publications.donnees.flatMap((p) => p.etiquettes),
    ]),
  ];

  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <nav aria-label="Fil d'Ariane" className={styles.ariane} lang="fr">
        <Link href={lien(langue, "/echanges")}>Échanges</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Publier</span>
      </nav>
      <div lang="fr">
        <h1>Partager avec les autres développeurs</h1>
        <p className={styles.chapeau}>
          Ce qui a marché chez vous peut débloquer quelqu&apos;un d&apos;autre
          aujourd&apos;hui. Les mesures des sondes au moment de la publication
          sont jointes pour qu&apos;on sache dans quel contexte votre solution a
          marché.
        </p>
      </div>
      <section className={styles.connexion} lang="fr">
        <span>
          Pour publier, connectez-vous avec GitHub. Vous apparaîtrez sous votre
          pseudonyme GitHub ; votre ville et votre opérateur sont déduits de la
          connexion, votre adresse IP n&apos;est pas conservée.
        </span>
        <BoutonConnexion
          className={styles.github}
          message={t.publication.connexionRequise}
        >
          Se connecter avec GitHub
        </BoutonConnexion>
      </section>
      <div lang="fr">
        <Formulaire
          services={services}
          technologies={technologies}
          typeInitial="solution"
          messageConnexion={t.publication.connexionRequise}
        />
      </div>
    </main>
  );
}
