import type { Metadata } from "next";
import { MentionFrancais } from "@/components/MentionFrancais";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";
import styles from "@/styles/page.module.css";

type Props = { params: Promise<{ langue: string }> };

export const metadata: Metadata = { title: "Contribuer" };

const SONDE =
  "https://raw.githubusercontent.com/LYNXA-TECH/yitere/main/sonde/sonde.js";

/** Page en francais seulement (decision 0002, D13). */
export default async function Contribuer({ params }: Props) {
  const langue = await langueDe(params);
  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <div lang="fr" className={styles.colonne}>
        <h1 className={styles.titre}>Héberger une sonde</h1>
        <p className={styles.intro}>
          Une sonde mesure, depuis votre connexion, le temps d&apos;accès aux
          services suivis, puis envoie le résultat. Plus il y a de sondes, plus
          les verdicts distinguent un problème d&apos;opérateur d&apos;une panne
          du service.
        </p>

        <section className={styles.encadre} aria-labelledby="ce-quelle-fait">
          <h2 id="ce-quelle-fait">
            Ce qu&apos;elle fait, et ce qu&apos;elle ne fait pas
          </h2>
          <ul>
            <li>
              Un seul fichier JavaScript, sans dépendance, lancé par Node.js.
            </li>
            <li>
              Aucun droit administrateur, aucun port ouvert, aucun de vos
              fichiers lu.
            </li>
            <li>Votre adresse IP n&apos;est pas conservée par le serveur.</li>
            <li>
              Un passage mesure les services dont c&apos;est le tour, envoie,
              puis s&apos;arrête.
            </li>
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="installer">
          <h2 id="installer">L&apos;installer</h2>
          <ol className={styles.etapes}>
            <li>
              <p>Récupérez le fichier :</p>
              <pre className={styles.code}>
                <code>curl -O {SONDE}</code>
              </pre>
            </li>
            <li>
              <p>
                Demandez un jeton à l&apos;équipe en ouvrant une demande sur{" "}
                <a href="https://github.com/LYNXA-TECH/yitere/issues">
                  le dépôt GitHub
                </a>
                . Il identifie la sonde, jamais la personne.
              </p>
            </li>
            <li>
              <p>Voyez ce que la sonde va faire, sans rien mesurer :</p>
              <pre className={styles.code}>
                <code>YITERE_JETON=votre-jeton node sonde.js --annonce</code>
              </pre>
            </li>
            <li>
              <p>
                Lancez un passage. Pour des mesures continues, programmez-le
                toutes les dix minutes (cron, ou le Planificateur de tâches sous
                Windows) :
              </p>
              <pre className={styles.code}>
                <code>YITERE_JETON=votre-jeton node sonde.js</code>
              </pre>
            </li>
          </ol>
          <p className={styles.discret}>
            Sous PowerShell :{" "}
            <code>
              $env:YITERE_JETON=&quot;votre-jeton&quot;; node sonde.js
            </code>
          </p>
        </section>

        <section className={styles.section} aria-labelledby="partager">
          <h2 id="partager">Partager ce qui a marché</h2>
          <p>
            Un contournement qui a fonctionné chez vous aide les autres
            développeurs du même opérateur. Voyez les{" "}
            <a href={lien(langue, "/echanges")}>échanges</a> et la{" "}
            <a href={lien(langue, "/methodologie")}>méthodologie</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
