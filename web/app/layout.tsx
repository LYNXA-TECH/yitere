import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "YITERE",
  description:
    "Observatoire des conditions réseau du développement africain : ma connexion, mon opérateur, ou le service ?",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
