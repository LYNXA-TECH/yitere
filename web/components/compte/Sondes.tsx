"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { BoutonCopier } from "@/components/BoutonCopier";
import { ecrire, type Moi } from "@/lib/compte";
import styles from "@/styles/document.module.css";
import petits from "./compte.module.css";

type Demande = NonNullable<Moi["demandes"]>[number];

const STATUT_DEMANDE: Record<Demande["statut"], string> = {
  "en-attente": "En attente : l'équipe la regarde",
  acceptee: "Acceptée : votre sonde est ci-dessus",
  refusee: "Refusée : écrivez-nous pour en savoir plus",
};

/** Les refus du serveur (serveur/demandes.js, valider), dits en francais. */
const ERREURS_CHAMP: Record<string, string> = {
  pays: "Choisissez votre pays.",
  ville: "Ville : des lettres, espaces, apostrophes ou tirets seulement.",
  operateur: "Indiquez votre opérateur (2 à 60 caractères).",
};

const date = (iso: string) =>
  new Intl.DateTimeFormat("fr", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso)) + " UTC";

/**
 * Mes sondes, dans Mon espace (contrat, section 6) : demander une sonde
 * (POST /api/v1/moi/demandes, sans adresse e-mail), puis, une fois la demande acceptee
 * par l'equipe, generer sa cle (POST /api/v1/moi/sondes/{pseudonyme}/cle). La cle
 * s'affiche une seule fois : YITERE ne la garde pas.
 */
