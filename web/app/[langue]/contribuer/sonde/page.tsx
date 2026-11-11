import type { Metadata } from "next";
import Link from "next/link";
import { BoutonConnexion } from "@/components/BoutonConnexion";
import { BoutonCopier } from "@/components/BoutonCopier";
import styles from "@/components/contribuer/contribuer.module.css";
import { MentionFrancais } from "@/components/MentionFrancais";
import { estService, lireCibles } from "@/lib/donnees";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";

type Props = { params: Promise<{ langue: string }> };

export const metadata: Metadata = { title: "Héberger une sonde" };

const SONDE =
  "https://raw.githubusercontent.com/LYNXA-TECH/yitere/main/sonde/sonde.js";

/** Les 54 pays d'Afrique, en codes ISO : la liste du formulaire se traduit seule avec Intl. */
const PAYS_AFRIQUE =
  "DZ AO BJ BW BF BI CV CM CF KM CG CD CI DJ EG ER SZ ET GA GM GH GN GW GQ KE LS LR LY MG MW ML MR MU MA MZ NA NE NG UG RW ST SN SC SL SO ZA SS SD TZ TD TG TN ZM ZW".split(
    " ",
  );

/**
 * Page en francais seulement (decision 0002, D13). Tout ce qui est dit ici de la sonde
 * se verifie dans sonde/sonde.js et dans docs/methodologie.md.
 */
