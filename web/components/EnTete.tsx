import Link from "next/link";
import type { Dictionnaire, Langue } from "@/lib/i18n";
import { lien, RUBRIQUES } from "@/lib/navigation";
import { Logo } from "./Logo";
import { ChoixLangue, Rubriques } from "./NavigationPrincipale";
import styles from "./EnTete.module.css";

type Props = {
  langue: Langue;
  textes: Dictionnaire;
  /** Vrai tant qu'une page du site affiche des donnees d'exemple (directive de Cellou). */
  exemple: boolean;
  /** Faux tant que la connexion GitHub n'existe pas : « Se connecter » devient « Bientôt ». */
  connexion: boolean;
};

export function EnTete({ langue, textes: t, exemple, connexion }: Props) {
  return (
    <header className={styles.entete}>
      <div className={styles.interieur}>
        <a href="#contenu" className={styles.evitement}>
          {t.navigation.allerAuContenu}
        </a>
        <Link
          href={lien(langue)}
          className={styles.logo}
          aria-label={t.site.accueil}
        >
          <Logo />
          <span>YITERE</span>
        </Link>
        <Rubriques
          langue={langue}
          libelles={{
            principale: t.navigation.principale,
            mobile: t.navigation.mobile,
            langue: t.navigation.langue,
          }}
          rubriques={RUBRIQUES.map(({ cle, chemin }) => ({
            href: lien(langue, chemin),
            texte: t.navigation[cle],
          }))}
        />
        <span className={styles.ressort} />
        {exemple && (
          <span
            className={styles.exemple}
            title={t.source.exempleTitre}
            data-source="exemple"
          >
            {t.source.exemple}
          </span>
        )}
        <ChoixLangue langue={langue} libelle={t.navigation.langue} />
        {connexion ? (
          <Link href={lien(langue, "/moi")} className={styles.connexion}>
            {t.navigation.seConnecter}
          </Link>
        ) : (
          <span
            className={styles.connexion}
            title={t.navigation.bientotTitre}
            aria-disabled="true"
          >
            {t.navigation.bientot}
          </span>
        )}
        <Link href={lien(langue, "/mesurer")} className={styles.mesurer}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {t.navigation.mesurerChezMoi}
        </Link>
      </div>
    </header>
  );
}
