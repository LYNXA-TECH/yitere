import type { Metadata } from "next";
import { BandeauSource } from "@/components/BandeauSource";
import { PastilleEtat } from "@/components/PastilleEtat";
import { estService, lireCibles, lireVerdicts } from "@/lib/donnees";
import type { Cible } from "@/lib/donnees/types";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";
import styles from "@/styles/page.module.css";

type Props = { params: Promise<{ langue: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: dictionnaire(await langueDe(params)).services.titre };
}

export default async function Services({ params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire(langue);
  const [cibles, verdicts] = await Promise.all([lireCibles(), lireVerdicts()]);
  const etatDe = new Map(
    verdicts.donnees.map((v) => [v.cible.cle, v.observation.etat]),
  );

  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>{t.services.titre}</h1>
      <p className={styles.intro}>{t.services.intro}</p>
      <BandeauSource lectures={[cibles, verdicts]} textes={t.source} />

      {parFamille(cibles.donnees.filter(estService)).map(
        ([famille, services]) => (
          <section
            key={famille}
            className={styles.section}
            aria-labelledby={`famille-${famille}`}
          >
            <h2 id={`famille-${famille}`}>{t.services.famille(famille)}</h2>
            <ul className={styles.liste}>
              {services.map((c) => {
                // Sans verdict publie pour ce service, on ne montre rien d'autre que l'absence.
                const etat = etatDe.get(c.cle) ?? "pas-de-donnee";
                return (
                  <li key={c.cle}>
                    <a
                      className={styles.ligneService}
                      href={lien(langue, `/services/${c.cle}`)}
                    >
                      <span className={styles.nomService}>{c.nom}</span>
                      <PastilleEtat etat={etat} libelle={t.etats[etat]} />
                      <span className={styles.discret}>
                        {t.services.cadence(c.cadenceMinutes)}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ),
      )}
    </main>
  );
}

/** Regroupe les cibles par famille, dans l'ordre ou l'API les envoie. */
function parFamille(cibles: Cible[]): [string, Cible[]][] {
  const groupes = new Map<string, Cible[]>();
  for (const c of cibles)
    groupes.set(c.famille, [...(groupes.get(c.famille) ?? []), c]);
  return [...groupes];
}
