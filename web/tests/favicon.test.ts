import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { generateMetadata } from "@/app/[langue]/layout";

// next/font ne fonctionne qu'a la compilation par Next.js : les polices sont simulees ici.
vi.mock("@/lib/polices", () => ({
  geist: { variable: "" },
  geistMono: { variable: "" },
}));

const publics = join(__dirname, "..", "public");

describe("favicon", () => {
  it("chaque page declare l'oeil de YITERE, en SVG, en ICO et pour l'ecran d'accueil", async () => {
    const m = await generateMetadata({
      params: Promise.resolve({ langue: "fr" }),
      children: null,
    });
    expect(m.icons).toMatchObject({
      icon: [{ url: "/icon.svg" }, { url: "/favicon.ico" }],
      apple: "/apple-touch-icon.png",
    });
  });

  it("les trois fichiers existent, et l'ICO est un vrai ICO", () => {
    for (const f of ["icon.svg", "favicon.ico", "apple-touch-icon.png"])
      expect(existsSync(join(publics, f)), f).toBe(true);
    const ico = readFileSync(join(publics, "favicon.ico"));
    expect([...ico.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
  });
});
