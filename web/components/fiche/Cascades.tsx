import { nomOperateur } from "@/lib/affichage/sondes";
import type { Cascade } from "@/lib/donnees/types";
import type { Dictionnaire } from "@/lib/i18n";
import styles from "./fiche.module.css";

/** Ou part le temps d'un passage : DNS, connexion, chiffrement, attente du premier octet. */
export function Cascades({
  cascades,
  t,
  inconnu,
  ms,
  lecture,
}: {
  cascades: Cascade[];
  t: Dictionnaire["fiche"];
  /** Le nom affiche quand l'operateur d'une sonde n'est pas detecte. */
  inconnu: string;
  ms: (n: number) => string;
  lecture: string;
}) {
  const total = (c: Cascade) => c.dns + c.connexion + c.tls + c.premierOctet;
  const plusLong = Math.max(...cascades.map(total));
  return (
    <section aria-labelledby="temps" className={styles.cadre}>
      <div>
        <h2 id="temps">{t.tempsTitre}</h2>
        <span className={styles.petit}>{t.tempsDetail}</span>
      </div>
      {cascades.map((c) => {
        const etapes = [
          { nom: t.dns, ms: c.dns, cle: "dns" },
          { nom: t.connexion, ms: c.connexion, cle: "connexion" },
          { nom: t.tls, ms: c.tls, cle: "tls" },
          {
            nom: t.premierOctet,
            ms: c.premierOctet,
            cle: c.statut === "touchee" ? "octet-touchee" : "octet",
          },
        ];
        return (
          <div key={c.sonde.pseudonyme} className={styles.cascade}>
            <div className={styles.cascadeTitre}>
              <span className={styles.gras}>
                {nomOperateur(c.sonde.operateur, inconnu)} · {c.sonde.numero} ·{" "}
                {c.statut === "touchee"
                  ? t.touchee.toLowerCase()
                  : t.epargnee.toLowerCase()}
              </span>
              <span className={styles.chiffres}>{t.total(ms(total(c)))}</span>
            </div>
            <div
              role="img"
              aria-label={`${etapes.map((e) => `${e.nom} ${ms(e.ms)}`).join(", ")}, ${t.total(ms(total(c)))}`}
              className={styles.barre}
              style={{ width: `${((total(c) / plusLong) * 100).toFixed(1)}%` }}
            >
              {etapes.map((e) => (
                <span
                  key={e.cle}
                  data-etape={e.cle}
                  style={{ flexGrow: e.ms }}
                />
              ))}
            </div>
            <div className={styles.legendeCascade}>
              {etapes.map((e) => (
                <span key={e.cle}>
                  <span
                    className={styles.carre}
                    data-etape={e.cle}
                    aria-hidden="true"
                  />
                  {e.nom} <span className={styles.chiffres}>{ms(e.ms)}</span>
                </span>
              ))}
            </div>
          </div>
        );
      })}
      <p className={styles.corps}>{lecture}</p>
    </section>
  );
}
