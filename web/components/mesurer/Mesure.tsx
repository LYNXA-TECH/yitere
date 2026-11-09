"use client";

import { useState } from "react";
import styles from "./mesurer.module.css";

export type LigneMesure = {
  cle: string;
  nom: string;
  url: string;
  /** « objet » : telechargement complet pour estimer un debit ; sinon une requete HEAD. */
  objet: boolean;
  taille: number | null;
  /** Ce que voient les sondes, deja mis en forme. */
  sondes: string;
  sondesDegradees: boolean;
};

type Resultat = {
  etat: "attente" | "encours" | "fait" | "bloquee";
  ms?: number;
  mbps?: number;
};

const DELAI_MS = 15_000;

/**
 * Mesure reelle, depuis le navigateur du visiteur : une requete par service, chronometree.
 * Rien n'est envoye a YITERE : le resultat reste sur l'ecran.
 * Page en francais seulement (decision 0002, D13).
 */
export function Mesure({ lignes }: { lignes: LigneMesure[] }) {
  const [resultats, setResultats] = useState<Record<string, Resultat>>({});
  const [enCours, setEnCours] = useState(false);
  const fini = lignes.every((l) =>
    ["fait", "bloquee"].includes(resultats[l.cle]?.etat ?? ""),
  );

  async function lancer() {
    setEnCours(true);
    setResultats({});
    for (const l of lignes) {
      setResultats((r) => ({ ...r, [l.cle]: { etat: "encours" } }));
      const controle = new AbortController();
      const minuterie = setTimeout(() => controle.abort(), DELAI_MS);
      const debut = performance.now();
      try {
        const reponse = await fetch(l.url, {
          method: l.objet ? "GET" : "HEAD",
          mode: "no-cors",
          cache: "no-store",
          signal: controle.signal,
        });
        if (l.objet) await reponse.arrayBuffer();
        const ms = Math.round(performance.now() - debut);
        const mbps =
          l.objet && l.taille
            ? Math.round(((l.taille * 8) / (ms / 1000) / 1e6) * 10) / 10
            : undefined;
        setResultats((r) => ({ ...r, [l.cle]: { etat: "fait", ms, mbps } }));
      } catch {
        setResultats((r) => ({ ...r, [l.cle]: { etat: "bloquee" } }));
      } finally {
        clearTimeout(minuterie);
      }
    }
    setEnCours(false);
  }

  const formatter = new Intl.NumberFormat("fr");
  return (
    <>
      <section className={styles.lancement}>
        <button
          type="button"
          className={styles.bouton}
          onClick={lancer}
          disabled={enCours}
        >
          {enCours
            ? "Mesure en cours…"
            : fini
              ? "Relancer la mesure"
              : "Lancer la mesure"}
        </button>
        <span className={styles.discret}>
          Rien à installer, rien d&apos;envoyé : le résultat reste sur votre
          écran. Votre adresse IP n&apos;est lue par aucun serveur de YITERE.
        </span>
      </section>

      <section aria-labelledby="resultats" className={styles.resultats}>
        <div className={styles.titre}>
          <h2 id="resultats">
            Durée totale de chaque requête · débit estimé pour l&apos;objet
            témoin
          </h2>
          <span className={styles.discret} role="status">
            {enCours ? "Mesure en cours" : fini ? "Terminé" : "En attente"}
          </span>
        </div>
        <ul>
          {lignes.map((l) => {
            const r = resultats[l.cle] ?? { etat: "attente" };
            return (
              <li key={l.cle} className={styles.ligne}>
                <span className={styles.nom}>{l.nom}</span>
                <span className={styles.valeur} data-etat={r.etat}>
                  {r.etat === "fait"
                    ? r.mbps !== undefined
                      ? `${new Intl.NumberFormat("fr", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(r.mbps)} Mbit/s`
                      : `${formatter.format(r.ms ?? 0)} ms`
                    : r.etat === "encours"
                      ? "…"
                      : r.etat === "bloquee"
                        ? "requête bloquée"
                        : "—"}
                </span>
                <span
                  className={styles.sondes}
                  data-degrade={l.sondesDegradees || undefined}
                >
                  {l.sondes}
                </span>
              </li>
            );
          })}
        </ul>
        <p className={styles.petit}>
          Votre navigateur donne la durée totale de chaque requête, pas le
          détail. Une seule mesure est indicative : elle n&apos;entre jamais
          dans un diagnostic. La colonne de droite vient des sondes installées,
          affichée à côté, jamais mélangée. Le registre Docker n&apos;est pas
          mesuré depuis le navigateur. Une requête bloquée vient souvent
          d&apos;un bloqueur de contenu ou d&apos;un pare-feu.
        </p>
      </section>
    </>
  );
}
