import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EnTete } from "@/components/EnTete";
import { PiedDePage } from "@/components/PiedDePage";
import { dictionnaire, LANGUES } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
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
    <html lang={langue}>
      <body>
        <EnTete langue={langue} textes={t} />
        <div id="contenu">{children}</div>
        <PiedDePage textes={t.pied} />
      </body>
    </html>
  );
}
