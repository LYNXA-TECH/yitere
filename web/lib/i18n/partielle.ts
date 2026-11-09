/**
 * Un dictionnaire ou chaque cle peut manquer, a toute profondeur.
 * Une phrase garde ses parametres, mais peut renvoyer n'importe quel texte.
 */
export type Partielle<T> = {
  [K in keyof T]?: T[K] extends string
    ? string
    : T[K] extends (...args: infer A) => string
      ? (...args: A) => string
      : Partielle<T[K]>;
};