export function MesSondes({
  moi,
  pays,
  guide,
}: {
  moi: Moi;
  pays: [string, string][];
  guide: string;
}) {
  const [demandes, setDemandes] = useState<Demande[]>(moi.demandes ?? []);
  const [generees, setGenerees] = useState<Set<string>>(
    new Set(moi.sondes.filter((s) => s.cle_generee).map((s) => s.pseudonyme)),
  );
  const [cle, setCle] = useState<{ pseudonyme: string; cle: string } | null>(
    null,
  );
  const [aRegenerer, setARegenerer] = useState<string | null>(null);
  const [erreurCle, setErreurCle] = useState("");

  const enAttente = demandes.some((d) => d.statut === "en-attente");

  async function generer(pseudonyme: string) {
    setErreurCle("");
    setARegenerer(null);
    const r = await ecrire(`/api/v1/moi/sondes/${pseudonyme}/cle`);
    if (r.statut === 200 && typeof r.corps.cle === "string") {
      setCle({ pseudonyme, cle: r.corps.cle });
      setGenerees((g) => new Set(g).add(pseudonyme));
    } else if (r.statut === 401) window.location.reload();
    else
      setErreurCle(
        "La clé n'a pas pu être générée : réessayez dans un instant.",
      );
  }

  return (
    <section className={styles.section} aria-labelledby="mes-sondes" lang="fr">
      <h2 id="mes-sondes">Mes sondes · {moi.sondes.length}</h2>
      {moi.sondes.length === 0 && (
        <p className={styles.discret}>
          Aucune sonde liée à votre compte. Vous hébergez déjà une sonde ?
          L&apos;équipe la relie à votre identifiant GitHub. Sinon, demandez-en
          une ci-dessous.
        </p>
      )}
      {moi.sondes.map((s) => {
        const generee = generees.has(s.pseudonyme);
        return (
          <div key={s.pseudonyme} className={styles.cadre}>
            <div className={styles.titreLigne}>
              <span className={`${styles.gras} ${styles.mono}`}>
                {s.pseudonyme}
              </span>
              <span className={s.active ? styles.gras : styles.discret}>
                {s.active ? "Active" : "Désactivée"}
              </span>
            </div>
            <span className={styles.discret}>
              {[s.ville, s.pays, s.asn ? `AS${s.asn}` : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <dl className={styles.chiffres}>
              <div>
                <dt>Mesures sur 24 h</dt>
                <dd>{s.mesures_24h}</dd>
              </div>
              <div>
                <dt>Dernier passage</dt>
                <dd>{s.vue_le ? date(s.vue_le) : "jamais"}</dd>
              </div>
            </dl>

            {cle?.pseudonyme === s.pseudonyme ? (
              <div className={petits.cle} role="status">
                <span className={styles.gras}>
                  Notez-la maintenant : elle ne sera plus jamais affichée. La
                  régénérer désactive l&apos;ancienne.
                </span>
                <div className={petits.ligneCle}>
                  <code className={styles.mono}>{cle.cle}</code>
                  <BoutonCopier
                    texte={cle.cle}
                    libelle="Copier"
                    libelleCopie="Copiée"
                    titre="Copier la clé"
                  />
                </div>
                <Link href={guide}>Installer la sonde avec cette clé</Link>
              </div>
            ) : !generee ? (
              <p>
                <button
                  type="button"
                  className={styles.bouton}
                  onClick={() => void generer(s.pseudonyme)}
                >
                  Générer ma clé
                </button>
              </p>
            ) : aRegenerer === s.pseudonyme ? (
              <p className={petits.ligneCle}>
                <span className={styles.petit}>
                  L&apos;ancienne clé cessera de marcher tout de suite : la
                  sonde installée devra recevoir la nouvelle.
                </span>
                <button
                  type="button"
                  className={styles.bouton}
                  onClick={() => void generer(s.pseudonyme)}
                >
                  Oui, régénérer
                </button>
                <button
                  type="button"
                  className={styles.secondaire}
                  onClick={() => setARegenerer(null)}
                >
                  Annuler
                </button>
              </p>
            ) : (
              <p>
                <button
                  type="button"
                  className={styles.secondaire}
                  onClick={() => setARegenerer(s.pseudonyme)}
                >
                  Régénérer ma clé
                </button>
              </p>
            )}
          </div>
        );
      })}
      {erreurCle && (
        <p role="alert" className={styles.petit}>
          {erreurCle}
        </p>
      )}

      <Demandes
        demandes={demandes}
        enAttente={enAttente}
        pays={pays}
        ajouter={(d) => setDemandes((l) => [d, ...l])}
      />
    </section>
  );
}

function Demandes({
  demandes,
  enAttente,
  pays,
  ajouter,
}: {
  demandes: Demande[];
  enAttente: boolean;
  pays: [string, string][];
  ajouter: (d: Demande) => void;
}) {
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<{
    champ?: string;
    texte: string;
  } | null>(null);

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulaire = e.currentTarget;
    const f = new FormData(formulaire);
    const valeurs = {
      pays: String(f.get("pays") ?? ""),
      ville: String(f.get("ville") ?? "").trim(),
      operateur: String(f.get("operateur") ?? "").trim(),
    };
    setEnvoi(true);
    setErreur(null);
    const r = await ecrire("/api/v1/moi/demandes", valeurs);
    setEnvoi(false);
    if (r.statut === 201) {
      ajouter({
        id: Number(r.corps.id) || Date.now(),
        ...valeurs,
        statut: "en-attente",
        cree_le: new Date().toISOString(),
      });
      formulaire.reset();
      return;
    }
    if (r.statut === 401) return window.location.reload();
    const texte =
      r.statut === 409
        ? "Vous avez déjà une demande en attente : l'équipe la regarde."
        : r.statut === 429
          ? "Beaucoup de demandes cette heure-ci : réessayez plus tard."
          : r.statut === 400 && typeof r.corps.champ === "string"
            ? (ERREURS_CHAMP[r.corps.champ] ?? "Vérifiez le formulaire.")
            : "La demande n'a pas pu être envoyée : réessayez dans un instant.";
    setErreur({
      champ: typeof r.corps.champ === "string" ? r.corps.champ : undefined,
      texte,
    });
  }

  return (
    <div id="demande" className={petits.demande}>
      <h3>Demander une sonde</h3>
      {demandes.length > 0 && (
        <ul>
          {demandes.map((d) => (
            <li key={d.id}>
              {d.ville}, {d.pays} · {d.operateur} ·{" "}
              <span className={styles.petit}>
                {STATUT_DEMANDE[d.statut] ?? d.statut} · {date(d.cree_le)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {enAttente ? (
        <p className={styles.discret}>
          Une demande à la fois : dès que l&apos;équipe l&apos;accepte, la sonde
          apparaît ici avec le bouton « Générer ma clé ».
        </p>
      ) : (
        <form className={petits.formulaire} onSubmit={envoyer}>
          <label>
            Pays
            <select
              name="pays"
              required
              defaultValue=""
              aria-invalid={erreur?.champ === "pays" || undefined}
            >
              <option value="" disabled>
                Choisir
              </option>
              {pays.map(([iso, nom]) => (
                <option key={iso} value={iso}>
                  {nom}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ville
            <input
              name="ville"
              required
              minLength={2}
              maxLength={60}
              autoComplete="address-level2"
              aria-invalid={erreur?.champ === "ville" || undefined}
            />
          </label>
          <label>
            Opérateur
            <input
              name="operateur"
              required
              minLength={2}
              maxLength={60}
              placeholder="Orange, MTN, Free…"
              aria-invalid={erreur?.champ === "operateur" || undefined}
            />
          </label>
          <button type="submit" className={styles.bouton} disabled={envoi}>
            {envoi ? "Envoi…" : "Envoyer la demande"}
          </button>
          <span className={styles.petit}>
            Aucune adresse e-mail : la réponse arrive ici, dans Mon espace.
          </span>
          {erreur && (
            <span role="alert" className={petits.erreur}>
              {erreur.texte}
            </span>
          )}
        </form>
      )}
    </div>
  );
}
