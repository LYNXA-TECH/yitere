"use client";

import { useRef, useState } from "react";
import { BoutonCopier } from "@/components/BoutonCopier";
import {
  DEMANDE_VIDE,
  lienDemande,
  messageDemande,
  type DemandeCle as Demande,
} from "@/lib/affichage/demande-cle";
import styles from "./contribuer.module.css";

/**
 * Demander sa cle sans rediger d'e-mail : un bouton ouvre une petite fenetre (dialog
 * natif : Echap la ferme, le focus y reste), quelques champs, puis Envoyer ouvre la
 * messagerie avec le message deja ecrit. Si rien ne s'ouvre (pas de messagerie
 * configuree), le message et l'adresse restent a copier.
 */
export function DemandeCle({
  adresse,
  pays,
}: {
  adresse: string;
  pays: { iso: string; nom: string }[];
}) {
  const [d, setD] = useState<Demande>(DEMANDE_VIDE);
  const [erreur, setErreur] = useState(false);
  const [prete, setPrete] = useState(false);
  const champVille = useRef<HTMLInputElement>(null);
  const fenetre = useRef<HTMLDialogElement>(null);
  const changer = (k: keyof Demande) => (v: string) => {
    setD((x) => ({ ...x, [k]: v }));
    if (k === "ville") setErreur(false);
  };

  return (
    <>
      <button
        type="button"
        className={styles.github}
        aria-haspopup="dialog"
        onClick={() => fenetre.current?.showModal()}
      >
        Demander ma clé
      </button>
      <dialog
        ref={fenetre}
        className={styles.fenetre}
        aria-labelledby="cle-titre"
        // Un clic sur le voile, hors de la fenetre, la ferme.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className={styles.fenetreHaut}>
          <h2 id="cle-titre">Demander votre clé</h2>
          <button
            type="button"
            className={styles.fermer}
            aria-label="Fermer"
            onClick={() => fenetre.current?.close()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <p className={styles.corps}>
          L&apos;équipe vous répond avec une clé personnelle.
        </p>
        <form
          className={styles.demande}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!d.ville.trim()) {
              setErreur(true);
              champVille.current?.focus();
              return;
            }
            setPrete(true);
            window.location.href = lienDemande(adresse, d);
          }}
        >
          <div className={styles.champ}>
            <label htmlFor="cle-pays">Pays</label>
            <select
              id="cle-pays"
              value={d.pays}
              onChange={(e) => changer("pays")(e.target.value)}
            >
              {pays.map((p) => (
                <option key={p.iso} value={p.nom}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.champ}>
            <label htmlFor="cle-ville">Ville</label>
            <input
              id="cle-ville"
              ref={champVille}
              // A l'ouverture de la fenetre, on ecrit tout de suite sa ville.
              autoFocus
              value={d.ville}
              onChange={(e) => changer("ville")(e.target.value)}
              placeholder="Conakry"
              autoComplete="address-level2"
              required
              aria-invalid={erreur || undefined}
              aria-describedby={erreur ? "cle-ville-erreur" : undefined}
            />
            {erreur && (
              <span id="cle-ville-erreur" className={styles.erreur}>
                Indiquez votre ville.
              </span>
            )}
          </div>
          <div className={styles.champ}>
            <label htmlFor="cle-operateur">
              Opérateur <span className={styles.discret}>(facultatif)</span>
            </label>
            <input
              id="cle-operateur"
              value={d.operateur}
              onChange={(e) => changer("operateur")(e.target.value)}
              placeholder="Orange, MTN…"
            />
          </div>
          <div className={styles.champ}>
            <label htmlFor="cle-pseudo">
              Pseudonyme <span className={styles.discret}>(facultatif)</span>
            </label>
            <input
              id="cle-pseudo"
              value={d.pseudonyme}
              onChange={(e) => changer("pseudonyme")(e.target.value)}
              placeholder="lynx-conakry-2"
            />
          </div>
          <button type="submit" className={styles.bouton}>
            Envoyer ma demande
          </button>
          <p className={styles.petit} role="status">
            {prete ? (
              <>
                Votre messagerie s&apos;ouvre avec le message prêt : il ne reste
                qu&apos;à l&apos;envoyer. Rien ne s&apos;ouvre ? Copiez le
                message et envoyez-le à {adresse}.
              </>
            ) : (
              <>
                Votre messagerie s&apos;ouvre avec le message déjà écrit, vers{" "}
                {adresse}. La clé vous est envoyée en réponse.
              </>
            )}
          </p>
          {prete && (
            <BoutonCopier
              texte={`${adresse}\n${messageDemande(d).objet}\n\n${messageDemande(d).texte}`}
              libelle="Copier le message"
              libelleCopie="Message copié"
              titre="Copier l'adresse et le message de la demande"
              className={styles.copierMessage}
            />
          )}
        </form>
      </dialog>
    </>
  );
}
