import type { Cause, Verdict } from "@/lib/donnees/types";
import styles from "./BlocVerdict.module.css";

/**
 * Le verdict d'un service, en trois parties jamais melangees :
 * ce qui est observe, l'hypothese sur la cause, et les preuves.
 */
export function BlocVerdict({ verdict }: { verdict: Verdict }) {
  const { observation, hypothese, preuves } = verdict;
  const degrade = observation.etat === "degrade";
  const sondes = texteSondes(verdict);

  return (
    <section
      className={styles.bloc}
      aria-label={`Verdict pour ${verdict.cible.nom}`}
    >
      <p className={styles.ligne}>
        <span
          className={styles.etiquette}
          data-nature="observe"
          data-etat={observation.etat}
        >
          Observé
        </span>
        {texteObservation(verdict)}
      </p>

      {degrade && (
        <p className={styles.ligne}>
          {hypothese ? (
            <span className={styles.etiquette} data-nature="hypothese">
              Hypothèse
            </span>
          ) : (
            <span className={styles.etiquette} data-nature="indetermine">
              Indéterminé
            </span>
          )}
          {hypothese
            ? texteCause(hypothese)
            : "Cause indéterminée : données insuffisantes"}
        </p>
      )}

      <ul className={styles.preuves}>
        {sondes && <li>{sondes}</li>}
        <li>
          {texteMesures(verdict)}, {preuves.periode}
        </li>
        {preuves.sondesEnRodage > 0 && (
          <li>
            {compter(preuves.sondesEnRodage, "sonde", "sondes")} en rodage,{" "}
            {preuves.sondesEnRodage > 1 ? "non comptées" : "non comptée"}
          </li>
        )}
        <li>Repère de Madrid (hors calcul) : {TEXTE_REPERE[preuves.repere]}</li>
      </ul>

      {hypothese && (
        <p className={styles.limite}>
          Hypothèse calculée par des règles publiques. Elle oriente, elle ne
          prouve pas. <a href="/methodologie">Comment c'est calculé</a>
        </p>
      )}
    </section>
  );
}

const TEXTE_REPERE: Record<Verdict["preuves"]["repere"], string> = {
  normal: "normal",
  degrade: "dégradé aussi",
  exclu: "exclu pour ce service",
};

function texteObservation({ observation }: Verdict): string {
  if (observation.etat === "normal") return "Aucune dégradation observée";
  if (observation.etat === "pas-de-donnee") return "Pas de donnée";
  return observation.depuis
    ? `Dégradation depuis ${heure(observation.depuis)}`
    : "Dégradation";
}

/** Les sondes sur lesquelles repose le verdict. Rien quand aucune n'a mesure. */
function texteSondes({ observation, preuves }: Verdict): string | null {
  if (observation.etat === "pas-de-donnee") return null;
  if (observation.etat === "degrade") {
    return `${compter(preuves.sondesTouchees, "sonde touchée", "sondes touchées")}, ${compter(preuves.sondesEpargnees, "épargnée", "épargnées")}`;
  }
  return preuves.sondesEpargnees > 1
    ? `${preuves.sondesEpargnees} sondes dans leurs valeurs habituelles`
    : `${preuves.sondesEpargnees} sonde dans ses valeurs habituelles`;
}

/** Jamais « 0 mesure » : une absence de donnee n'est pas un zero (specification, regle 4). */
function texteMesures({ observation, preuves }: Verdict): string {
  if (observation.etat === "pas-de-donnee") return "Aucune mesure exploitable";
  return compter(preuves.mesures, "mesure", "mesures");
}

function texteCause(h: NonNullable<Verdict["hypothese"]>): string {
  const libelles: Record<Cause, string> = {
    service: "le service lui-même",
    operateur: [h.operateur ?? "l'opérateur", h.ville]
      .filter(Boolean)
      .join(" à "),
    "connexion-locale": "la connexion locale de la sonde",
  };
  return `Cause probable : ${libelles[h.cause]}`;
}

/** Heure de l'horodatage serveur, en temps universel, qui est aussi l'heure de la Guinee. */
function heure(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} GMT`;
}

function compter(n: number, singulier: string, pluriel: string): string {
  return `${n} ${n > 1 ? pluriel : singulier}`;
}
