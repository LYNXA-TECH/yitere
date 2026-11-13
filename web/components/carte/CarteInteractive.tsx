"use client";

import { useVueCarte, ZOOM_MAX } from "./useVueCarte";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type {
  Bande,
  EtatSonde,
  SondeCarte,
  TextesCarte,
  VilleCarte,
} from "./types";
import styles from "./carte.module.css";

type Props = {
  villes: VilleCarte[];
  cibles: { cle: string; nom: string }[];
  /** Etiquette de chaque heure (24), la derniere : maintenant. */
  heures: string[];
  axe: string[];
  navigateur: { x: number; y: number; pas: number }[];
  arcs: { x1: number; y1: number; x2: number; y2: number; pas: number }[];
  couloirs: { libelle: string; bandes: Bande[] }[];
  marques: { pas: number; nature: "publication" | "navigateur" }[];
  largeur: number;
  hauteur: number;
  /** Fond de carte dessine sur le serveur : il ne passe jamais par le JavaScript. */
  fond: ReactNode;
  /** Haut du panneau (titre, resume) et suite (incidents, entraide), rendus sur le serveur. */
  entetePanneau: ReactNode;
  panneau: ReactNode;
  textes: TextesCarte;
};

const DERNIERE = 23;
const VITESSES = [1, 2, 4];

/** Pire etat d'une sonde a une heure, pour un service ou pour tous. */
function etatDe(
  sonde: SondeCarte,
  cle: string,
  pas: number,
): EtatSonde | "rodage" {
  if (sonde.enRodage && pas === DERNIERE) return "rodage";
  const listes =
    cle === "tous" ? Object.values(sonde.etats) : [sonde.etats[cle] ?? []];
  const etats = listes.map((l) => l[pas] ?? "absente");
  if (etats.every((e) => e === "absente")) return "absente";
  if (etats.includes("degrade")) return "degrade";
  if (etats.every((e) => e === "pas-de-donnee" || e === "absente"))
    return "pas-de-donnee";
  return "normal";
}

