/*
 * Chaque ville garde sa pastille, meme quand une autre est tout pres (Conakry et
 * Freetown, Conakry et Kindia). Les pastilles et les noms gardent leur taille quel que
 * soit le zoom : a k = 1, deux villes proches se recouvriraient. On ecarte donc la plus
 * petite, verticalement, juste assez pour que pastilles et noms ne se touchent plus ; un
 * trait la relie a sa vraie place. En zoomant, l'ecart diminue jusqu'a disparaitre.
 * Les distances sont en unites du dessin, multipliees par le zoom k.
 */

/**
 * Une pastille fait 30 unites, son anneau (ville degradee) 48 : deux centres a moins de
 * 46 unites se touchent. Le nom commence 24 unites a droite du centre ; on compte
 * environ 8,5 unites par lettre (contour compris), plus une pastille voisine. Une ligne de nom
 * et une pastille voisine tiennent dans 32 unites de haut.
 */
const RAYON = 46;
const HAUTEUR_NOM = 32;
const etendue = (nom: string) => 24 + nom.length * 8.5 + 30;

type Placee = { nom: string; x: number; y: number; poids: number };
type Pose = { nom: string; x: number; y: number };

const seGenent = (a: Pose, b: Pose) => {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  if (Math.hypot(dx, dy) < RAYON) return true;
  // Le nom de celle de gauche s'etend vers celle de droite.
  const gauche = a.x <= b.x ? a : b;
  return dx < etendue(gauche.nom) && dy < HAUTEUR_NOM;
};

/**
 * Le decalage de chaque ville, en unites du dessin (0 si elle reste a sa place). Les
 * villes sont posees de la plus grosse (le plus de sondes) a la plus petite ; chacune
 * prend la place libre la plus proche de sa vraie position, en tournant autour d'elle
 * par cercles de plus en plus grands, en commencant par le bas.
 */
export function ecarterProches<T extends Placee>(
  villes: T[],
  k: number,
): Map<string, { dx: number; dy: number }> {
  const triees = [...villes].sort(
    (a, b) => b.poids - a.poids || a.nom.localeCompare(b.nom),
  );
  const posees: Pose[] = [];
  const decalages = new Map<string, { dx: number; dy: number }>();
  const libre = (q: Pose) => !posees.some((p) => seGenent(p, q));
  for (const v of triees) {
    const x0 = v.x * k;
    const y0 = v.y * k;
    let place: Pose = { nom: v.nom, x: x0, y: y0 };
    cherche: for (let r = 4; !libre(place) && r <= 240; r += 4) {
      // Autant d'essais qu'il en faut pour un pas d'environ 4 unites sur le cercle.
      const essais = Math.max(8, Math.round((2 * Math.PI * r) / 4));
      for (let i = 0; i < essais; i++) {
        const angle = Math.PI / 2 + (2 * Math.PI * i) / essais;
        const q = {
          nom: v.nom,
          x: x0 + r * Math.cos(angle),
          y: y0 + r * Math.sin(angle),
        };
        if (libre(q)) {
          place = q;
          break cherche;
        }
      }
    }
    posees.push(place);
    decalages.set(v.nom, {
      dx: (place.x - x0) / k,
      dy: (place.y - y0) / k,
    });
  }
  return decalages;
}
