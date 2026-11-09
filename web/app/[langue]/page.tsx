import { BandeauSource } from "@/components/BandeauSource";
import { BlocVerdict } from "@/components/BlocVerdict";
import { lireVerdicts } from "@/lib/donnees";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";
import styles from "@/styles/page.module.css";

type Props = { params: Promise<{ langue: string }> };

// Regeneree au plus tot toutes les 60 s (FRAICHEUR_SECONDES ; Next.js exige ici un nombre ecrit en clair).
export const revalidate = 60;

export default async function Accueil({ params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire(langue);
  const verdicts = await lireVerdicts();
  const degrades = verdicts.donnees.filter(
    (v) => v.observation.etat === "degrade",
  );
  const normaux = verdicts.donnees.filter(
    (v) => v.observation.etat === "normal",
  ).length;

  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>{t.accueil.titre}</h1>
      <p className={styles.devise}>{t.site.devise}</p>
      <p className={styles.intro}>{t.accueil.intro}</p>

      <section className={styles.section} aria-labelledby="en-ce-moment">
        <h2 id="en-ce-moment">{t.accueil.enCeMoment}</h2>
        <BandeauSource lectures={[verdicts]} textes={t.source} />
        {degrades.length === 0 ? (
          <p>{t.accueil.aucuneDegradation}</p>
        ) : (
          <ul className={styles.liste}>
            {degrades.map((v) => (
              <li key={v.cible.cle} className={styles.element}>
                <h3>
                  <a href={lien(langue, `/services/${v.cible.cle}`)}>
                    {v.cible.nom}
                  </a>
                </h3>
                <BlocVerdict
                  verdict={v}
                  textes={t.verdict}
                  lienMethode={lien(langue, "/methodologie")}
                />
              </li>
            ))}
          </ul>
        )}
        {normaux > 0 && (
          <p className={styles.discret}>{t.accueil.servicesNormaux(normaux)}</p>
        )}
        <p className={styles.actions}>
          <a className={styles.bouton} href={lien(langue, "/services")}>
            {t.accueil.voirServices}
          </a>
          <a className={styles.boutonSecondaire} href={lien(langue, "/carte")}>
            {t.accueil.voirCarte}
          </a>
        </p>
      </section>

      <section className={styles.encadre} aria-labelledby="contribuer">
        <h2 id="contribuer">{t.accueil.contribuerTitre}</h2>
        <p>{t.accueil.contribuerTexte}</p>
        <p>
          <a href={lien(langue, "/contribuer")}>{t.accueil.contribuerLien}</a>
        </p>
      </section>
    </main>
  );
}
