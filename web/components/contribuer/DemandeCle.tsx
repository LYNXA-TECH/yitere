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
 * natif : Echap la ferme, le focus y reste), quelques champs, puis Envoyer.
 * La demande part directement a l'equipe (POST /api/v1/demandes-cle) ; si l'API ne la
 * prend pas (route absente, base pas migree, reseau), Envoyer ouvre la messagerie avec
 * le message deja ecrit, comme avant, et le message reste a copier.
 */
export function DemandeCle({
  adresse,
  pays,
}: {
  adresse: string;
  pays: { iso: string; nom: string }[];
}) {
  const [d, setD] = useState<Demande>(DEMANDE_VIDE);
  // Le premier champ obligatoire laisse vide : la ville, puis l'operateur.
  const [erreur, setErreur] = useState<
    "ville" | "operateur" | "contact" | null
  >(null);
  const [prete, setPrete] = useState(false);
  const [envoyee, setEnvoyee] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [contact, setContact] = useState("");
  const champContact = useRef<HTMLInputElement>(null);
  const champVille = useRef<HTMLInputElement>(null);
  const champOperateur = useRef<HTMLInputElement>(null);
  const fenetre = useRef<HTMLDialogElement>(null);
  const changer = (k: keyof Demande) => (v: string) => {
    setD((x) => ({ ...x, [k]: v }));
    if (k === erreur) setErreur(null);
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
          onSubmit={async (e) => {
            e.preventDefault();
            if (!d.ville.trim()) {
              setErreur("ville");
              champVille.current?.focus();
              return;
            }
            if (!d.operateur.trim()) {
              setErreur("operateur");
              champOperateur.current?.focus();
              return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())) {
              setErreur("contact");
              champContact.current?.focus();
              return;
            }
            setEnvoi(true);
            const iso = pays.find((p) => p.nom === d.pays)?.iso ?? "";
            const r = await fetch("/api/v1/demandes-cle", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                pseudonyme: d.pseudonyme.trim() || d.ville.trim(),
                pays: iso,
                ville: d.ville.trim(),
                operateur: d.operateur.trim(),
                contact: contact.trim(),
              }),
            }).catch(() => null);
            setEnvoi(false);
            if (r?.status === 201) return setEnvoyee(true);
            if (r?.status === 400) {
              const c = await r.json().catch(() => ({}));
              if (c.champ === "contact") {
                setErreur("contact");
                return champContact.current?.focus();
              }
            }
            // L'API ne prend pas la demande : la messagerie, comme avant.
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
              aria-invalid={erreur === "ville" || undefined}
              aria-describedby={
                erreur === "ville" ? "cle-ville-erreur" : undefined
              }
            />
            {erreur === "ville" && (
              <span id="cle-ville-erreur" className={styles.erreur}>
                Indiquez votre ville.
              </span>
            )}
          </div>
          <div className={styles.champ}>
            <label htmlFor="cle-operateur">Opérateur</label>
            <input
              id="cle-operateur"
              ref={champOperateur}
              value={d.operateur}
              onChange={(e) => changer("operateur")(e.target.value)}
              placeholder="Orange, MTN, Free"
              required
              aria-invalid={erreur === "operateur" || undefined}
              aria-describedby={
                erreur === "operateur" ? "cle-operateur-erreur" : undefined
              }
            />
            {erreur === "operateur" && (
              <span id="cle-operateur-erreur" className={styles.erreur}>
                Indiquez votre opérateur.
              </span>
            )}
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
          <div className={styles.champ}>
            <label htmlFor="cle-contact">Votre adresse e-mail</label>
            <input
              id="cle-contact"
              ref={champContact}
              type="email"
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                if (erreur === "contact") setErreur(null);
              }}
              placeholder="vous@exemple.com"
              autoComplete="email"
              required
              aria-invalid={erreur === "contact" || undefined}
              aria-describedby="cle-contact-aide"
            />
            <span
              id="cle-contact-aide"
              className={erreur === "contact" ? styles.erreur : styles.discret}
            >
              {erreur === "contact"
                ? "Indiquez une adresse e-mail valide."
                : "Seulement pour vous envoyer la clé : elle est effacée ensuite."}
            </span>
          </div>
          <button
            type="submit"
            className={styles.bouton}
            disabled={envoi || envoyee}
          >
            {envoi
              ? "Envoi…"
              : envoyee
                ? "Demande envoyée"
                : "Envoyer ma demande"}
          </button>
          <p className={styles.petit} role="status">
            {envoyee ? (
              <>
                Demande reçue. L&apos;équipe vous envoie votre clé à{" "}
                {contact.trim()}.
              </>
            ) : prete ? (
              <>
                Votre messagerie s&apos;ouvre avec le message prêt : il ne reste
                qu&apos;à l&apos;envoyer. Rien ne s&apos;ouvre ? Copiez le
                message et envoyez-le à {adresse}.
              </>
            ) : (
              <>
                La demande part directement à l&apos;équipe, qui vous répond
                avec la clé.
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
