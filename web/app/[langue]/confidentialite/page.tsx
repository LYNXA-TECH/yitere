import type { Metadata } from "next";
import Link from "next/link";
import { MentionFrancais } from "@/components/MentionFrancais";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";
import styles from "@/styles/document.module.css";

/** La meme adresse que la page Heberger une sonde : l'equipe y lit les demandes. */
const CONTACT = "kantecellou70@gmail.com";

type Props = { params: Promise<{ langue: string }> };

export const metadata: Metadata = { title: "Confidentialité" };

/**
 * La politique de confidentialite, avec les reponses validees par l'equipe le
 * 18 novembre (plus aucun passage entre crochets). Page en francais seulement
 * (decision 0002, D13).
 */
export default async function Confidentialite({ params }: Props) {
  const langue = await langueDe(params);
  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <div className={styles.entete} lang="fr">
        <span className={styles.surtitre}>Politique de confidentialité</span>
        <h1>Vos données, et ce que vous pouvez en faire</h1>
        <p className={styles.chapeau}>
          Ce que YITERE collecte, pourquoi, combien de temps, et vos droits.
          Dernière mise à jour : 21 novembre 2026.
        </p>
      </div>

      <section className={styles.section} lang="fr">
        <h2>Qui est responsable</h2>
        <p>
          YITERE est conçu par l&apos;équipe LYNXA. Responsable des données :
          LYNXA SARL. Contact : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </section>

      <section className={styles.section} lang="fr">
        <h2>Ce que nous collectons, et pourquoi</h2>
        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th scope="col">Quand</th>
                <th scope="col">Données</th>
                <th scope="col">Pourquoi</th>
                <th scope="col">Combien de temps</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Vous visitez le site</th>
                <td>
                  Le journal d&apos;accès du serveur web ne garde aucune adresse
                  IP. Son journal d&apos;erreurs technique peut en contenir une,
                  quand une requête échoue.
                </td>
                <td>Diagnostiquer une panne du site</td>
                <td>14 jours</td>
              </tr>
              <tr>
                <th scope="row">Vous hébergez une sonde</th>
                <td>
                  Durées mesurées, pseudonyme, pays, ville, numéro d&apos;AS de
                  l&apos;opérateur. Aucune adresse IP n&apos;est stockée.
                </td>
                <td>Publier les mesures et calculer les verdicts</td>
                <td>
                  Mesures brutes : 90 jours. Médianes horaires : sans limite.
                </td>
              </tr>
              <tr>
                <th scope="row">Vous mesurez depuis le navigateur</th>
                <td>Rien : le résultat reste sur votre écran.</td>
                <td>Vous comparer aux sondes</td>
                <td>Aucune conservation</td>
              </tr>
              <tr>
                <th scope="row">Vous vous connectez</th>
                <td>
                  Votre identifiant GitHub et son numéro, rien d&apos;autre :
                  jamais le jeton de GitHub (il sert une fois, puis il est
                  oublié), ni votre adresse e-mail. Un cookie de session.
                </td>
                <td>
                  Publier sous votre nom, dire qu&apos;une solution a marché,
                  voir vos sondes
                </td>
                <td>
                  Cookie de session : 30 jours. Identifiant : tant que vos
                  publications existent
                </td>
              </tr>
              <tr>
                <th scope="row">Vous publiez ou confirmez</th>
                <td>Texte, ville, opérateur, heure, contexte mesuré joint</td>
                <td>L&apos;entraide : savoir où une solution a marché</td>
                <td>Tant que la publication existe</td>
              </tr>
              <tr>
                <th scope="row">Vous publiez sans compte</th>
                <td>
                  Le pseudonyme que vous choisissez, le texte, la commande si
                  vous en donnez une, le pays s&apos;il est donné, l&apos;heure.
                  Toujours aucune adresse IP.
                </td>
                <td>
                  Relire la publication, puis l&apos;afficher dans les échanges
                </td>
                <td>Tant que la publication existe</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Nous ne lisons aucun fichier de votre ordinateur, ne déposons aucun
          cookie publicitaire et ne vendons aucune donnée. Le seul cookie est
          celui de la session, après connexion à GitHub, pour 30 jours.
        </p>
      </section>

      <section className={styles.section} lang="fr">
        <h2>Ce qui est public</h2>
        <p>
          Les mesures, avec pseudonyme, ville et opérateur, sont publiques sous
          licence CC BY 4.0, comme les publications et les confirmations. Votre
          compte GitHub et votre adresse IP ne le sont jamais.
        </p>
        <p>
          Une sonde chez vous qui mesure toutes les 10 minutes peut indiquer
          quand votre ordinateur est allumé. Aucune mesure brute n&apos;est
          publiée à ce jour : seuls les verdicts et les médianes horaires le
          sont. Si un export des mesures brutes ouvre, l&apos;heure de chaque
          mesure y sera arrondie à 10 minutes.
        </p>
      </section>

      <section className={styles.section} lang="fr">
        <h2>Où sont les données</h2>
        <p>
          Dans une base PostgreSQL installée sur notre serveur Datacloud
          (Systalink) à Madrid, en Espagne : notre hébergeur ne propose pas de
          région en Afrique à ce jour.
        </p>
      </section>

      <section className={styles.section} lang="fr">
        <h2>Vos droits</h2>
        <ul>
          <li>
            Arrêter une sonde à tout moment : retirez la tâche programmée (les
            commandes sont dans{" "}
            <Link href={lien(langue, "/contribuer/sonde")}>
              Héberger une sonde
            </Link>
            ), puis écrivez à <a href={`mailto:${CONTACT}`}>{CONTACT}</a> : nous
            désactivons sa clé.
          </li>
          <li>
            Supprimer toutes les mesures d&apos;une sonde : écrivez à{" "}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. Les médianes horaires
            déjà publiées sont conservées.
          </li>
          <li>
            Supprimer une publication déposée sans compte : écrivez à{" "}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a> en citant son texte.
          </li>
          <li>
            Demander une copie ou la suppression de votre compte : écrivez à{" "}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </li>
        </ul>
      </section>
    </main>
  );
}
