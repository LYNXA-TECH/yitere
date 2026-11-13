"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Une vue de carte : decalage en pixels et facteur de zoom, origine en haut a gauche. */
export type Vue = { k: number; x: number; y: number };

export const ZOOM_MAX = 12;
const PAS_BOUTON = 2;
const SEUIL_GLISSER = 4;

/** La vue ne sort jamais de la carte : a k = 1, elle est centree et immobile. */
export function borner(v: Vue, largeur: number, hauteur: number): Vue {
  const k = Math.min(Math.max(v.k, 1), ZOOM_MAX);
  return {
    k,
    x: Math.min(0, Math.max(largeur * (1 - k), v.x)),
    y: Math.min(0, Math.max(hauteur * (1 - k), v.y)),
  };
}

/** Zoomer d'un facteur autour d'un point de l'ecran : ce point reste sous le doigt. */
export function zoomerAutour(
  v: Vue,
  facteur: number,
  px: number,
  py: number,
): Vue {
  const k = Math.min(Math.max(v.k * facteur, 1), ZOOM_MAX);
  const r = k / v.k;
  return { k, x: px - (px - v.x) * r, y: py - (py - v.y) * r };
}

/**
 * Zoom et deplacement de la carte, a la souris, au pave tactile et au doigt.
 * - molette et pincement du pave (ctrl + molette) : zoom autour du pointeur, jamais de la page ;
 * - glisser : deplacer ; deux doigts : pincer pour zoomer ;
 * - un clic sans mouvement reste un clic (choisir une ville).
 * `cadre` est l'element qui recoit les gestes, `contenu` celui qui est transforme.
 */
export function useVueCarte() {
  const cadre = useRef<HTMLDivElement>(null);
  const contenu = useRef<HTMLDivElement>(null);
  const [vue, setVue] = useState<Vue>({ k: 1, x: 0, y: 0 });
  const [geste, setGeste] = useState(false);

  const taille = () => ({
    l: contenu.current?.offsetWidth ?? 1,
    h: contenu.current?.offsetHeight ?? 1,
  });
  /** Coordonnees d'un point de l'ecran dans le repere du contenu, avant transformation. */
  const local = (clientX: number, clientY: number) => {
    const c = cadre.current;
    const z = contenu.current;
    if (!c || !z) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return {
      x: clientX - r.left - z.offsetLeft,
      y: clientY - r.top - z.offsetTop,
    };
  };

  const appliquer = useCallback((f: (v: Vue) => Vue) => {
    setVue((v) => {
      const { l, h } = taille();
      return borner(f(v), l, h);
    });
  }, []);

  /**
   * Boutons + et − : zoom autour d'un point du contenu, donne avant transformation
   * (par defaut, le milieu de ce qui est a l'ecran).
   */
  const zoomer = useCallback(
    (
      sens: 1 | -1,
      point?: (l: number, h: number) => { x: number; y: number },
    ) => {
      setGeste(false);
      const { l, h } = taille();
      appliquer((v) => {
        const p = point
          ? (() => {
              const c = point(l, h);
              return { x: v.x + c.x * v.k, y: v.y + c.y * v.k };
            })()
          : { x: l / 2, y: h / 2 };
        return zoomerAutour(
          v,
          sens > 0 ? PAS_BOUTON : 1 / PAS_BOUTON,
          p.x,
          p.y,
        );
      });
    },
    [appliquer],
  );

  const recentrer = useCallback(() => {
    setGeste(false);
    setVue({ k: 1, x: 0, y: 0 });
  }, []);

  // La molette doit etre ecoutee hors de React pour pouvoir empecher le zoom de la page.
  useEffect(() => {
    const c = cadre.current;
    if (!c) return;
    const molette = (e: WheelEvent) => {
      // En vue liste, il n'y a pas de carte : la molette fait defiler, comme partout.
      if (!contenu.current) return;
      e.preventDefault();
      setGeste(true);
      const p = local(e.clientX, e.clientY);
      // Le pincement du pave tactile arrive en ctrl + molette, par petits pas.
      const facteur = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002));
      appliquer((v) => zoomerAutour(v, facteur, p.x, p.y));
    };
    c.addEventListener("wheel", molette, { passive: false });
    return () => c.removeEventListener("wheel", molette);
  }, [appliquer]);

  // Glisser et pincer, avec les evenements de pointeur (souris, doigt, stylet).
  const pointeurs = useRef(new Map<number, { x: number; y: number }>());
  const deplace = useRef(false);
  const depart = useRef({ x: 0, y: 0 });

  const surDown = (e: React.PointerEvent) => {
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointeurs.current.size === 1) {
      deplace.current = false;
      depart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const surMove = (e: React.PointerEvent) => {
    const avant = pointeurs.current.get(e.pointerId);
    if (!avant) return;
    const apres = { x: e.clientX, y: e.clientY };
    if (
      !deplace.current &&
      Math.hypot(apres.x - depart.current.x, apres.y - depart.current.y) <
        SEUIL_GLISSER &&
      pointeurs.current.size === 1
    )
      return;
    if (!deplace.current) {
      deplace.current = true;
      cadre.current?.setPointerCapture(e.pointerId);
    }
    setGeste(true);
    if (pointeurs.current.size === 2) {
      const [autreId] = [...pointeurs.current.keys()].filter(
        (id) => id !== e.pointerId,
      );
      const autre =
        autreId === undefined ? undefined : pointeurs.current.get(autreId);
      if (autre) {
        const d0 = Math.hypot(avant.x - autre.x, avant.y - autre.y);
        const d1 = Math.hypot(apres.x - autre.x, apres.y - autre.y);
        const m0 = local((avant.x + autre.x) / 2, (avant.y + autre.y) / 2);
        const m1 = local((apres.x + autre.x) / 2, (apres.y + autre.y) / 2);
        appliquer((v) => {
          const z = zoomerAutour(v, d0 > 0 ? d1 / d0 : 1, m0.x, m0.y);
          return { ...z, x: z.x + m1.x - m0.x, y: z.y + m1.y - m0.y };
        });
      }
    } else {
      appliquer((v) => ({
        ...v,
        x: v.x + apres.x - avant.x,
        y: v.y + apres.y - avant.y,
      }));
    }
    pointeurs.current.set(e.pointerId, apres);
  };

  const surUp = (e: React.PointerEvent) => {
    pointeurs.current.delete(e.pointerId);
    if (pointeurs.current.size === 0) setGeste(false);
  };

  /** Apres un glisser, le clic qui suit n'est pas un choix de ville. */
  const surClickCapture = (e: React.MouseEvent) => {
    if (deplace.current) {
      e.stopPropagation();
      deplace.current = false;
    }
  };

  return {
    vue,
    geste,
    cadre,
    contenu,
    zoomer,
    recentrer,
    gestes: {
      onPointerDown: surDown,
      onPointerMove: surMove,
      onPointerUp: surUp,
      onPointerCancel: surUp,
      onClickCapture: surClickCapture,
      // Pas de glisser-deposer natif du texte ou du dessin : il laisserait une copie sous le curseur.
      onDragStart: (e: React.DragEvent) => e.preventDefault(),
    },
  };
}
