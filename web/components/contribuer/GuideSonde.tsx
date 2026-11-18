import type { ReactNode } from "react";
import { BoutonCopier } from "@/components/BoutonCopier";
import styles from "./contribuer.module.css";

/*
 * Le guide de l'hote, tel que Cellou l'a ecrit (« Installer une sonde YITERE », 17 novembre) :
 * memes commandes, memes etapes. Un bloc par systeme ; les deux boutons radio choisissent
 * lequel s'affiche, en CSS seulement (.lancer:has), sans JavaScript.
 */

const SONDE =
  "https://raw.githubusercontent.com/LYNXA-TECH/yitere/main/sonde/sonde.js";

type Bloc = { avant?: ReactNode; commande: string; apres?: ReactNode };
type Etape = (Bloc & { titre: string; suite?: Bloc })[];

const LINUX: Etape = [
  {
    titre: "Télécharger la sonde et enregistrer la clé",
    commande: `mkdir -p ~/yitere && cd ~/yitere\ncurl -O ${SONDE}\necho "VOTRE-CLE" > cle && chmod 600 cle`,
    apres: (
      <>
        Le fichier <code>cle</code> n&apos;est lisible que par vous.
      </>
    ),
  },
  {
    titre: "Essayer",
    commande: `YITERE_JETON="$(cat cle)" node sonde.js --annonce\nYITERE_JETON="$(cat cle)" node sonde.js`,
    apres: (
      <>
        La première commande affiche ce que la sonde va faire, sans rien
        mesurer. La seconde fait un vrai passage et doit se terminer par une
        ligne comme <code>passage: 8 mesures, 8 posees, 0 ignorees</code>. Le
        nombre de mesures varie : certaines adresses ne sont mesurées
        qu&apos;une fois par heure.
      </>
    ),
  },
  {
    titre: "La lancer toutes les dix minutes",
    avant: "Repérez le chemin de Node :",
    commande: "which node",
    suite: {
      avant: (
        <>
          Ouvrez les tâches programmées avec <code>crontab -e</code>, puis
          ajoutez cette ligne à la fin, en remplaçant <code>/usr/bin/node</code>{" "}
          par le chemin affiché :
        </>
      ),
      commande: `*/10 * * * * cd $HOME/yitere && YITERE_JETON="$(cat cle)" /usr/bin/node sonde.js >> sonde.log 2>&1`,
      apres: (
        <>
          Enregistrez et quittez. Dix minutes plus tard,{" "}
          <code>tail ~/yitere/sonde.log</code> doit montrer une nouvelle ligne{" "}
          <code>passage:</code>.
        </>
      ),
    },
  },
];

const WINDOWS: Etape = [
  {
    titre: "Télécharger la sonde",
    avant:
      "Tout se fait dans PowerShell, sans droits administrateur : menu Démarrer, tapez « PowerShell » et lancez-le normalement.",
    commande: `mkdir $HOME\\yitere; cd $HOME\\yitere\ncurl.exe -O ${SONDE}`,
    apres: (
      <>
        Le dossier est créé dans votre dossier personnel, par exemple{" "}
        <code>C:\Users\VotreNom\yitere</code>.
      </>
    ),
  },
  {
    titre: "Essayer",
    commande: `$env:YITERE_JETON="VOTRE-CLE"\nnode sonde.js --annonce\nnode sonde.js`,
    apres: (
      <>
        La première commande <code>node</code> affiche ce que la sonde va faire,
        sans rien mesurer. La seconde fait un vrai passage et doit se terminer
        par une ligne comme{" "}
        <code>passage: 8 mesures, 8 posees, 0 ignorees</code>.
      </>
    ),
  },
  {
    titre: "Créer le fichier de lancement",
    avant: (
      <>
        Ce petit fichier contient votre clé et lance un passage. Copiez ces
        lignes telles quelles, en remplaçant seulement <code>VOTRE-CLE</code> :
      </>
    ),
    commande: `Set-Content -Path "$HOME\\yitere\\lancer.cmd" -Encoding ascii -Value @"\n@echo off\ncd /d "%USERPROFILE%\\yitere"\nset YITERE_JETON=VOTRE-CLE\nnode sonde.js >> sonde.log 2>&1\n"@`,
    apres: (
      <>
        Testez-le une fois avec{" "}
        <code>&amp; &quot;$HOME\yitere\lancer.cmd&quot;</code>, puis{" "}
        <code>Get-Content $HOME\yitere\sonde.log -Tail 3</code> : la dernière
        ligne doit commencer par <code>passage:</code>.
      </>
    ),
  },
  {
    titre: "La lancer toutes les dix minutes",
    commande: `schtasks /Create /SC MINUTE /MO 10 /TN YitereSonde /TR "$HOME\\yitere\\lancer.cmd"`,
    apres: (
      <>
        La tâche tourne tant que votre session Windows est ouverte. Une fenêtre
        noire peut apparaître une seconde toutes les dix minutes : c&apos;est la
        sonde qui passe. Si le journal reste vide alors que le test marchait,
        Windows ne trouve pas Node : tapez <code>where.exe node</code>, et
        remplacez <code>node</code> par le chemin affiché dans{" "}
        <code>lancer.cmd</code>, entre guillemets.
      </>
    ),
  },
];

