import type { Metadata } from "next";
import { BandeauSource } from "@/components/BandeauSource";
import { CarteAfrique, type PointVille } from "@/components/CarteAfrique";
import { lireSondes, lireVerdicts } from "@/lib/donnees";
import { resumerVilles } from "@/lib/donnees/villes";
import { nomPays } from "@/lib/format";
import { projeter } from "@/lib/geo/projection";
import { VILLES } from "@/lib/geo/villes";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";
import styles from "@/styles/page.module.css";

type Props = { params: Promise<{ langue: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: dictionnaire(await langueDe(params)).carte.titre };
}

export default async function Carte({ params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire(langue);
  const [sondes, verdicts] = await Promise.all([lireSondes(), lireVerdicts()]);
  const villes = resumerVilles(sondes.donnees, verdicts.donnees);

  const points: PointVille[] = villes.flatMap((v) => {
    const coordonnees = VILLES[v.ville];
    const position = coordonnees && projeter(coordonnees.lat, coordonnees.lon);
    return position
      ? [
          {
            nom: v.ville,
            ...position,
            sondes: v.sondes,
            citee: v.verdicts.length > 0,
          },
        ]
      : [];
  });
  const total = villes.reduce((somme, v) => somme + v.sondes, 0);

  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>{t.carte.titre}</h1>
      <p className={styles.intro}>{t.carte.intro}</p>
      <BandeauSource lectures={[sondes, verdicts]} textes={t.source} />
      <p className={styles.onglets}>
        <a className={styles.boutonSecondaire} href="#vue-carte">
          {t.carte.vueCarte}
        </a>
        <a className={styles.boutonSecondaire} href="#vue-liste">
          {t.carte.vueListe}
        </a>
      </p>

      <section
        id="vue-carte"
        className={styles.section}
        aria-label={t.carte.vueCarte}
      >
        <CarteAfrique
          villes={points}
          paysAvecSondes={new Set(villes.map((v) => v.pays))}
          description={t.carte.descriptionCarte(points.length, total)}
        />
        <ul className={styles.discret}>
          <li>{t.carte.legendeSondes}</li>
          <li>{t.carte.legendeVerdict}</li>
        </ul>
      </section>

      <section
        id="vue-liste"
        className={styles.section}
        aria-labelledby="titre-liste"
      >
        <h2 id="titre-liste">{t.carte.vueListe}</h2>
        <div className={styles.defilement}>
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th scope="col">{t.carte.ville}</th>
                <th scope="col">{t.carte.pays}</th>
                <th scope="col">{t.carte.sondes}</th>
                <th scope="col">{t.carte.verdicts}</th>
              </tr>
            </thead>
            <tbody>
              {villes.map((v) => (
                <tr key={v.ville}>
                  <th scope="row">{v.repere ? `${v.ville} *` : v.ville}</th>
                  <td>{nomPays(langue, v.pays)}</td>
                  <td>{t.carte.nbSondes(v.sondes, v.enRodage)}</td>
                  <td>
                    {v.verdicts.length === 0
                      ? t.carte.aucun
                      : v.verdicts.map((c, i) => (
                          <span key={c.cle}>
                            {i > 0 && ", "}
                            <a href={lien(langue, `/services/${c.cle}`)}>
                              {c.nom}
                            </a>
                          </span>
                        ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {villes.some((v) => v.repere) && (
          <p className={styles.discret}>* {t.carte.horsCarte}</p>
        )}
      </section>
    </main>
  );
}
