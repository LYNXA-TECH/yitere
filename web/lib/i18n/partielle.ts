type Feuille = string | ((...args: never[]) => string);

/** Un dictionnaire ou chaque cle peut manquer, a toute profondeur. */
export type Partielle<T> = {
  [K in keyof T]?: T[K] extends Feuille ? T[K] : Partielle<T[K]>;
};
