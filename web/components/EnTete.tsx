import Link from "next/link";
import type { Dictionnaire, Langue } from "@/lib/i18n";
import { lien, RUBRIQUES } from "@/lib/navigation";
import { NavigationPrincipale } from "./NavigationPrincipale";
import styles from "./EnTete.module.css";

type Props = { langue: Langue; textes: Dictionnaire };

export function EnTete({ langue, textes: t }: Props) {
  return (
    <header className={styles.entete}>
      <a href="#contenu" className={styles.evitement}>
        {t.navigation.allerAuContenu}
      </a>
      <Link
        href={lien(langue)}
        className={styles.logo}
        aria-label={t.site.accueil}
      >
        YITERE
      </Link>
      <NavigationPrincipale
        langue={langue}
        libelle={t.navigation.principale}
        libelleLangue={t.navigation.langue}
        rubriques={RUBRIQUES.map(({ cle, chemin }) => ({
          href: lien(langue, chemin),
          texte: t.navigation[cle],
        }))}
      />
    </header>
  );
}
