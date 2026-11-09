// Genere lib/geo/afrique.ts a partir des contours Natural Earth (domaine public).
// Le fichier source n'est pas dans le depot : on le telecharge une fois, puis
//   node scripts/generer-carte.mjs chemin/vers/ne_110m_admin_0_countries.geojson
// Source : https://github.com/nvkelso/natural-earth-vector (geojson, 1:110 m).
import { readFileSync, writeFileSync } from "node:fs";

const [, , source] = process.argv;
if (!source) {
  console.error("Usage : node scripts/generer-carte.mjs <fichier.geojson>");
  process.exit(1);
}

// Doit rester identique a CADRE dans lib/geo/projection.ts.
const CADRE = { lonMin: -20, latMax: 38, echelle: 10 };
const point = ([lon, lat]) => [
  Math.round((lon - CADRE.lonMin) * CADRE.echelle),
  Math.round((CADRE.latMax - lat) * CADRE.echelle),
];

function anneau(coordonnees) {
  const points = [];
  for (const c of coordonnees) {
    const p = point(c);
    const dernier = points.at(-1);
    if (!dernier || dernier[0] !== p[0] || dernier[1] !== p[1]) points.push(p);
  }
  if (points.length < 3) return "";
  return "M" + points.map((p) => p.join(" ")).join("L") + "Z";
}

function chemin(geometrie) {
  const polygones =
    geometrie.type === "Polygon"
      ? [geometrie.coordinates]
      : geometrie.coordinates;
  return polygones.flatMap((anneaux) => anneaux.map(anneau)).join("");
}

const pays = JSON.parse(readFileSync(source, "utf8"))
  .features.filter((f) => f.properties.CONTINENT === "Africa")
  .map((f) => ({ iso: f.properties.ISO_A2_EH, d: chemin(f.geometry) }))
  .sort((a, b) => a.iso.localeCompare(b.iso));

const sortie = `// Fichier genere par scripts/generer-carte.mjs : ne pas modifier a la main.
// Contours des pays d'Afrique, Natural Earth 1:110 m (domaine public).

/** iso : code ISO 3166-1 alpha-2 (« -99 » quand Natural Earth n'en attribue pas). */
export const PAYS_AFRIQUE: readonly { iso: string; d: string }[] = ${JSON.stringify(pays, null, 2)};
`;
writeFileSync(new URL("../lib/geo/afrique.ts", import.meta.url), sortie);
console.log(`${pays.length} pays ecrits dans lib/geo/afrique.ts`);
