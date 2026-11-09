import type { Verdict } from "@/lib/donnees/types";
import type { Dictionnaire } from "@/lib/i18n";
import styles from "./BlocVerdict.module.css";

type Props = {
  verdict: Verdict;
  textes: Dictionnaire["verdict"];
  /** Adresse de la page Méthodologie dans la langue courante. */
  lienMethode: string;
};

/**
 * Le verdict d'un service, en trois parties jamais melangees :
 * ce qui est observe, l'hypothese sur la cause, et les preuves.
 */
export function BlocVerdict({ verdict, textes: t, lienMethode }: Props) {
  const { observation, hypothese, preuves } = verdict;
  const degrade = observation.etat === "degrade";
  const sondes = texteSondes(verdict, t);

  return (
    <section className={styles.bloc} aria-label={t.aria(verdict.cible.nom)}>
      <p className={styles.ligne}>
        <span
          className={styles.etiquette}
          data-nature="observe"
          data-etat={observation.etat}
        >
          {t.observe}
        </span>
        {texteObservation(verdict, t)}
      </p>

      {degrade && (
        <p className={styles.ligne}>
          {hypothese ? (
            <span className={styles.etiquette} data-nature="hypothese">
              {t.hypothese}
            </span>
          ) : (
            <span className={styles.etiquette} data-nature="indetermine">
              {t.indetermine}
            </span>
          )}
          {hypothese
            ? t.causeProbable(texteCause(hypothese, t))
            : t.causeIndeterminee}
        </p>
      )}

      <ul className={styles.preuves}>
        {sondes && <li>{sondes}</li>}
        <li>
          {observation.etat === "pas-de-donnee"
            ? t.aucuneMesure(preuves.periodeMinutes)
            : t.mesures(preuves.mesures, preuves.periodeMinutes)}
        </li>
        {preuves.sondesEnRodage > 0 && (
          <li>{t.rodage(preuves.sondesEnRodage)}</li>
        )}
        <li>{t.repere(preuves.repere)}</li>
      </ul>

      {hypothese && (
        <p className={styles.limite}>
          {t.limite} <a href={lienMethode}>{t.lienMethode}</a>
        </p>
      )}
    </section>
  );
}

type Textes = Dictionnaire["verdict"];

function texteObservation({ observation }: Verdict, t: Textes): string {
  if (observation.etat === "normal") return t.aucuneDegradation;
  if (observation.etat === "pas-de-donnee") return t.pasDeDonnee;
  return observation.depuis
    ? t.degradationDepuis(observation.depuis)
    : t.degradation;
}

/**
 * Les sondes sur lesquelles repose le verdict. Rien quand aucune n'a mesure :
 * une absence de donnee n'est pas un zero (specification, regle 4).
 */
function texteSondes(
  { observation, preuves }: Verdict,
  t: Textes,
): string | null {
  if (observation.etat === "pas-de-donnee") return null;
  if (observation.etat === "degrade")
    return t.sondesDegrade(preuves.sondesTouchees, preuves.sondesEpargnees);
  return t.sondesNormal(preuves.sondesEpargnees);
}

function texteCause(h: NonNullable<Verdict["hypothese"]>, t: Textes): string {
  switch (h.cause) {
    case "service":
      return t.causeService;
    case "operateur":
      return t.causeOperateur(h.operateur, h.ville);
    case "connexion-locale":
      return t.causeConnexionLocale;
  }
}
