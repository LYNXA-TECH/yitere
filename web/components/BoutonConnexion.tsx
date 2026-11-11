"use client";

import { useState, type ReactNode } from "react";

/**
 * Une action qui demande d'etre connecte (voter, confirmer, signaler, suivre).
 * Tant que la connexion GitHub n'existe pas, le bouton explique pourquoi il ne fait rien.
 */
export function BoutonConnexion({
  children,
  message,
  className,
  ...attributs
}: {
  children: ReactNode;
  message: string;
  className?: string;
  "aria-label"?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOuvert(true)}
        {...attributs}
      >
        {children}
      </button>
      {ouvert && (
        <span role="status" className="message-connexion">
          {message}
        </span>
      )}
    </>
  );
}