export function CarteInteractive(p: Props) {
  const t = p.textes;
  const [pas, setPas] = useState(DERNIERE);
  const [cle, setCle] = useState("tous");
  const [lecture, setLecture] = useState(false);
  const [vitesse, setVitesse] = useState(0);
  const carte = useVueCarte();
  const { vue: v0 } = carte;
  const [vue, setVue] = useState<"carte" | "liste">("carte");
  const [avecNavigateur, setAvecNavigateur] = useState(false);
  const [avecEntraide, setAvecEntraide] = useState(true);
  const [selection, setSelection] = useState<string | null>(null);

  // Lecture de la frise : une heure par seconde (divisee par la vitesse), arret au direct.
  useEffect(() => {
    if (!lecture) return;
    const minuterie = setInterval(
      () => {
        setPas((h) => {
          if (h >= DERNIERE) {
            setLecture(false);
            return DERNIERE;
          }
          return h + 1;
        });
      },
      1000 / (VITESSES[vitesse] ?? 1),
    );
    return () => clearInterval(minuterie);
  }, [lecture, vitesse]);

  // Les boutons « Montrer sur la carte » du panneau sont des liens #service-<cle>.
  useEffect(() => {
    const lire = () => {
      const m = /^#service-(.+)$/.exec(window.location.hash);
      if (m?.[1] && p.cibles.some((c) => c.cle === m[1])) {
        setCle(m[1]);
        setVue("carte");
      }
    };
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, [p.cibles]);

  const direct = pas === DERNIERE;
  const placees = p.villes.filter((v) => v.x !== null && v.y !== null);
  // Le premier zoom se fait autour des sondes, la ou il y a quelque chose a voir.
  const centre = placees.length
    ? {
        x: placees.reduce((s, v) => s + (v.x ?? 0), 0) / placees.length,
        y: placees.reduce((s, v) => s + (v.y ?? 0), 0) / placees.length,
      }
    : { x: p.largeur / 2, y: p.hauteur / 2 };
  /** Un point de la carte (unites du dessin) en pixels du cadre, le dessin etant centre et contenu. */
  const versPixels = (l: number, h: number) => {
    const s = Math.min(l / p.largeur, h / p.hauteur);
    return {
      x: (l - p.largeur * s) / 2 + centre.x * s,
      y: (h - p.hauteur * s) / 2 + centre.y * s,
    };
  };
  // Les pastilles et les noms gardent leur taille a l'ecran, quel que soit le zoom.
  const inverse = 1 / v0.k;
  const villeChoisie = p.villes.find((v) => v.nom === selection);

  return (
    <div className={styles.disposition} data-page="carte">
      <section aria-label={t.description} className={styles.scene}>
        <div
          className={styles.plateau}
          ref={carte.cadre}
          data-vue={vue}
          data-zoom={v0.k > 1 || undefined}
          {...(vue === "carte" ? carte.gestes : {})}
        >
          {vue === "carte" ? (
            <div
              ref={carte.contenu}
              className={styles.zoom}
              data-geste={carte.geste || undefined}
              data-zoom={v0.k > 1 || undefined}
              style={
                {
                  transform: `translate(${v0.x}px, ${v0.y}px) scale(${v0.k})`,
                  "--k": v0.k,
                } as CSSProperties
              }
            >
              {p.fond}
              <svg
                viewBox={`0 0 ${p.largeur} ${p.hauteur}`}
                className={styles.calque}
                role="img"
                aria-label={t.description}
              >
                {avecEntraide &&
                  p.arcs
                    .filter((a) => a.pas <= pas)
                    .map((a, i) => (
                      <path
                        key={i}
                        className={styles.arc}
                        d={`M${a.x1} ${a.y1} Q${(a.x1 + a.x2) / 2} ${Math.min(a.y1, a.y2) - 60} ${a.x2} ${a.y2}`}
                      />
                    ))}
                {avecNavigateur &&
                  p.navigateur
                    .filter((m) => m.pas <= pas && m.pas > pas - 24)
                    .map((m, i) => (
                      <circle
                        key={i}
                        className={styles.navigateur}
                        cx={m.x + ((i % 3) - 1) * 9 * inverse}
                        cy={m.y + (22 + (i % 2) * 8) * inverse}
                        r={4 * inverse}
                      />
                    ))}
                {placees.map((v) => {
                  const presentes = v.sondes.filter(
                    (s) => etatDe(s, cle, pas) !== "absente",
                  );
                  if (presentes.length === 0) return null;
                  const etats = presentes.map((s) => etatDe(s, cle, pas));
                  const etat = etats.includes("degrade")
                    ? "degrade"
                    : etats.every(
                          (e) => e === "rodage" || e === "pas-de-donnee",
                        )
                      ? "vide"
                      : "normal";
                  return (
                    <g
                      key={v.nom}
                      className={styles.ville}
                      data-etat={etat}
                      data-direct={direct || undefined}
                      tabIndex={0}
                      role="button"
                      aria-label={`${v.nom} · ${presentes.length} ${t.sondes.toLowerCase()}`}
                      onClick={() => setSelection(v.nom)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setSelection(v.nom);
                      }}
                    >
                      <g
                        transform={`translate(${v.x ?? 0} ${v.y ?? 0}) scale(${inverse})`}
                      >
                        <circle className={styles.pulsation} r={20} />
                        {etat === "degrade" && (
                          <circle className={styles.anneau} r={24} />
                        )}
                        <circle className={styles.point} r={15} />
                        <text
                          dy="0.35em"
                          textAnchor="middle"
                          className={styles.nombre}
                        >
                          {presentes.length}
                        </text>
                        <text x={24} dy="0.35em" className={styles.nomVille}>
                          {v.nom}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className={styles.liste}>
              <h2>{t.listeTitre.replace("{heure}", p.heures[pas] ?? "")}</h2>
              <p>{t.listeDetail}</p>
              <ul>
                {p.villes.map((v) => (
                  <li key={v.nom}>
                    <span className={styles.gras}>
                      {v.nom} <span className={styles.discret}>· {v.pays}</span>
                    </span>
                    <ul>
                      {v.sondes.map((s) => {
                        const e = etatDe(s, cle, pas);
                        return (
                          <li key={s.id} data-etat={e}>
                            <span className={styles.etatListe}>
                              {s.repere ? t.repereHorsCalcul : t.etats[e]}
                            </span>
                            <span>{s.libelle}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.controles}>
            <nav aria-label={t.niveau} className={styles.groupe}>
              <button
                type="button"
                aria-current={v0.k === 1 || undefined}
                onClick={carte.recentrer}
              >
                {t.afrique}
              </button>
            </nav>
            <div className={styles.droite}>
              <div
                role="group"
                aria-label={t.calques}
                className={styles.groupe}
              >
                <button
                  type="button"
                  aria-pressed={avecNavigateur}
                  onClick={() => setAvecNavigateur((x) => !x)}
                >
                  {t.mesuresNavigateur}
                </button>
                <button
                  type="button"
                  aria-pressed={avecEntraide}
                  onClick={() => setAvecEntraide((x) => !x)}
                >
                  {t.entraide}
                </button>
              </div>
              <div
                role="group"
                aria-label={t.affichage}
                className={styles.groupe}
              >
                <button
                  type="button"
                  aria-pressed={vue === "carte"}
                  onClick={() => setVue("carte")}
                >
                  {t.vueCarte}
                </button>
                <button
                  type="button"
                  aria-pressed={vue === "liste"}
                  onClick={() => setVue("liste")}
                >
                  {t.vueListe}
                </button>
              </div>
            </div>
          </div>

          {vue === "carte" && (
            <>
              {/* Etiquette fixe, qui ne suit pas le zoom : on ne la montre qu'a la vue entiere. */}
              {v0.k === 1 && (
                <span className={styles.repere}>
                  <span aria-hidden="true" className={styles.carreRepere} />
                  {t.repere}
                </span>
              )}
              <div className={styles.legende}>
                <span className={styles.gras}>{t.legende}</span>
                <span data-symbole="normal">{t.legendeNormal}</span>
                <span data-symbole="degrade">{t.legendeDegrade}</span>
                <span data-symbole="vide">{t.legendeRodage}</span>
                <span data-symbole="repere">{t.legendeRepere}</span>
                <span data-symbole="lien">{t.legendeLien}</span>
                <span>{t.legendePulse}</span>
              </div>
              <div className={styles.zooms}>
                <button
                  type="button"
                  aria-label={t.zoomer}
                  disabled={v0.k >= ZOOM_MAX}
                  onClick={() =>
                    carte.zoomer(1, v0.k === 1 ? versPixels : undefined)
                  }
                >
                  +
                </button>
                <button
                  type="button"
                  aria-label={t.dezoomer}
                  disabled={v0.k <= 1}
                  onClick={() => carte.zoomer(-1)}
                >
                  −
                </button>
              </div>
            </>
          )}
        </div>

        <div className={styles.frise}>
          <div className={styles.commandes}>
            <button
              type="button"
              className={styles.lecture}
              aria-label={lecture ? t.pause : t.lire}
              onClick={() => {
                if (!lecture && direct) setPas(0);
                setLecture((x) => !x);
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                {lecture ? (
                  <>
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </>
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
            </button>
            <div className={styles.heure}>
              <span>{p.heures[pas]}</span>
              <span>{direct ? t.sousDirect : t.sousRelecture[pas]}</span>
            </div>
            <div role="group" aria-label={t.periode} className={styles.groupe}>
              <button type="button" aria-pressed="true">
                {t.h24}
              </button>
            </div>
            <button
              type="button"
              className={styles.secondaire}
              onClick={() => setVitesse((v) => (v + 1) % VITESSES.length)}
            >
              {t.vitesse[vitesse]}
            </button>
            <span className={styles.ressort} />
            <button
              type="button"
              className={styles.direct}
              data-actif={direct || undefined}
              onClick={() => {
                setLecture(false);
                setPas(DERNIERE);
              }}
            >
              <span aria-hidden="true" className={styles.pointDirect} />
              {t.enDirect}
            </button>
          </div>
          <div className={styles.pistes}>
            <div className={styles.libelles}>
              {p.couloirs.map((c) => (
                <span key={c.libelle}>{c.libelle}</span>
              ))}
              <span>{t.sondesEntraide}</span>
            </div>
            <div className={styles.couloirs}>
              {p.couloirs.map((c) => (
                <div key={c.libelle} className={styles.couloir}>
                  {c.bandes.map((b, i) => (
                    <span
                      key={i}
                      data-teinte={b.teinte}
                      style={{
                        left: `${(b.de / 24) * 100}%`,
                        width: `${((b.a - b.de) / 24) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              ))}
              <div className={`${styles.couloir} ${styles.marques}`}>
                {p.marques.map((m, i) => (
                  <span
                    key={i}
                    data-nature={m.nature}
                    title={
                      m.nature === "publication"
                        ? t.publication
                        : t.mesureNavigateur
                    }
                    style={{ left: `${(m.pas / 24) * 100}%` }}
                  />
                ))}
              </div>
              <span
                aria-hidden="true"
                className={styles.curseur}
                style={{ left: `${((pas + 1) / 24) * 100}%` }}
              />
              <label htmlFor="carte-heure" className={styles.masque}>
                {t.heureAffichee}
              </label>
              <input
                id="carte-heure"
                type="range"
                min={0}
                max={DERNIERE}
                step={1}
                value={pas}
                aria-valuetext={p.heures[pas]}
                onChange={(e) => {
                  setLecture(false);
                  setPas(Number(e.target.value));
                }}
                className={styles.curseurSaisie}
              />
              <div className={styles.axe}>
                {p.axe.map((a) => (
                  <span key={a}>{a}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className={styles.panneau} aria-label={t.legende}>
        <div className={styles.haut}>
          {p.entetePanneau}
          <label htmlFor="carte-service" className={styles.etiquetteChamp}>
            {t.serviceAffiche}
          </label>
          <select
            id="carte-service"
            value={cle}
            onChange={(e) => setCle(e.target.value)}
            className={styles.choix}
          >
            <option value="tous">{t.tousServices}</option>
            {p.cibles.map((c) => (
              <option key={c.cle} value={c.cle}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>
        {villeChoisie && (
          <section aria-label={villeChoisie.nom} className={styles.selection}>
            <div className={styles.selectionTitre}>
              <div>
                <span className={styles.surtitre}>{t.ville}</span>
                <span className={styles.gras}>
                  {villeChoisie.nom} · {villeChoisie.pays}
                </span>
              </div>
              <button
                type="button"
                aria-label={t.fermer}
                onClick={() => setSelection(null)}
              >
                ×
              </button>
            </div>
            <ul>
              {villeChoisie.sondes.map((s) => {
                const e = etatDe(s, cle, pas);
                return (
                  <li key={s.id} data-etat={e}>
                    <span>{s.libelle}</span>
                    <span className={styles.etatListe}>
                      {s.repere ? t.repereHorsCalcul : t.etats[e]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {p.panneau}
      </aside>
    </div>
  );
}
