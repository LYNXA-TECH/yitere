"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LANGUES, type Langue } from "@/lib/i18n/langues";
import styles from "./NavigationPrincipale.module.css";

type Lien = { href: string; texte: string };

type Props = {
  langue: Langue;
  libelles: { principale: string; mobile: string; langue: string };
  rubriques: Lien[];
  onglets: Lien[];
};

/** Chaque langue est nommee dans sa propre langue : on la reconnait sans la parler. */
const NOMS_LANGUES: Record<Langue, string> = { fr: "Français", en: "English" };

/** Une rubrique est active sur sa page et sur ses sous-pages ; l'accueil, seulement sur lui-meme. */
function estActive(chemin: string, href: string, accueil: string): boolean {
  if (href === accueil) return chemin === accueil;
  return chemin === href || chemin.startsWith(`${href}/`);
}

/**
 * Le seul composant client de l'en-tete : il lit l'adresse courante pour marquer la
 * rubrique active et garder la meme page quand on change de langue.
 */
export function Rubriques({
  langue,
  libelles,
  rubriques,
}: Omit<Props, "onglets">) {
  const chemin = usePathname() ?? `/${langue}`;
  const accueil = `/${langue}`;
  return (
    <nav aria-label={libelles.principale} className={styles.rubriques}>
      {rubriques.map(({ href, texte }) => (
        <Link
          key={href}
          href={href}
          aria-current={estActive(chemin, href, accueil) ? "page" : undefined}
        >
          {texte}
        </Link>
      ))}
    </nav>
  );
}

export function ChoixLangue({
  langue,
  libelle,
}: {
  langue: Langue;
  libelle: string;
}) {
  const chemin = usePathname() ?? `/${langue}`;
  const suite = chemin.slice(langue.length + 1);
  return (
    <nav aria-label={libelle} className={styles.langues}>
      {LANGUES.map((autre) => (
        <Link
          key={autre}
          href={`/${autre}${suite}`}
          hrefLang={autre}
          // Pas de prechargement : changer de langue est rare, et sur une page introuvable
          // l'adresse dans l'autre langue n'existe pas non plus.
          prefetch={false}
          lang={autre}
          aria-current={autre === langue ? "true" : undefined}
          title={NOMS_LANGUES[autre]}
        >
          {autre.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

/** Les traces des icones des onglets (24 x 24, trait seul) : decoratives, le nom est ecrit dessous. */
const ICONES: Record<string, ReactNode> = {
  carte: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3C9.5 5.6 8.2 8.6 8.2 12s1.3 6.4 3.8 9" />
    </>
  ),
  services: <path d="M4 6h16M4 12h16M4 18h10" />,
  echanges: <path d="M4 5h16v11H10l-4.5 3.5V16H4z" />,
  mesurer: (
    <>
      <path d="M4 17a8 8 0 1 1 16 0" />
      <path d="m12 17 4-5" />
    </>
  ),
  moi: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
};

export function OngletsMobiles({
  langue,
  libelle,
  onglets,
}: {
  langue: Langue;
  libelle: string;
  onglets: (Lien & { cle: string })[];
}) {
  const chemin = usePathname() ?? `/${langue}`;
  const accueil = `/${langue}`;
  return (
    <nav aria-label={libelle} className={styles.onglets}>
      {onglets.map(({ href, texte, cle }) => (
        <Link
          key={href}
          href={href}
          aria-current={estActive(chemin, href, accueil) ? "page" : undefined}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {ICONES[cle]}
          </svg>
          {texte}
        </Link>
      ))}
    </nav>
  );
}
