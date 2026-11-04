// sharp embarque libvips, sous licence LGPL, interdite par le reglement du concours.
// YITERE n'optimise aucune image cote serveur (images.unoptimized dans next.config.ts) :
// ce module ne doit donc jamais etre appele. S'il l'est, on le dit clairement.
throw new Error(
  "sharp est desactive dans YITERE : aucune optimisation d'image cote serveur.",
);
