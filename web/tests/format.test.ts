import { describe, expect, it } from "vitest";
import { categoriePluriel, heureUTC, nombre } from "@/lib/format";

describe("categoriePluriel", () => {
  it("accorde zéro au singulier en français", () => {
    expect(categoriePluriel("fr", 0)).toBe("one");
    expect(categoriePluriel("fr", 1)).toBe("one");
    expect(categoriePluriel("fr", 2)).toBe("other");
  });

  it("accorde zéro au pluriel en anglais", () => {
    expect(categoriePluriel("en", 0)).toBe("other");
    expect(categoriePluriel("en", 1)).toBe("one");
  });
});

describe("nombre", () => {
  it("sépare les milliers selon la langue", () => {
    // En français, le séparateur est une espace fine insécable (U+202F).
    expect(nombre("fr", 1220)).toBe("1\u202f220");
    expect(nombre("en", 1220)).toBe("1,220");
  });
});

describe("heureUTC", () => {
  it("affiche l'heure universelle sur 24 h, dans les deux langues", () => {
    expect(heureUTC("fr", "2026-11-03T14:10:00Z")).toBe("14:10");
    expect(heureUTC("en", "2026-11-03T14:10:00Z")).toBe("14:10");
  });

  it("écrit minuit 00, et non 12 ou 24", () => {
    expect(heureUTC("en", "2026-11-03T00:05:00Z")).toBe("00:05");
  });
});
