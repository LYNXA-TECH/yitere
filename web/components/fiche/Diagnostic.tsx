import { nomOperateur } from "@/lib/affichage/sondes";
import Link from "next/link";
import { Etiquette } from "@/components/Etiquette";
import {
  texteHypothese,
  teinte,
  valeur,
  libelleSansDonnee,
} from "@/lib/affichage/verdicts";
import type { PreuveSonde, Verdict } from "@/lib/donnees/types";
import type { Dictionnaire } from "@/lib/i18n";
import styles from "./fiche.module.css";

type Props = {
  verdict: Verdict;
  t: Dictionnaire;
  /** Heure du calcul : la page en cache dit de quand date ce qu'elle montre. */
  calculeLe: string;
  lienMethode: string;
};

/** Observe, hypothese et preuves, cote a cote : jamais melanges. */
export function Diagnostic({ verdict: v, t, calculeLe, lienMethode }: Props) {
  const f = t.fiche;
  const etat = v.observation.etat;
  const touchees = v.preuves.sondes.filter((p) => p.statut === "touchee");
  const designer = (p: PreuveSonde) =>
    `${nomOperateur(p.operateur, t.verdict.operateurInconnu)} · ${p.ville} · ${p.numero}`;
  const mesure = (n: number, p: PreuveSonde) => valeur(n, p.unite, t.services);

  return (
    <section
      aria-labelledby="diagnostic"
      className={styles.diagnostic}
      data-teinte={teinte(v)}
    >
      <div className={styles.colonne}>
        <h2 id="diagnostic" className={styles.surtitre}>
          {f.diagnostic(calculeLe)}
        </h2>
        <div className={styles.bloc}>
          <Etiquette nature="observe" teinte={teinte(v)}>
            {t.verdict.observe}
          </Etiquette>
          <span className={styles.observation}>{titreObservation(v, t)}</span>
          <span className={styles.corps}>
            {detailObservation(v, f, touchees)}
          </span>
        </div>
        {etat !== "normal" && (
          <div className={styles.bloc}>
            <Etiquette nature="hypothese">
              {v.hypothese ? t.verdict.hypothese : t.verdict.indetermine}
            </Etiquette>
            <span className={styles.hypothese}>
              {etat === "pas-de-donnee"
                ? t.services.sansHypothese
                : texteHypothese(v, t.verdict)}
            </span>
            <span className={styles.discret}>
              {limite(v, f)}{" "}
              <Link href={lienMethode} className="lien-tactile">
                {t.verdict.lienMethode}
              </Link>
            </span>
          </div>
        )}
      </div>
      <div className={styles.colonne}>
        <h3 className={styles.titrePreuves}>{f.preuves}</h3>
        <ul className={styles.preuves}>
          {v.preuves.sondes.map((p) => (
            <li key={p.pseudonyme} data-nature={p.statut}>
              <span className={styles.marque} aria-hidden="true" />
              <span>
                <strong>
                  {p.statut === "touchee" ? f.touchee : f.epargnee} ·
                </strong>{" "}
                {p.statut === "touchee"
                  ? f.preuveTouchee(
                      designer(p),
                      mesure(p.valeur, p),
                      mesure(p.habituel, p),
                    )
                  : f.preuveEpargnee(designer(p), mesure(p.valeur, p))}
              </span>
            </li>
          ))}
          <li data-nature="repere">
            <span className={styles.marque} aria-hidden="true" />
            <span>
              <strong>{f.repere} ·</strong> {f.preuveRepere(v.preuves.repere)}
            </span>
          </li>
          {v.preuves.sondesEnRodage > 0 && (
            <li data-nature="rodage">
              <span className={styles.marque} aria-hidden="true" />
              <span>
                <strong>{f.rodage} ·</strong>{" "}
                {f.preuveRodage(v.preuves.sondesEnRodage)}
              </span>
            </li>
          )}
        </ul>
        <span className={styles.petit}>{f.piedPreuves(v.preuves.mesures)}</span>
      </div>
    </section>
  );
}

function titreObservation(v: Verdict, t: Dictionnaire): string {
  if (v.observation.etat === "normal") return t.verdict.aucuneDegradation;
  if (v.observation.etat === "pas-de-donnee")
    return libelleSansDonnee(v, t.services);
  return v.observation.depuis
    ? t.verdict.degradationDepuis(v.observation.depuis)
    : t.verdict.degradation;
}

function detailObservation(
  v: Verdict,
  f: Dictionnaire["fiche"],
  touchees: PreuveSonde[],
): string {
  if (v.observation.etat === "normal") return f.observationNormale;
  if (v.observation.etat === "pas-de-donnee")
    return v.preuves.sondesEnRodage > 0
      ? f.observationRodage(v.preuves.sondesEnRodage)
      : f.observationVide;
  switch (v.hypothese?.cause) {
    case "service":
      return f.observationService;
    case "operateur":
      return f.observationOperateur(
        touchees.length,
        v.hypothese.operateur ?? "",
      );
    case "connexion-locale":
      return f.observationLocale;
    default:
      return touchees.length === 1
        ? f.observationIsolee
        : f.observationIndeterminee;
  }
}

function limite(v: Verdict, f: Dictionnaire["fiche"]): string {
  if (v.observation.etat === "pas-de-donnee") return f.limiteVide;
  switch (v.hypothese?.cause) {
    case "service":
      return f.limiteService;
    case "operateur":
      return f.limiteOperateur;
    case "connexion-locale":
      return f.limiteLocale;
    default:
      return f.limiteIndeterminee;
  }
}
