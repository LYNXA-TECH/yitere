import type { Metadata } from "next";
import Link from "next/link";
import { MentionFrancais } from "@/components/MentionFrancais";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";
import styles from "@/styles/document.module.css";

type Props = { params: Promise<{ langue: string }> };

export const metadata: Metadata = { title: "Confidentialité" };

/**
 * Brouillon, comme dans la maquette : les passages en orange attendent une decision
 * de l'equipe et restent visibles expres. Page en francais seulement (decision 0002, D13).
 */
export default async function Confidentialite({ params }: Props) {
  const langue = await langueDe(params);
  const A = ({ children }: { children: React.ReactNode }) => (
    <span className={styles.aFaire}>{children}</span>
  );
  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <div className={styles.entete} lang="fr">
        <span className={styles.surtitre}>
          Politique de confidentialité · brouillon
        </span>
        <h1>Vos données, et ce que vous pouvez en faire</h1>
        <p className={styles.chapeau}>
          Les passages en orange sont à compléter par l&apos;équipe avant la
          mise en ligne. Ils sont laissés visibles exprès : cette politique
          n&apos;est pas encore définitive.
        </p>
      </div>

      <section className={styles.section} lang="fr">
        <h2>Qui est responsable</h2>
        <p>
          YITERE est conçu par l&apos;équipe LYNXA. Responsable des données :{" "}
          <A>[nom de la personne ou de l&apos;entité]</A>. Contact :{" "}
          <A>[adresse e-mail dédiée]</A>.
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
                <td>
                  <A>[durée à confirmer]</A>
                </td>
              </tr>
              <tr>
                <th scope="row">Vous hébergez une sonde</th>
                <td>
                  Durées mesurées, pseudonyme, pays, ville, numéro d&apos;AS de
                  l&apos;opérateur. Aucune adresse IP n&apos;est stockée.
                </td>
                <td>Publier les mesures et calculer les verdicts</td>
                <td>
                  <A>[durées à décider]</A>
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
                <td>Identifiant GitHub, pseudonyme public</td>
                <td>Publier, confirmer, voter, suivre, gérer vos sondes</td>
                <td>Tant que le compte existe</td>
              </tr>
              <tr>
                <th scope="row">Vous publiez ou confirmez</th>
                <td>Texte, ville, opérateur, heure, contexte mesuré joint</td>
                <td>L&apos;entraide : savoir où une solution a marché</td>
                <td>Tant que la publication existe</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Nous ne lisons aucun fichier de votre ordinateur, ne déposons aucun
          cookie publicitaire et ne vendons aucune donnée. Cookies techniques :{" "}
          <A>[à confirmer : cookie de session après connexion]</A>.
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
          quand votre ordinateur est allumé.{" "}
          <A>
            [À décider : arrondir l&apos;heure des mesures brutes publiées, ou
            ne publier que les médianes horaires pour les sondes à domicile.]
          </A>
        </p>
      </section>

      <section className={styles.section} lang="fr">
        <h2>Où sont les données</h2>
        <p>
          Dans une base PostgreSQL hébergée par Supabase,{" "}
          <A>[région du projet, à confirmer par Cellou]</A>, et sur notre
          serveur Datacloud (Systalink) à Madrid, en Espagne : notre hébergeur
          ne propose pas de région en Afrique à ce jour.{" "}
          <A>
            [À vérifier : obligations liées au transfert de données hors du pays
            de l&apos;hôte.]
          </A>
        </p>
      </section>

      <section className={styles.section} lang="fr">
        <h2>Vos droits</h2>
        <ul>
          <li>
            Arrêter une sonde à tout moment : retirer la tâche programmée, ou «
            Mettre en pause » dans{" "}
            <Link href={lien(langue, "/moi")}>Mes sondes</Link>.
          </li>
          <li>
            Supprimer toutes les mesures d&apos;une sonde depuis Mes sondes.{" "}
            <A>[À décider : sort des médianes déjà publiées.]</A>
          </li>
          <li>
            Supprimer une publication ou une confirmation, depuis Mes
            contributions.
          </li>
          <li>
            Demander une copie ou la suppression de votre compte :{" "}
            <A>[adresse de contact]</A>.
          </li>
        </ul>
      </section>
    </main>
  );
}
