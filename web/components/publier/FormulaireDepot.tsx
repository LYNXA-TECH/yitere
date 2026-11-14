"use client";

import { useEffect, useRef, useState } from "react";
import {
  deposer,
  type ChampDepot,
  type Depot,
  type ResultatDepot,
} from "@/lib/donnees/depot";
import styles from "./publier.module.css";

type Props = {
  services: { cle: string; nom: string }[];
  /** Pays proposes, deja nommes en francais et tries : [code ISO, nom]. */
  pays: [string, string][];
};

const VIDE: Depot = {
  service: "",
  type: "contournement",
  texte: "",
  commande: "",
  pays: "",
  pseudonyme: "",
  site: "",
};

const MESSAGES = {
  recu: "Merci, votre publication sera visible après relecture par l'équipe.",
  trop: "Trop d'envois depuis votre connexion pour l'instant : réessayez plus tard.",
  indisponible:
    "L'enregistrement des publications est momentanément indisponible : réessayez plus tard.",
  echec:
    "L'envoi n'a pas abouti. Vérifiez votre connexion, puis réessayez : rien n'a été perdu.",
  invalide: "La publication n'a pas pu être enregistrée.",
} as const;

/**
 * Deposer une publication sans connexion GitHub. Rien ne s'affiche avant relecture par
 * l'equipe : apres l'envoi, on remercie, on n'ajoute rien a la liste.
 * Page en francais seulement (decision 0002, D13).
 */
