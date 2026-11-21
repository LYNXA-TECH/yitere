"use client";

import { useEffect, useState } from "react";
import { seConnecter, useCompte } from "@/lib/compte";

/**
 * « A marche pour moi aussi » : POST /api/v1/publications/{id}/vote (contrat, section 6).
 * Un vote par compte ; voter deux fois ne compte qu'une fois.
 * - connexion pas ouverte : l'ancien message, comme avant ;
 * - pas connectee (ou 401) : envoie vers GitHub, puis ramene sur cette page.
 */
export function BoutonAMarche({
  id,
  className,
  texte,
  message,
}: {
  id: string;
  className?: string;
  texte: string;
  /** Le message d'avant, tant que la connexion n'est pas ouverte. */
  message: string;
}) {
  const compte = useCompte();
  // Un clic avant la reponse de l'API est garde : il agit des qu'elle arrive.
  const [clic, setClic] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [votes, setVotes] = useState<number | null>(null);
  const [erreur, setErreur] = useState("");

  async function voter() {
    setEnvoi(true);
    setErreur("");
    const r = await fetch(`/api/v1/publications/${id}/vote`, {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => null);
    setEnvoi(false);
    if (r?.status === 401) return seConnecter();
    if (r?.ok) {
      const c = (await r.json().catch(() => ({}))) as { votes?: unknown };
      return setVotes(typeof c.votes === "number" ? c.votes : 0);
    }
    setErreur("Le vote n'a pas abouti : réessayez dans un instant.");
  }

  function cliquer() {
    if (compte.etat === "anonyme") return seConnecter();
    if (compte.etat === "connecte") return void voter();
    setClic(true);
  }

  // La reponse de l'API arrive apres le clic : on agit a ce moment-la.
  useEffect(() => {
    if (!clic || compte.etat === "chargement" || compte.etat === "fermee")
      return;
    setClic(false);
    if (compte.etat === "anonyme") seConnecter();
    else void voter();
    // voter ne change pas d'un rendu a l'autre pour ce bouton.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clic, compte.etat]);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={cliquer}
        disabled={envoi}
        aria-pressed={votes !== null || undefined}
        data-actif={votes !== null || undefined}
      >
        {votes === null ? texte : `${texte} · ${votes}`}
      </button>
      {clic && compte.etat === "fermee" && (
        <span role="status" className="message-connexion">
          {message}
        </span>
      )}
      {erreur && (
        <span role="alert" className="message-connexion">
          {erreur}
        </span>
      )}
    </>
  );
}
