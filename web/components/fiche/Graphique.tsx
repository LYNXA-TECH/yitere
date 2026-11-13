import { heureUTC, nombre } from "@/lib/format";
import type { DetailService, Serie } from "@/lib/donnees/types";
import type { Dictionnaire, Langue } from "@/lib/i18n";
import styles from "./fiche.module.css";

type Props = {
  detail: DetailService;
  langue: Langue;
  t: Dictionnaire["fiche"];
  lecture: string;
  /** Ce que represente la bande grise, et le repere de Madrid. */
  note: string;
};

const G = 56;
const D = 880;
const H = 16;
const B = 260;

/**
 * Une courbe par sonde, dessinee sur le serveur en SVG. Les deux periodes sont rendues ;
 * deux boutons radio choisissent laquelle se voit, sans JavaScript.
 */
export function Graphique({ detail, langue, t, lecture, note }: Props) {
  const vues = [
    {
      cle: "24",
      series: detail.series24,
      heures: detail.heures24,
      debut: detail.debutIncident24,
      sous: t.graphiqueSous24,
    },
    {
      cle: "7j",
      series: detail.series7j,
      heures: detail.heures7j,
      debut: null,
      sous: t.graphiqueSous7j,
    },
  ] as const;
  return (
    <section
      aria-labelledby="evolution"
      className={`${styles.cadre} ${styles.graphique}`}
    >
      <div className={styles.titreCadre}>
        <div>
          <h2 id="evolution">{t.graphiqueTitre(detail.unite)}</h2>
          {vues.map((v) => (
            <span key={v.cle} data-vue={v.cle} className={styles.petit}>
              {v.sous}
            </span>
          ))}
        </div>
        <fieldset className={styles.periodes}>
          <legend className={styles.masque}>{t.periode}</legend>
          <label>
            <input type="radio" name="periode" value="24" defaultChecked />
            {t.h24}
          </label>
          <label>
            <input type="radio" name="periode" value="7j" />
            {t.j7}
          </label>
        </fieldset>
      </div>
      {vues.map((v) => (
        <div key={v.cle} data-vue={v.cle} className={styles.defilement}>
          <Courbes
            series={v.series}
            heures={v.heures}
            debutIncident={v.debut}
            habituel={detail.habituel}
            langue={langue}
            t={t}
            septJours={v.cle === "7j"}
            description={t.alternative(
              v.series.length,
              v.cle === "24" ? t.h24 : t.j7,
              lecture,
            )}
          />
        </div>
      ))}
      <p className={styles.corps}>{lecture}</p>
      <p className={styles.petit}>{note}</p>
    </section>
  );
}

function Courbes({
  series,
  heures,
  debutIncident,
  habituel,
  langue,
  t,
  septJours,
  description,
}: {
  series: Serie[];
  heures: string[];
  debutIncident: number | null;
  /** Null tant qu'aucune sonde n'est jugee : pas de bande a tracer. */
  habituel: { min: number; max: number } | null;
  langue: Langue;
  t: Dictionnaire["fiche"];
  septJours: boolean;
  description: string;
}) {
  const n = heures.length;
  const valeurs = series.flatMap((s) =>
    s.points.filter((p): p is number => p !== null),
  );
  const pas = valeurs.some((v) => v > 50) ? 200 : 5;
  const max = Math.ceil(Math.max(...valeurs, 1) / pas) * pas;
  const X = (i: number) => G + (i / (n - 1)) * (D - G);
  const Y = (v: number) => B - (v / max) * (B - H);

  const lignes = series.map((s) => {
    let d = "";
    let stylo = false;
    s.points.forEach((p, i) => {
      if (p === null) {
        stylo = false;
        return;
      }
      d += `${stylo ? "L" : "M"}${X(i).toFixed(1)} ${Y(p).toFixed(1)} `;
      stylo = true;
    });
    const dernier = [...s.points]
      .reverse()
      .find((p): p is number => p !== null);
    return { s, d: d || "M0 0", y: dernier === undefined ? B : Y(dernier) + 4 };
  });
  // Etiquettes trop proches : on les ecarte de 14 unites.
  const ordre = [...lignes].sort((a, b) => a.y - b.y);
  for (let i = 1; i < ordre.length; i++) {
    const precedent = ordre[i - 1]!;
    const courant = ordre[i]!;
    if (courant.y - precedent.y < 14) courant.y = precedent.y + 14;
  }
  const graduations = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: Y(max * f),
    texte: nombre(langue, max * f),
  }));
  const reperes = (septJours ? [0, 7, 14, 21, 27] : [0, 6, 12, 18, 23]).filter(
    (i) => i < n,
  );
  const fin = Date.parse(heures[n - 1] ?? "");
  const etiquetteX = (i: number) =>
    i === n - 1
      ? t.maintenant
      : septJours
        ? t.jourMoins(
            Math.round((fin - Date.parse(heures[i] ?? "")) / 86_400_000),
          )
        : heureUTC(langue, heures[i] ?? "");
  const debutZone =
    debutIncident !== null ? X(Math.max(0, debutIncident - 0.5)) : null;

  return (
    <svg
      viewBox="0 0 990 300"
      role="img"
      aria-label={description}
      className={styles.svg}
    >
      {habituel && (
        <rect
          x={G}
          y={Y(habituel.max * 1.06)}
          width={D - G}
          height={Y(habituel.min * 0.94) - Y(habituel.max * 1.06)}
          fill="var(--bande-habituelle)"
        />
      )}
      {graduations.map((g) => (
        <g key={g.y}>
          <line x1={G} x2={D} y1={g.y} y2={g.y} stroke="var(--trait)" />
          <text x={G - 8} y={g.y + 4} textAnchor="end" className={styles.axe}>
            {g.texte}
          </text>
        </g>
      ))}
      {debutZone !== null && (
        <rect
          x={debutZone}
          y={H}
          width={D - debutZone}
          height={B - H}
          fill="var(--etat-degrade)"
          fillOpacity="0.08"
        />
      )}
      {lignes.map(({ s, d, y }) => (
        <g
          key={s.sonde.pseudonyme}
          data-statut={s.statut}
          className={styles.serie}
        >
          <path d={d} fill="none" strokeLinejoin="round" />
          <text x={D + 6} y={y}>
            {t.abregeSonde(s.sonde.operateur, s.sonde.numero, s.sonde.ville)}
            {s.statut === "rodage" ? ` ${t.enRodage}` : ""}
          </text>
        </g>
      ))}
      {/* Premiere et derniere etiquettes alignees sur leur bord : aucune n'est coupee. */}
      {reperes.map((i) => (
        <text
          key={i}
          x={X(i)}
          y={284}
          textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
          className={styles.axe}
        >
          {etiquetteX(i)}
        </text>
      ))}
    </svg>
  );
}
