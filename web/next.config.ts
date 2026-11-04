import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Aucune optimisation d'image cote serveur : c'est ce qui permet de se passer
  // de sharp (libvips, LGPL). On ne sert que des images deja legeres (SVG).
  images: { unoptimized: true },
};

export default nextConfig;
