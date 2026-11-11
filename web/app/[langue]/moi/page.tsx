import { nomOperateur } from "@/lib/affichage/sondes";
import type { Metadata } from "next";
import Link from "next/link";
import { BoutonConnexion } from "@/components/BoutonConnexion";
import { MentionFrancais } from "@/components/MentionFrancais";
import { valeur } from "@/lib/affichage/verdicts";
import {
  lireDetail,
  lirePublications,
  lireSondes,
  lireVerdicts,
} from "@/lib/donnees";
import { nomPays } from "@/lib/format";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";
import styles from "@/styles/document.module.css";

type Props = { params: Promise<{ langue: string }> };

export const revalidate = 60;

export const metadata: Metadata = { title: "Mon espace" };

/**
 * L'espace d'une personne connectee, montre sur une sonde d'exemple tant que la connexion
 * GitHub n'existe pas. Page en francais seulement (decision 0002, D13).
 */
export default async function MonEspace({ params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire("fr");
  const [sondes, verdicts, publications] = await Promise.all([
    lireSondes(),
    lireVerdicts(),
    lirePublications(),
  ]);
  const sonde = sondes.donnees.find((s) => s.type === "dev" && !s.enRodage);
  if (!sonde) return null;
  const valeurs = await Promise.all(
    verdicts.donnees.map(async (v) => {
      const detail = (await lireDetail(v.cible.cle)).donnees;
      const serie = detail?.series24.find(
        (s) => s.sonde.pseudonyme === sonde.pseudonyme,
      );
      const derniere = serie?.points.at(-1) ?? null;
      return {
        cle: v.cible.cle,
        etat: sonde.etats[v.cible.cle]?.at(-1) ?? "pas-de-donnee",
        texte: `${t.services.nomCourt(v.cible.cle)} · ${derniere === null || !detail ? "pas de donnée" : valeur(derniere, detail.unite, t.services)}`,
      };
    }),
  );
  const touchee = verdicts.donnees.filter((v) =>
    v.preuves.sondes.some(
      (p) => p.pseudonyme === sonde.pseudonyme && p.statut === "touchee",
    ),
  );
  const incidentsEnCours = verdicts.donnees.filter(
    (v) => v.observation.etat === "degrade",
  );

  return (
    <main className={`${styles.page} ${styles.large}`}>
      <MentionFrancais langue={langue} />
      <div className={styles.profil} lang="fr">
        <span className={styles.avatar} aria-hidden="true">
          {sonde.pseudonyme.charAt(0).toUpperCase()}
        </span>
        <div className={styles.entete}>
          <h1>@{sonde.pseudonyme}</h1>
          <span className={styles.chapeau}>
            {sonde.ville}, {nomPays("fr", sonde.pays)} · profil public :
            pseudonyme, ville, contributions. Jamais votre compte GitHub ni
            votre adresse IP.
          </span>
        </div>
      </div>

      <div className={`${styles.section} ${styles.espace}`} lang="fr">
        <fieldset className={styles.onglets}>
          <legend className={styles.petit}>Rubrique</legend>
          <label>
            <input type="radio" name="onglet" value="sondes" defaultChecked />
            Mes sondes · 1
          </label>
          <label>
            <input type="radio" name="onglet" value="contributions" />
            Mes contributions
          </label>
          <label>
            <input type="radio" name="onglet" value="notifications" />
            Notifications · {incidentsEnCours.length}
          </label>
        </fieldset>

        <section
          data-onglet="sondes"
          className={`${styles.panneau} ${styles.cadre}`}
          aria-label="Mes sondes"
        >
          <div className={styles.titreLigne}>
            <span className={`${styles.gras} ${styles.mono}`}>
              {sonde.pseudonyme}
            </span>
            <span className={touchee.length ? styles.orange : styles.gras}>
              Active{touchee.length ? " · voit une dégradation" : ""}
            </span>
          </div>
          <span className={styles.discret}>
            Sonde développeur · {sonde.ville} ·{" "}
            {t.publication.operateur(
              nomOperateur(sonde.operateur, t.verdict.operateurInconnu),
            )}
          </span>
          <dl className={styles.chiffres}>
            <div>
              <dt>Passages sur 24 h</dt>
              <dd>
                {(Object.values(sonde.etats)[0] ?? []).filter(
                  (e) => e !== "absente",
                ).length * 6}
              </dd>
            </div>
            <div>
              <dt>Verdicts où elle compte</dt>
              <dd>{incidentsEnCours.length} en cours</dd>
            </div>
          </dl>
          <span className={styles.gras}>
            Ce que votre sonde voit en ce moment
          </span>
          <ul className={styles.puces}>
            {valeurs.map((v) => (
              <li key={v.cle} data-etat={v.etat}>
                {v.texte}
              </li>
            ))}
          </ul>
          {touchee.length > 0 && (
            <span className={styles.petit}>
              Valeurs de la dernière heure. Votre sonde est l&apos;une des
              sondes touchées par la dégradation{" "}
              {touchee.map((v) => t.services.nomCourt(v.cible.cle)).join(", ")}{" "}
              : c&apos;est grâce à elle qu&apos;une cause probable peut être
              proposée.
            </span>
          )}
          <div className={styles.actions}>
            <BoutonConnexion
              className={styles.secondaire}
              message={t.publication.connexionRequise}
            >
              Mettre en pause
            </BoutonConnexion>
            <Link
              href={lien(langue, "/contribuer/sonde")}
              className={styles.secondaire}
            >
              Ajouter une sonde
            </Link>
            <span className={styles.ressort} />
            <BoutonConnexion
              className={styles.danger}
              message={t.publication.connexionRequise}
            >
              Supprimer ses mesures
            </BoutonConnexion>
          </div>
        </section>

        <section
          data-onglet="contributions"
          className={`${styles.panneau} ${styles.cadre}`}
          aria-label="Mes contributions"
        >
          <span className={styles.discret}>
            Vos solutions, demandes et confirmations apparaîtront ici. Exemple
            de ce que publie la communauté :
          </span>
          <ul>
            {publications.donnees.slice(0, 3).map((p) => (
              <li key={p.id}>
                <Link href={lien(langue, `/echanges/${p.id}`)}>{p.titre}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          data-onglet="notifications"
          className={`${styles.panneau} ${styles.cadre}`}
          aria-label="Notifications"
        >
          <ul>
            {incidentsEnCours.map((v) => (
              <li key={v.cible.cle}>
                <Link href={lien(langue, `/services/${v.cible.cle}`)}>
                  {v.cible.nom}
                </Link>{" "}
                :{" "}
                {v.observation.depuis
                  ? t.verdict
                      .degradationDepuis(v.observation.depuis)
                      .toLowerCase()
                  : t.verdict.degradation}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className={styles.petit} lang="fr">
        Démonstration : espace d&apos;exemple, la connexion GitHub ouvrira avec
        l&apos;API des échanges.{" "}
        <Link href={lien(langue, "/confidentialite")}>
          Vos données et vos droits
        </Link>
      </p>
    </main>
  );
}
