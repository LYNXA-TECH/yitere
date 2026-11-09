"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANGUES, type Langue } from "@/lib/i18n/langues";
import styles from "./NavigationPrincipale.module.css";

type Props = {
  langue: Langue;
  libelle: string;
  libelleLangue: string;
  rubriques: { href: string; texte: string }[];
};

/** Chaque langue est nommee dans sa propre langue : on la reconnait sans la parler. */
const NOMS_LANGUES: Record<Langue, string> = { fr: "Français", en: "English" };

/**
 * Seul composant client de l'en-tete : il lit l'adresse courante pour marquer
 * la rubrique active et garder la meme page quand on change de langue.
 */
export function NavigationPrincipale({
  langue,
  libelle,
  libelleLangue,
  rubriques,
}: Props) {
  const chemin = usePathname() ?? `/${langue}`;
  const suite = chemin.slice(langue.length + 1);

  return (
    <>
      <nav aria-label={libelle} className={styles.rubriques}>
        <ul>
          {rubriques.map(({ href, texte }) => {
            const active = chemin === href || chemin.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined}>
                  {texte}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <nav aria-label={libelleLangue} className={styles.langues}>
        <ul>
          {LANGUES.map((autre) => (
            <li key={autre}>
              <Link
                href={`/${autre}${suite}`}
                hrefLang={autre}
                lang={autre}
                aria-current={autre === langue ? "true" : undefined}
                title={NOMS_LANGUES[autre]}
              >
                {autre.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
