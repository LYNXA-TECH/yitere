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
  return marked.parse(await readFile(fichier, "utf8"), { async: false });
}
