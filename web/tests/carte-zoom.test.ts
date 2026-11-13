import { describe, expect, it } from "vitest";
import { borner, ZOOM_MAX, zoomerAutour } from "@/components/carte/useVueCarte";

describe("zoom de la carte", () => {
  it("garde sous le pointeur le point vise", () => {
    const v = zoomerAutour({ k: 1, x: 0, y: 0 }, 3, 200, 100);
    // le point (200, 100) de l'ecran montre toujours le meme point de la carte
    expect((200 - v.x) / v.k).toBeCloseTo(200);
    expect((100 - v.y) / v.k).toBeCloseTo(100);
    expect(v.k).toBe(3);
  });

  it("va jusqu'a x12, assez pour separer Conakry et Dakar, et jamais en dessous de x1", () => {
    expect(zoomerAutour({ k: 10, x: 0, y: 0 }, 5, 0, 0).k).toBe(ZOOM_MAX);
    expect(ZOOM_MAX).toBe(12);
    expect(zoomerAutour({ k: 1.5, x: 0, y: 0 }, 0.1, 0, 0).k).toBe(1);
  });

  it("ne laisse jamais sortir la carte du cadre", () => {
    expect(borner({ k: 1, x: 50, y: -50 }, 800, 600)).toEqual({
      k: 1,
      x: 0,
      y: 0,
    });
    expect(borner({ k: 2, x: -5000, y: 10 }, 800, 600)).toEqual({
      k: 2,
      x: -800,
      y: 0,
    });
  });
});
