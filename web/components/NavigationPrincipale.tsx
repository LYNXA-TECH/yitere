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

/**
 * Les icones des onglets, sur une grille de 24 : decoratives, le nom est ecrit dessous.
 * La classe « plein » marque la forme qui se remplit quand l'onglet est actif.
 */
const ICONES: Record<string, ReactNode> = {
  carte: (
    <>
      <path
        className={styles.plein}
        d="M9 4.5 3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8z"
      />
      <path d="M9 4.5v12.7M15 6.8v12.7" />
    </>
  ),
  services: (
    <>
      <rect
        className={styles.plein}
        x="3.5"
        y="4"
        width="17"
        height="6.5"
        rx="2"
      />
      <rect
        className={styles.plein}
        x="3.5"
        y="13.5"
        width="17"
        height="6.5"
        rx="2"
      />
      <path d="M7.5 7.25h.01M7.5 16.75h.01M11 7.25h1M11 16.75h1" />
    </>
  ),
  echanges: (
    <>
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2H18a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2h-.5" />
      <path
        className={styles.plein}
        d="M4 10a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9.5L6 20v-3a2 2 0 0 1-2-2z"
      />
    </>
  ),
  mesurer: (
    <>
      <path className={styles.plein} d="M3.5 18a8.5 8.5 0 1 1 17 0z" />
      <path d="m12 18 3.5-5M12 9.5v1.5M7 11.5l1 1M17 11.5l-1 1" />
    </>
  ),
  moi: (
    <>
      <circle className={styles.plein} cx="12" cy="8" r="3.75" />
      <path className={styles.plein} d="M4.75 20a7.25 7.25 0 0 1 14.5 0z" />
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
          <span className={styles.pastille}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {ICONES[cle]}
            </svg>
          </span>
          {texte}
        </Link>
      ))}
    </nav>
  );
}