const MESSAGES: [string, string, string][] = [
  [
    "YITERE_JETON manquant",
    "La clé n'est pas passée à la commande",
    "Revérifier le fichier cle (Linux) ou lancer.cmd (Windows)",
  ],
  [
    "401 ... jeton inconnu",
    "Clé mal recopiée, ou pas encore enregistrée par l'équipe",
    "Recopier la clé ; si le message reste, nous écrire",
  ],
  ["403 ... sonde desactivee", "Votre sonde a été désactivée", "Nous écrire"],
  [
    "passage echoue, puis une erreur réseau",
    "Pas de connexion à ce moment-là",
    "Rien : le passage suivant reprend seul",
  ],
];

function Commande({ bloc, titre }: { bloc: Bloc; titre: string }) {
  return (
    <>
      {bloc.avant && <p className={styles.corps}>{bloc.avant}</p>}
      <div className={styles.bloc}>
        <pre className={styles.commande}>{bloc.commande}</pre>
        <BoutonCopier
          texte={bloc.commande}
          libelle="Copier"
          libelleCopie="Copié"
          titre={`Copier la commande : ${titre}`}
          className={styles.copier}
        />
      </div>
      {bloc.apres && <p className={styles.petit}>{bloc.apres}</p>}
    </>
  );
}

function Etapes({ etapes, systeme }: { etapes: Etape; systeme: string }) {
  return (
    <ol className={styles.guide} data-systeme={systeme}>
      {etapes.map((e, i) => (
        <li key={e.titre}>
          <h3>
            <span className={styles.rang} aria-hidden="true">
              {i + 1}
            </span>
            {e.titre}
          </h3>
          <Commande bloc={e} titre={e.titre} />
          {e.suite && <Commande bloc={e.suite} titre={e.titre} />}
        </li>
      ))}
    </ol>
  );
}

/** Installer, verifier, arreter et depanner une sonde : le guide complet, sur la page. */
export function GuideSonde({ contact }: { contact: string }) {
  return (
    <section
      id="installer"
      aria-labelledby="installer-titre"
      className={`${styles.section} ${styles.lancer}`}
      lang="fr"
    >
      <h2 id="installer-titre">Installer la sonde, pas à pas</h2>
      <p className={styles.corps}>
        Il vous faut une machine allumée le plus souvent possible, Node.js 20 ou
        plus (vérifiez avec <code>node --version</code>, sinon installez la
        version LTS depuis{" "}
        <a href="https://nodejs.org" rel="noreferrer">
          nodejs.org
        </a>
        ), et votre clé. Partout ci-dessous, remplacez <code>VOTRE-CLE</code>{" "}
        par cette clé.
      </p>
      <p className={styles.legende} aria-hidden="true">
        Choisissez votre système :
      </p>
      <fieldset className={`${styles.systemes} ${styles.choix}`}>
        <legend className={styles.cache}>Votre système</legend>
        <label>
          <input type="radio" name="systeme" value="unix" defaultChecked />
          Linux, macOS
        </label>
        <label>
          <input type="radio" name="systeme" value="windows" />
          Windows
        </label>
      </fieldset>

      <Etapes etapes={LINUX} systeme="unix" />
      <Etapes etapes={WINDOWS} systeme="windows" />

      <h3 className={styles.sousTitre}>Si un message s&apos;affiche</h3>
      <div className={styles.tableau}>
        <table>
          <thead>
            <tr>
              <th scope="col">Message</th>
              <th scope="col">Cause</th>
              <th scope="col">Que faire</th>
            </tr>
          </thead>
          <tbody>
            {MESSAGES.map(([message, cause, faire]) => (
              <tr key={message}>
                <td>
                  <code>{message}</code>
                </td>
                <td>{cause}</td>
                <td>{faire}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.petit}>
        Une période sans mesure n&apos;est pas un problème : elle apparaît sur
        la carte comme un trou daté, jamais comblé. Une question : {contact}.
      </p>
    </section>
  );
}
