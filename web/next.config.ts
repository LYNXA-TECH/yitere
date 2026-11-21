import type { NextConfig } from "next";

/**
 * En-tetes de securite, sur toutes les pages. Pas de politique de scripts (CSP script-src) :
 * Next.js insere ses propres scripts, et une politique stricte demanderait un nonce par
 * requete. On ferme ce qui ne sert jamais : etre affiche dans un cadre, les plugins, les
 * formulaires vers un autre site, la camera, le micro, la position.
 */
export const ENTETES_SECURITE = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Ignore par les navigateurs tant que le site est servi en http (essais locaux).
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:chemin*", headers: ENTETES_SECURITE }];
  },
  // Aucune optimisation d'image cote serveur : c'est ce qui permet de se passer
  // de sharp (libvips, LGPL). On ne sert que des images deja legeres (SVG).
  images: { unoptimized: true },
  // Le navigateur poste ses publications sur /api/v1/publications, a la meme adresse que le
  // site. Si le serveur web envoie deja /api/v1 a l'API, cette regle ne sert jamais ; sinon,
  // Next.js transmet la requete a l'API (YITERE_API_URL, lue au build).
  async rewrites() {
    const api = process.env.YITERE_API_URL;
    return api
      ? [{ source: "/api/v1/:chemin*", destination: `${api}/api/v1/:chemin*` }]
      : [];
  },
};

export default nextConfig;