export function FormulaireDepot({ services, pays }: Props) {
  const [d, setD] = useState<Depot>({
    ...VIDE,
    service: services[0]?.cle ?? "",
  });
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<ResultatDepot | null>(null);
  const champs = useRef<Partial<Record<ChampDepot, HTMLElement | null>>>({});
  const solution = d.type === "contournement";

  // Depuis une fiche ou depuis Echanges : /publier?service=npm&type=demande
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const service = q.get("service");
    const type = q.get("type");
    setD((x) => ({
      ...x,
      service: services.some((s) => s.cle === service) ? service! : x.service,
      type:
        type === "demande"
          ? "demande"
          : type === "contournement"
            ? "contournement"
            : x.type,
    }));
  }, [services]);

  const changer =
    <K extends keyof Depot>(k: K) =>
    (v: Depot[K]) => {
      setD((x) => ({ ...x, [k]: v }));
      // Corriger le champ en erreur efface l'erreur ; un nouveau texte efface le merci.
      if (resultat?.etat === "invalide" || resultat?.etat === "recu")
        setResultat(null);
    };

  const erreurDe = (c: ChampDepot) =>
    resultat?.etat === "invalide" && resultat.champ === c
      ? resultat.erreur || MESSAGES.invalide
      : null;

  const aria = (c: ChampDepot) => {
    const e = erreurDe(c);
    return e
      ? {
          "aria-invalid": true as const,
          "aria-describedby": `depot-erreur-${c}`,
        }
      : {};
  };

  const Erreur = ({ c }: { c: ChampDepot }) => {
    const e = erreurDe(c);
    return e ? (
      <span id={`depot-erreur-${c}`} className={styles.erreur}>
        {e}
      </span>
    ) : null;
  };

  const envoyer = async () => {
    setEnvoi(true);
    setResultat(null);
    const r = await deposer(d);
    setEnvoi(false);
    setResultat(r);
    if (r.etat === "recu") setD((x) => ({ ...x, texte: "", commande: "" }));
    if (r.etat === "invalide" && r.champ) champs.current[r.champ]?.focus();
  };

  const general =
    resultat === null
      ? null
      : resultat.etat === "recu"
        ? { texte: MESSAGES.recu, genre: "recu" }
        : resultat.etat === "plus-tard"
          ? { texte: MESSAGES[resultat.raison], genre: "erreur" }
          : resultat.etat === "echec"
            ? { texte: MESSAGES.echec, genre: "erreur" }
            : resultat.champ === null
              ? { texte: resultat.erreur || MESSAGES.invalide, genre: "erreur" }
              : null;

  return (
    <form
      className={styles.formulaire}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!envoi) void envoyer();
      }}
    >
      <fieldset className={styles.types}>
        <legend>Que voulez-vous publier ?</legend>
        <label data-actif={solution || undefined}>
          <input
            type="radio"
            name="type"
            checked={solution}
            onChange={() => changer("type")("contournement")}
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
            onChange={() => changer("type")("demande")}
          />
          <span className={styles.gras}>Une demande de mesure</span>
          <span className={styles.discret}>
            « Ce service est-il lent depuis telle ville ? »
          </span>
        </label>
      </fieldset>
      <Erreur c="type" />

      <div className={styles.champ}>
        <label htmlFor="depot-service">Service concerné</label>
        <select
          id="depot-service"
          ref={(e) => {
            champs.current.service = e;
          }}
          value={d.service}
          onChange={(e) => changer("service")(e.target.value)}
          className={styles.mono}
          {...aria("service")}
        >
          {services.map((s) => (
            <option key={s.cle} value={s.cle}>
              {s.nom}
            </option>
          ))}
        </select>
        <Erreur c="service" />
      </div>

      <div className={styles.champ}>
        <label htmlFor="depot-texte">
          {solution
            ? "Ce qui a marché, et dans quel contexte"
            : "Votre question"}
        </label>
        <textarea
          id="depot-texte"
          ref={(e) => {
            champs.current.texte = e;
          }}
          rows={5}
          value={d.texte}
          onChange={(e) => changer("texte")(e.target.value)}
          {...aria("texte")}
        />
        <span className={styles.aide}>
          <span>
            {solution
              ? "Ce que vous avez fait, sur quelle connexion, et ce que ça a changé."
              : "Ex. : « npm est-il lent depuis Dakar en ce moment ? »"}
          </span>
          <span className={styles.mono}>{d.texte.length}</span>
        </span>
        <Erreur c="texte" />
      </div>

      {solution && (
        <div className={styles.champ}>
          <label htmlFor="depot-commande">
            Commande ou réglage{" "}
            <span className={styles.discret}>(facultatif)</span>
          </label>
          <input
            id="depot-commande"
            ref={(e) => {
              champs.current.commande = e;
            }}
            value={d.commande}
            onChange={(e) => changer("commande")(e.target.value)}
            className={styles.mono}
            autoComplete="off"
            spellCheck={false}
            {...aria("commande")}
          />
          <Erreur c="commande" />
        </div>
      )}

      <div className={styles.champ}>
        <label htmlFor="depot-pays">
          Pays <span className={styles.discret}>(facultatif)</span>
        </label>
        <select
          id="depot-pays"
          ref={(e) => {
            champs.current.pays = e;
          }}
          value={d.pays}
          onChange={(e) => changer("pays")(e.target.value)}
          {...aria("pays")}
        >
          <option value="">Ne pas préciser</option>
          {pays.map(([iso, nom]) => (
            <option key={iso} value={iso}>
              {nom}
            </option>
          ))}
        </select>
        <Erreur c="pays" />
      </div>

      <div className={styles.champ}>
        <label htmlFor="depot-pseudonyme">Pseudonyme</label>
        <input
          id="depot-pseudonyme"
          ref={(e) => {
            champs.current.pseudonyme = e;
          }}
          value={d.pseudonyme}
          onChange={(e) => changer("pseudonyme")(e.target.value)}
          autoComplete="nickname"
          {...aria("pseudonyme")}
        />
        <span className={styles.petit}>
          Affiché tel quel, sans « @ » : il n&apos;est relié à aucun compte. Pas
          votre nom complet.
        </span>
        <Erreur c="pseudonyme" />
      </div>

      {/* Piege a robots : invisible et hors du parcours au clavier ; un humain le laisse vide. */}
      <div className={styles.piege} aria-hidden="true">
        <label htmlFor="depot-site">Site web</label>
        <input
          id="depot-site"
          name="site"
          tabIndex={-1}
          autoComplete="off"
          value={d.site}
          onChange={(e) => changer("site")(e.target.value)}
        />
      </div>

      <div className={styles.envoi}>
        <button type="submit" className={styles.bouton} disabled={envoi}>
          {envoi ? "Envoi…" : "Envoyer pour relecture"}
        </button>
        <span className={styles.petit}>
          Relue par l&apos;équipe avant d&apos;apparaître. Aucune adresse IP
          n&apos;est enregistrée.
        </span>
      </div>
      <p role="status" className={styles.resultat} data-genre={general?.genre}>
        {general?.texte}
      </p>
    </form>
  );
}