export default async function HebergerSonde({ params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire("fr");
  const cibles = (await lireCibles()).donnees;
  const services = cibles.filter(estService);
  const references = cibles.length - services.length;
  const noms = new Intl.DisplayNames("fr", { type: "region" });
  const pays = PAYS_AFRIQUE.map((iso) => ({
    iso,
    nom: noms.of(iso) ?? iso,
  })).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <nav aria-label="Fil d'Ariane" className={styles.ariane} lang="fr">
        <Link href={lien(langue, "/contribuer")}>Contribuer</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Héberger une sonde</span>
      </nav>

      <div className={styles.haut} lang="fr">
        <div className={styles.entete}>
          <h1>Prêtez votre connexion à la carte</h1>
          <p className={styles.chapeau}>
            À chaque passage, la sonde mesure depuis chez vous l&apos;accès à
            GitHub, npm, PyPI, Docker et jsDelivr. Chaque mesure aide un
            développeur, ailleurs, à savoir d&apos;où vient son problème, et
            répond aux demandes de votre ville.
          </p>
          <ul className={styles.puces}>
            <li>Environ 20 Mo par jour</li>
            <li>Sans droits administrateur</li>
            <li>Aucun port ouvert</li>
            <li>Code public, un seul fichier</li>
          </ul>
        </div>
        <pre
          className={styles.terminal}
          aria-label="Ce que la sonde affiche avant de mesurer"
        >
          <span data-ton="discret">$ node sonde.js --annonce</span>
          {"\n"}YITERE-sonde 1.0{"\n"}
          <span data-ton="discret">Ce que cette sonde va faire :</span>
          {"\n"} . mesurer les adresses dont c&apos;est le tour (
          {services.length} cibles + {references} références){"\n"} .
          n&apos;ouvrir aucun port, ne lire aucun de vos fichiers{"\n"} .
          envoyer les résultats à YITERE (votre adresse IP n&apos;est pas
          conservée){"\n"}
          <span data-ton="accent">
            Un passage mesure, envoie, puis s&apos;arrête.
          </span>
        </pre>
      </div>

      <section aria-labelledby="etapes" className={styles.section} lang="fr">
        <h2 id="etapes">Quatre étapes, environ cinq minutes</h2>
        <div className={styles.grille}>
          <div className={styles.etape} data-active>
            <span className={styles.numero}>1 · à faire maintenant</span>
            <h3>Se connecter</h3>
            <p className={styles.corps}>
              Avec GitHub. La connexion sert seulement à vous attribuer une clé,
              et à retrouver vos sondes dans « Mes sondes ».
            </p>
            <BoutonConnexion
              className={styles.github}
              message={t.publication.connexionRequise}
            >
              Se connecter avec GitHub
            </BoutonConnexion>
          </div>
          <form className={styles.etape} action={lien(langue, "/moi")}>
            <span className={styles.numero}>2 · ensuite</span>
            <h3>Décrire votre sonde</h3>
            <div className={styles.champ}>
              <label htmlFor="s-pseudo">Pseudonyme affiché</label>
              <input
                id="s-pseudo"
                name="pseudonyme"
                placeholder="lynx-conakry-2"
              />
              <span className={styles.petit}>
                Jamais votre nom ni votre compte GitHub.
              </span>
            </div>
            <div className={styles.champ}>
              <label htmlFor="s-pays">Pays</label>
              <select id="s-pays" name="pays" defaultValue="GN">
                {pays.map((p) => (
                  <option key={p.iso} value={p.iso}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.champ}>
              <label htmlFor="s-ville">Ville</label>
              <input id="s-ville" name="ville" placeholder="Conakry" />
              <span className={styles.petit}>
                Jamais plus précise que la ville.
              </span>
            </div>
            <label className={styles.case}>
              <input type="checkbox" required />
              J&apos;ai lu ce que la sonde mesure, ce qui est publié et comment
              l&apos;arrêter (ci-dessous).
            </label>
            <BoutonConnexion
              className={styles.bouton}
              message={t.publication.connexionRequise}
            >
              Obtenir ma clé de sonde
            </BoutonConnexion>
          </form>
          <div className={`${styles.etape} ${styles.lancer}`}>
            <span className={styles.numero}>3 · ensuite</span>
            <h3>Lancer la commande</h3>
            <fieldset className={styles.systemes}>
              <legend className={styles.petit}>Système</legend>
              <label>
                <input
                  type="radio"
                  name="systeme"
                  value="unix"
                  defaultChecked
                />
                Linux, macOS
              </label>
              <label>
                <input type="radio" name="systeme" value="windows" />
                Windows
              </label>
            </fieldset>
            <p className={styles.petit}>
              Dans un terminal, avec Node.js installé :
            </p>
            <pre className={styles.commande} data-systeme="unix">
              {`curl -O ${SONDE}\nYITERE_JETON=votre-cle node sonde.js`}
            </pre>
            <pre className={styles.commande} data-systeme="windows">
              {`curl.exe -O ${SONDE}\n$env:YITERE_JETON="votre-cle"; node sonde.js`}
            </pre>
            <BoutonCopier
              texte={`curl -O ${SONDE}`}
              libelle="Copier le téléchargement"
              libelleCopie="Copié"
              titre="Copier la commande de téléchargement"
              className={styles.github}
            />
            <p className={styles.petit}>
              Pour des mesures continues, programmez la commande toutes les dix
              minutes (cron, ou le Planificateur de tâches sous Windows).
            </p>
          </div>
          <div className={styles.etape}>
            <span className={styles.numero}>4 · ensuite</span>
            <h3>Première mesure</h3>
            <p className={styles.corps}>
              Votre sonde apparaît sur la carte à sa première mesure, « en
              rodage » pendant 24 heures.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="exactement"
        className={styles.section}
        lang="fr"
      >
        <h2 id="exactement">Ce que fait votre sonde, exactement</h2>
        <div className={styles.grille}>
          <div className={styles.carte}>
            <h3>Ce qui est mesuré</h3>
            <p className={styles.corps}>
              Temps de résolution DNS, de connexion, de chiffrement et de
              premier octet vers {services.length} cibles et {references}{" "}
              références, plus l&apos;objet témoin de 256 Ko toutes les 3
              heures.
            </p>
          </div>
          <div className={styles.carte}>
            <h3>Ce qui est publié</h3>
            <p className={styles.corps}>
              Vos mesures, votre pseudonyme, votre pays, votre ville et votre
              opérateur (son numéro d&apos;AS), sous licence CC BY 4.0.
            </p>
          </div>
          <div className={styles.carte}>
            <h3>Ce qui n&apos;est pas conservé</h3>
            <p className={styles.corps}>
              Votre adresse IP : aucune table de la base n&apos;a de colonne
              d&apos;adresse. La sonde ne lit aucun de vos fichiers ; vous
              pouvez le vérifier dans son code.
            </p>
          </div>
          <div className={styles.carte}>
            <h3>Arrêter</h3>
            <p className={styles.corps}>
              Un passage s&apos;arrête seul. Pour arrêter la sonde, retirez la
              tâche programmée, ou <kbd>Ctrl+C</kbd> pendant un passage.
            </p>
          </div>
        </div>
        <p className={styles.petit}>
          Le détail :{" "}
          <Link href={lien(langue, "/confidentialite")}>
            politique de confidentialité
          </Link>{" "}
          · <Link href={lien(langue, "/methodologie")}>méthodologie</Link>.
        </p>
      </section>

      <section aria-labelledby="faq" className={styles.section} lang="fr">
        <h2 id="faq">Questions fréquentes</h2>
        <div className={styles.faq}>
          <div>
            <h3>Est-ce que ça ralentit ma connexion ?</h3>
            <p>
              Très peu : les requêtes sont petites et espacées de 10 minutes, et
              le débit n&apos;est jamais mesuré à saturation.
            </p>
          </div>
          <div>
            <h3>Et sur des données mobiles ?</h3>
            <p>
              Environ 20 Mo par jour en mode économe, soit environ 600 Mo par
              mois si elle tourne en continu.
            </p>
          </div>
          <div>
            <h3>Quand mesure-t-elle ?</h3>
            <p>
              À chaque lancement : elle mesure les cibles dont c&apos;est le
              tour, envoie, puis s&apos;arrête.
            </p>
          </div>
          <div>
            <h3>
              Pourquoi ma sonde n&apos;entre pas tout de suite dans les verdicts
              ?
            </h3>
            <p>
              Il faut 24 heures de mesures pour connaître ses valeurs
              habituelles. Avant, elle apparaît « en rodage » sur la carte.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
