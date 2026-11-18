/*
 * Regrouper les villes trop proches a l'ecran. Les pastilles et les noms gardent leur
 * taille quel que soit le zoom : a k = 1, Conakry, Kindia et Labe se recouvrent. Une
 * ville trop proche d'une plus grosse rejoint son groupe ; le groupe se separe quand on
 * zoome. Les distances sont en unites du dessin, multipliees par le zoom k.
 */

/** Une pastille fait 30 unites ; un nom s'etend a droite sur environ 70. */
const RAYON = 32;
const LARGEUR_NOM = 70;
const HAUTEUR_NOM = 24;

type Placee = { nom: string; x: number; y: number; poids: number };

const trop = (a: Placee, b: Placee, k: number) => {
  const dx = Math.abs(a.x - b.x) * k;
  const dy = Math.abs(a.y - b.y) * k;
  return Math.hypot(dx, dy) < RAYON || (dx < LARGEUR_NOM && dy < HAUTEUR_NOM);
};

/** Les groupes, la plus grosse ville (le plus de sondes) en tete de chacun. */
export function regrouperProches<T extends Placee>(
  villes: T[],
  k: number,
): { ancre: T; membres: T[] }[] {
  const groupes: { ancre: T; membres: T[] }[] = [];
  const triees = [...villes].sort(
    (a, b) => b.poids - a.poids || a.nom.localeCompare(b.nom),
  );
  for (const v of triees) {
    const g = groupes.find((x) => trop(x.ancre, v, k));
    if (g) g.membres.push(v);
    else groupes.push({ ancre: v, membres: [v] });
  }
  return groupes;
}

/** Le zoom a partir duquel toutes les villes du groupe se separent de sa tete. */
export function zoomPourSeparer(g: { ancre: Placee; membres: Placee[] }) {
  let k = 1;
  for (const m of g.membres) {
    if (m === g.ancre) continue;
    const dx = Math.abs(m.x - g.ancre.x);
    const dy = Math.abs(m.y - g.ancre.y);
    const d = Math.hypot(dx, dy) || 0.01;
    const parNom = Math.min(
      dx ? LARGEUR_NOM / dx : Infinity,
      dy ? HAUTEUR_NOM / dy : Infinity,
    );
    k = Math.max(k, RAYON / d, parNom);
  }
  return k;
}
