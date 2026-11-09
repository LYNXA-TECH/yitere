import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BandeauSource } from "@/components/BandeauSource";
import { BlocVerdict } from "@/components/BlocVerdict";
import { CartePublication } from "@/components/CartePublication";
import { PastilleEtat } from "@/components/PastilleEtat";
import {
  estService,
  lireCibles,
  lirePublications,
  lireVerdicts,
} from "@/lib/donnees";
import { nomPays } from "@/lib/format";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";
import styles from "@/styles/page.module.css";

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
  return { cibles, cible };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cle } = await params;
  const { cible } = await trouverService(cle);
  return { title: cible.nom };
}

export default async function FicheService({ params }: Props) {
  const langue = await langueDe(params);
  const { cle } = await params;
  const t = dictionnaire(langue);
  const { cibles, cible } = await trouverService(cle);
  const [verdicts, publications] = await Promise.all([
    lireVerdicts(),
    lirePublications(),
  ]);
  const verdict = verdicts.donnees.find((v) => v.cible.cle === cle);
  const etat = verdict?.observation.etat ?? "pas-de-donnee";
  const solutions = publications.donnees.filter((p) => p.cible === cle);

  return (
    <main className={styles.page}>
      <p className={styles.retour}>
        <a href={lien(langue, "/services")}>← {t.fiche.retour}</a>
      </p>
      <h1 className={styles.titre}>{cible.nom}</h1>
      <PastilleEtat etat={etat} libelle={t.etats[etat]} />
      <BandeauSource
        lectures={[cibles, verdicts, publications]}
        textes={t.source}
      />

      {verdict && (
        <BlocVerdict
          verdict={verdict}
          textes={t.verdict}
          lienMethode={lien(langue, "/methodologie")}
        />
      )}

      <section className={styles.section} aria-labelledby="solutions">
        <h2 id="solutions">{t.fiche.solutions}</h2>
        {solutions.length === 0 ? (
          <p className={styles.discret}>{t.fiche.aucuneSolution}</p>
        ) : (
          <ul className={styles.liste}>
            {solutions.map((p) => (
              <li key={p.id}>
                <CartePublication
                  publication={p}
                  textes={t.echanges}
                  nomPays={(iso) => nomPays(langue, iso)}
                />
              </li>
            ))}
          </ul>
        )}
        <p>
          <a href={lien(langue, "/echanges")}>{t.fiche.voirEchanges}</a>
        </p>
      </section>

      <dl className={styles.details}>
        <dt>{t.fiche.adresse}</dt>
        <dd>
          <code>{cible.url}</code>
        </dd>
        <dt>{t.fiche.cadence}</dt>
        <dd>{t.services.cadence(cible.cadenceMinutes)}</dd>
        <dt>{t.fiche.reponseAttendue}</dt>
        <dd>{t.fiche.codeAttendu(cible.codeAttendu)}</dd>
      </dl>
    </main>
  );
}
