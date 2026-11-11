import type { Metadata } from "next";
import { MentionFrancais } from "@/components/MentionFrancais";
import { langueDe } from "@/lib/i18n/params";
import styles from "@/styles/document.module.css";

type Props = { params: Promise<{ langue: string }> };

export const metadata: Metadata = { title: "Données ouvertes" };

/** Les colonnes de la table measurements (db/schema.sql), telles qu'un export les donnera. */
const COLONNES = [
  ["mesure_le", "Heure posée par le serveur, en UTC"],
  ["sonde, type", "Pseudonyme et type de la sonde"],
  ["pays, ville, asn", "Lieu et opérateur, jamais l'adresse IP"],
  ["cible", "Clé de la cible mesurée (db/seed.sql)"],
  ["dns_ms, tcp_ms, tls_ms", "Étapes, en millisecondes"],
  ["ttfb_ms", "Premier octet, hors étapes précédentes"],
  ["octets, duree_ms", "Taille reçue ; durée totale"],
  ["debit_bps", "Débit estimé, objet témoin seulement"],
  ["code_http, erreur", "Code reçu et type d'erreur éventuel"],
] as const;

/** En service : servie aujourd'hui par serveur/api.js. Prevue : proposee dans docs/CONTRAT-API-INTERFACE.md. */
const ROUTES = [
  {
    route: "/api/v1/cibles",
    contenu: "Les cibles mesurées, leur cadence et leur code attendu",
    enService: true,
  },
  {
    route: "/api/v1/verdicts",
    contenu: "Verdicts en cours : observation, hypothèse, preuves",
    enService: false,
  },
  {
    route: "/api/v1/sondes",
    contenu: "Sondes actives : pseudonyme, type, pays, ville, opérateur",
    enService: false,
  },
  {
    route: "/api/v1/publications?cible=…",
    contenu: "Solutions et demandes publiques, avec leur contexte mesuré",
    enService: false,
  },
];

const EXEMPLE = `{
  "calcule_le": "2026-11-03T17:00:00Z",
  "verdicts": [{
    "cle": "npm",
    "nom": "registry.npmjs.org",
    "etat": "degrade",
    "depuis": "2026-11-03T14:10:00Z",
    "hypothese": { "cause": "operateur", "operateur": "Opérateur A", "ville": "Conakry" },
    "preuves": {
      "sondes_touchees": 2,
      "sondes_epargnees": 2,
      "sondes_en_rodage": 1,
      "mesures": 24,
      "periode_minutes": 60,
      "repere": "normal"
    }
  }]
}`;

/** Page en francais seulement (decision 0002, D13). */
export default async function Donnees({ params }: Props) {
  const langue = await langueDe(params);
  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <div className={styles.entete} lang="fr">
        <h1>Données ouvertes</h1>
        <p className={styles.chapeau}>
          Toutes les mesures, pour tout le monde : chercheurs, journalistes,
          opérateurs, développeurs. Réutilisables librement, en citant la
          source.
        </p>
      </div>

      <div className={styles.grille} lang="fr">
        <div className={styles.cadre}>
          <span className={styles.petit}>Licence</span>
          <span className={styles.gras}>CC BY 4.0</span>
          <span className={styles.discret}>
            Réutilisation libre, y compris commerciale, avec attribution.
          </span>
        </div>
        <div className={styles.cadre}>
          <span className={styles.petit}>Citer la source</span>
          <span className={styles.mono}>
            « YITERE, équipe LYNXA, données extraites le JJ/MM/AAAA, CC BY 4.0 »
          </span>
        </div>
        <div className={styles.cadre}>
          <span className={styles.petit}>Ce qui n&apos;est jamais publié</span>
          <span className={styles.discret}>
            Adresses IP, comptes GitHub des hôtes de sonde. Seuls le pseudonyme,
            la ville et le numéro d&apos;AS de l&apos;opérateur apparaissent.
          </span>
        </div>
      </div>

      <section className={styles.cadre} aria-labelledby="export" lang="fr">
        <div className={styles.titreLigne}>
          <h2 id="export">Télécharger un export</h2>
          <span className={styles.statut}>Prévu · statut à confirmer</span>
        </div>
        <div className={styles.ligne}>
          <div className={styles.champ}>
            <label htmlFor="d-type">Type de sonde</label>
            <select id="d-type" disabled>
              <option>Développeur</option>
            </select>
          </div>
          <div className={styles.champ}>
            <label htmlFor="d-niveau">Niveau de détail</label>
            <select id="d-niveau" disabled>
              <option>Mesures brutes</option>
            </select>
          </div>
          <div className={styles.champ}>
            <label htmlFor="d-format">Format</label>
            <select id="d-format" disabled>
              <option>CSV</option>
            </select>
          </div>
        </div>
        <span className={styles.petit}>
          Un export porte sur un seul type de sonde : les trois types ne sont
          jamais mélangés, même dans les fichiers.
        </span>
      </section>

      <section className={styles.section} aria-labelledby="colonnes" lang="fr">
        <h2 id="colonnes">Les colonnes du fichier</h2>
        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th scope="col">Colonne</th>
                <th scope="col">Contenu</th>
              </tr>
            </thead>
            <tbody>
              {COLONNES.map(([colonne, contenu]) => (
                <tr key={colonne}>
                  <th scope="row" className={styles.mono}>
                    {colonne}
                  </th>
                  <td>{contenu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="api" lang="fr">
        <h2 id="api">L&apos;API de lecture</h2>
        <p>
          Publique, sans clé, en lecture seule, réponses en JSON. Le statut de
          chaque point d&apos;accès est affiché.
        </p>
        {ROUTES.map((r) => (
          <div key={r.route} className={styles.route}>
            <span>
              <span className={styles.methode}>GET</span>{" "}
              <span className={styles.mono}>{r.route}</span>
            </span>
            <span>{r.contenu}</span>
            <span
              className={styles.statut}
              data-statut={r.enService ? "en-service" : "prevu"}
            >
              {r.enService ? "En service" : "Prévu"}
            </span>
          </div>
        ))}
        <span className={styles.petit}>
          Exemple de réponse · /api/v1/verdicts (valeurs d&apos;exemple)
        </span>
        <pre className={styles.code}>{EXEMPLE}</pre>
      </section>
    </main>
  );
}
