import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
