/**
 * Mise en forme des nombres, des heures et des pluriels, selon la langue.
 * Tout passe par Intl, intégré à Node et aux navigateurs : rien à télécharger.
 * Ce module reçoit une locale BCP 47 (« fr », « en ») et ignore tout du reste
 * de l'application.
 */

// Créer un objet Intl coûte cher ; on en garde un par locale.
const reglesPluriel = new Map<string, Intl.PluralRules>();
const formatsNombre = new Map<string, Intl.NumberFormat>();
const formatsHeure = new Map<string, Intl.DateTimeFormat>();
const formatsDate = new Map<string, Intl.DateTimeFormat>();
const nomsRegions = new Map<string, Intl.DisplayNames>();

function memoriser<T>(
  cache: Map<string, T>,
  locale: string,
  creer: () => T,
): T {
  let valeur = cache.get(locale);
  if (valeur === undefined) {
    valeur = creer();
    cache.set(locale, valeur);
  }
  return valeur;
}

/** Catégorie grammaticale de n : « one », « other », « many »… selon la langue. */
export function categoriePluriel(
  locale: string,
  n: number,
): Intl.LDMLPluralRule {
  return memoriser(
    reglesPluriel,
    locale,
    () => new Intl.PluralRules(locale),
  ).select(n);
}

/**
 * n avec le séparateur de milliers de la langue : « 1 220 », « 1,220 ».
 * Avec des décimales, toujours le même nombre de chiffres : « 12,0 ».
 */
export function nombre(locale: string, n: number, decimales = 0): string {
  return memoriser(
    formatsNombre,
    `${locale}|${decimales}`,
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      }),
  ).format(n);
}

/** Heure et minute en temps universel, sur 24 h : « 14:10 », « 00:05 ». */
export function heureUTC(locale: string, iso: string): string {
  const format = memoriser(
    formatsHeure,
    locale,
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: "UTC",
      }),
  );
  return format.format(new Date(iso));
}

/** Jour et mois en temps universel : « 3 nov. », « Nov 3 ». */
export function dateCourte(locale: string, iso: string): string {
  const format = memoriser(
    formatsDate,
    locale,
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
  );
  return format.format(new Date(iso));
}

/** Nom d'un pays d'apres son code ISO : « GN » donne « Guinée », « Guinea ». */
export function nomPays(locale: string, iso: string): string {
  // Intl leve une erreur sur un code qui n'est pas ISO (vide, « -99 » du Somaliland) :
  // une publication sans pays ne doit pas faire tomber la page.
  if (!/^[A-Z]{2}$/.test(iso)) return iso;
  const noms = memoriser(
    nomsRegions,
    locale,
    () => new Intl.DisplayNames(locale, { type: "region" }),
  );
  return noms.of(iso) ?? iso;
}

/** Minutes ecoulees entre deux instants ISO (positif si « avant » precede « apres »). */
export function minutesEntre(avant: string, apres: string): number {
  return (Date.parse(apres) - Date.parse(avant)) / 60_000;
}
