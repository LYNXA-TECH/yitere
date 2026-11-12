import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EnTete } from "@/components/EnTete";
import { OngletsMobiles } from "@/components/NavigationPrincipale";
import {
  ecritureOuverte,
  lirePublications,
  siteEnExemple,
} from "@/lib/donnees";
import { dictionnaire, LANGUES } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien, ONGLETS_MOBILES } from "@/lib/navigation";
import { geist, geistMono } from "@/lib/polices";
import "@/styles/variables.css";
import "@/styles/base.css";

type Props = { children: ReactNode; params: Promise<{ langue: string }> };

/** Une version de chaque page par langue, generee a la compilation. */
export function generateStaticParams() {
  return LANGUES.map((langue) => ({ langue }));
}

/** Toute autre langue dans l'adresse donne une page 404. */
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = dictionnaire(await langueDe(params));
  return {
    title: { default: "YITERE", template: "%s · YITERE" },
    description: t.site.description,
  };
}

export default async function Disposition({ children, params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire(langue);
  return (
    <html lang={langue} className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <EnTete
          langue={langue}
          textes={t}
          exemple={await siteEnExemple()}
          connexion={ecritureOuverte(await lirePublications())}
        />
        <div id="contenu">{children}</div>
        <OngletsMobiles
          langue={langue}
          libelle={t.navigation.mobile}
          onglets={ONGLETS_MOBILES.map(({ cle, chemin }) => ({
            href: lien(langue, chemin),
            texte: t.navigation[cle],
          }))}
        />
      </body>
    </html>
  );
}
