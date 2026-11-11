"use client";

import Link from "next/link";
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

export function OngletsMobiles({
  langue,
  libelle,
  onglets,
}: {
  langue: Langue;
  libelle: string;
  onglets: Lien[];
}) {
  const chemin = usePathname() ?? `/${langue}`;
  const accueil = `/${langue}`;
  return (
    <nav aria-label={libelle} className={styles.onglets}>
      {onglets.map(({ href, texte }) => (
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
