"use client";

import { useState } from "react";

/** Copie une commande dans le presse-papiers et le dit, sans quitter la page. */
export function BoutonCopier({
  texte,
  libelle,
  libelleCopie,
  titre,
  className,
}: {
  texte: string;
  libelle: string;
  libelleCopie: string;
  titre: string;
  className?: string;
}) {
  const [copie, setCopie] = useState(false);
  return (
    <button
      type="button"
      className={className}
      aria-label={titre}
      onClick={() => {
        void navigator.clipboard?.writeText(texte).then(() => setCopie(true));
      }}
    >
      <span aria-live="polite">{copie ? libelleCopie : libelle}</span>
    </button>
  );
}
