import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

/**
 * La methodologie n'existe qu'a un seul endroit : docs/methodologie.md, a la racine du depot.
 * La page la lit a la compilation et la convertit en HTML (decision 0002, D11).
 * Le fichier vient du depot lui-meme, relu en PR : son HTML est sur.
 */
export async function lireMethodologie(): Promise<string> {
  const fichier = path.join(process.cwd(), "..", "docs", "methodologie.md");
  return ancrer(marked.parse(await readFile(fichier, "utf8"), { async: false }))
    .html;
}

/** Un identifiant d'ancre lisible : « 4. L'objet témoin » devient « objet-temoin ». */
export function ancre(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/^(l|d)'/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Donne un identifiant a chaque titre h2 et rend la liste pour le sommaire. */
export function ancrer(html: string): {
  html: string;
  entrees: { id: string; texte: string }[];
} {
  const entrees: { id: string; texte: string }[] = [];
  const vus = new Set<string>();
  const sortie = html.replace(
    /<h2>([\s\S]*?)<\/h2>/g,
    (_, interieur: string) => {
      const texte = interieur
        .replace(/<[^>]+>/g, "")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .trim();
      let id = ancre(texte) || "partie";
      while (vus.has(id)) id += "-2";
      vus.add(id);
      entrees.push({ id, texte });
      return `<h2 id="${id}">${interieur}</h2>`;
    },
  );
  return { html: sortie, entrees };
}

/** Le sommaire de la methodologie. */
export async function sommaireMethodologie() {
  const fichier = path.join(process.cwd(), "..", "docs", "methodologie.md");
  return ancrer(marked.parse(await readFile(fichier, "utf8"), { async: false }))
    .entrees;
}
