import type { Metadata } from "next";
import { BandeauSource } from "@/components/BandeauSource";
import { CartePublication } from "@/components/CartePublication";
import { MentionFrancais } from "@/components/MentionFrancais";
import { lireCibles, lirePublications } from "@/lib/donnees";
import { nomPays } from "@/lib/format";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";
import styles from "@/styles/page.module.css";

type Props = { params: Promise<{ langue: string }> };

export const revalidate = 60;

export const metadata: Metadata = { title: "Échanges" };

/** Page en francais seulement (decision 0002, D13) : le contenu vient de la communaute. */
export default async function Echanges({ params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire("fr");
  const [cibles, publications] = await Promise.all([
    lireCibles(),
    lirePublications(),
  ]);
  const nomDe = new Map(cibles.donnees.map((c) => [c.cle, c.nom]));
  const recentes = [...publications.donnees].sort((a, b) =>
    b.creeLe.localeCompare(a.creeLe),
  );

  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <div lang="fr" className={styles.colonne}>
        <h1 className={styles.titre}>{t.echanges.titre}</h1>
        <p className={styles.intro}>{t.echanges.intro}</p>
        <BandeauSource lectures={[cibles, publications]} textes={t.source} />
        <ul className={styles.liste}>
          {recentes.map((p) => (
            <li key={p.id}>
              <CartePublication
                publication={p}
                textes={t.echanges}
                service={{
                  nom: nomDe.get(p.cible) ?? p.cible,
                  href: lien(langue, `/services/${p.cible}`),
                }}
                nomPays={(iso) => nomPays("fr", iso)}
              />
            </li>
          ))}
        </ul>
        <p className={styles.discret}>{t.echanges.publier}</p>
      </div>
    </main>
  );
}
