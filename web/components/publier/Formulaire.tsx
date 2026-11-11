"use client";

import { useState } from "react";
import styles from "./publier.module.css";

export type ServicePublier = {
  cle: string;
  nom: string;
  /** Le contexte qui sera joint, deja redige : « A 17:00 : degradation depuis 14:10 · ... ». */
  contexte: string | null;
  /** Le meme contexte, en court, pour l'apercu. */
  apercu: string | null;
};

type Props = {
  services: ServicePublier[];
  technologies: string[];
  typeInitial: "solution" | "demande";
  messageConnexion: string;
};

/**
 * Le formulaire de publication et son apercu en direct. L'envoi demande la connexion GitHub,
 * qui ouvrira avec l'API des echanges. Page en francais seulement (decision 0002, D13).
 */
export function Formulaire({
  services,
  technologies,
  typeInitial,
  messageConnexion,
}: Props) {
  const [type, setType] = useState(typeInitial);
  const [cle, setCle] = useState(services[0]?.cle ?? "");
  const [joindre, setJoindre] = useState(true);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [commande, setCommande] = useState("");
  const [choisies, setChoisies] = useState<string[]>([]);
  const [tente, setTente] = useState(false);
  const service = services.find((s) => s.cle === cle);
  const solution = type === "solution";

  return (
    <div className={styles.colonnes}>
      <form
        className={styles.formulaire}
        onSubmit={(e) => {
          e.preventDefault();
          setTente(true);
        }}
      >
        <fieldset className={styles.types}>
          <legend>Que voulez-vous publier ?</legend>
          <label data-actif={solution || undefined}>
            <input
              type="radio"
              name="type"
              checked={solution}
              onChange={() => setType("solution")}
            />
            <span className={styles.gras}>Une solution</span>
            <span className={styles.discret}>
              Un miroir, un réglage, une heure qui marche
            </span>
          </label>
          <label data-actif={!solution || undefined}>
            <input
              type="radio"
              name="type"
              checked={!solution}
              onChange={() => setType("demande")}
            />
            <span className={styles.gras}>Une demande de mesure</span>
            <span className={styles.discret}>
              « Ce service est-il lent depuis telle ville ? »
            </span>
          </label>
        </fieldset>

        <div className={styles.champ}>
          <label htmlFor="p-service">Service concerné</label>
          <select
            id="p-service"
            value={cle}
            onChange={(e) => setCle(e.target.value)}
            className={styles.mono}
          >
            {services.map((s) => (
              <option key={s.cle} value={s.cle}>
                {s.nom}
              </option>
            ))}
          </select>
        </div>

        {service?.contexte && (
          <label className={styles.contexte}>
            <span className={styles.ligneCase}>
              <input
                type="checkbox"
                checked={joindre}
                onChange={(e) => setJoindre(e.target.checked)}
              />
              <span className={styles.gras}>Joindre le contexte mesuré</span>
            </span>
            <span className={styles.texteContexte}>{service.contexte}</span>
            <span className={styles.petit}>
              Recommandé : c&apos;est ce qui permet aux autres de savoir si
              votre solution s&apos;applique à leur cas.
            </span>
          </label>
        )}

        <div className={styles.champ}>
          <label htmlFor="p-titre">
            {solution ? "Titre de la solution" : "Votre question"}
          </label>
          <input
            id="p-titre"
            value={titre}
            maxLength={90}
            onChange={(e) => setTitre(e.target.value)}
          />
          <span className={styles.petit}>
            {solution
              ? "Ex. : « Allonger le délai de nouvelle tentative de npm »"
              : "Ex. : « npm est-il lent depuis Dakar en ce moment ? »"}{" "}
            · 90 caractères au plus
          </span>
        </div>

        {solution && (
          <>
            <div className={styles.champ}>
              <label htmlFor="p-contenu">
                Ce qui a marché, et dans quel contexte
              </label>
              <textarea
                id="p-contenu"
                rows={5}
                value={contenu}
                maxLength={600}
                onChange={(e) => setContenu(e.target.value)}
              />
              <span className={styles.aide}>
                <span>
                  Ce que vous avez fait, sur quelle connexion, et ce que ça a
                  changé.
                </span>
                <span className={styles.mono}>{contenu.length} / 600</span>
              </span>
            </div>
            <div className={styles.champ}>
              <label htmlFor="p-commande">
                Commande ou réglage{" "}
                <span className={styles.discret}>(facultatif)</span>
              </label>
              <input
                id="p-commande"
                value={commande}
                onChange={(e) => setCommande(e.target.value)}
                className={styles.mono}
              />
            </div>
          </>
        )}

        <fieldset className={styles.technologies}>
          <legend>Technologies</legend>
          {technologies.map((x) => (
            <label key={x} data-actif={choisies.includes(x) || undefined}>
              <input
                type="checkbox"
                checked={choisies.includes(x)}
                onChange={(e) =>
                  setChoisies((c) =>
                    e.target.checked ? [...c, x] : c.filter((y) => y !== x),
                  )
                }
              />
              {x}
            </label>
          ))}
        </fieldset>

        <div className={styles.envoi}>
          <button type="submit" className={styles.bouton}>
            Publier
          </button>
          <span className={styles.petit}>
            Sous votre pseudonyme GitHub · 5 publications par heure au plus
            (valeur provisoire).
          </span>
          {tente && (
            <span role="status" className="message-connexion">
              {messageConnexion}
            </span>
          )}
        </div>
      </form>

      <aside className={styles.cote}>
        <span className={styles.surtitre}>Aperçu</span>
        <div className={styles.apercu}>
          <span className={styles.badges}>
            <span className={styles.genre} data-type={type}>
              {solution ? "Solution" : "Demande de mesure"}
            </span>
            <span className={styles.mono}>{service?.nom}</span>
          </span>
          <span className={styles.titreApercu}>
            {titre || (solution ? "Titre de votre solution" : "Votre question")}
          </span>
          {contenu && <span className={styles.corps}>{contenu}</span>}
          {commande && <code className={styles.commande}>{commande}</code>}
          {joindre && service?.apercu && (
            <span className={styles.contexteApercu}>{service.apercu}</span>
          )}
          <span className={styles.petit}>@vous · à l&apos;instant</span>
        </div>
        <div className={styles.avant}>
          <span className={styles.gras}>Avant de publier</span>
          <span>
            Une solution que d&apos;autres peuvent essayer, pas une plainte.
          </span>
          <span>
            Pas de publicité, pas d&apos;accusation sans mesure à l&apos;appui.
          </span>
          <span>
            Après 3 signalements, une publication est masquée en attendant
            l&apos;équipe.
          </span>
        </div>
      </aside>
    </div>
  );
}
