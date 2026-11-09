import Link from "next/link";
import { CarteInteractive } from "@/components/carte/CarteInteractive";
import type { EtatSonde, VilleCarte } from "@/components/carte/types";
import { Etiquette } from "@/components/Etiquette";
import { contexte, statut } from "@/lib/affichage/publications";
import { teinte, texteHypothese } from "@/lib/affichage/verdicts";
import {
  lireIncidents,
  lireMesuresNavigateur,
  lirePublications,
  lireSondes,
  lireVerdicts,
} from "@/lib/donnees";
import type { Incident, Publication, Sonde } from "@/lib/donnees/types";
import { heureUTC, minutesEntre, nomPays } from "@/lib/format";
import { PAYS_AFRIQUE } from "@/lib/geo/afrique";
import { HAUTEUR, LARGEUR, projeter } from "@/lib/geo/projection";
import { VILLES } from "@/lib/geo/villes";
import { dictionnaire, type Dictionnaire, type Langue } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";
import styles from "./accueil.module.css";
import carte from "@/components/carte/carte.module.css";

type Props = { params: Promise<{ langue: string }> };

// Regeneree au plus tot toutes les 60 s (FRAICHEUR_SECONDES ; Next.js exige ici un nombre ecrit en clair).
export const revalidate = 60;

const HEURE_MS = 3_600_000;

/** L'accueil est la carte : ou sont les sondes, ce qui se passe, ce que la communaute partage. */
export default async function Accueil({ params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire(langue);
  const c = t.carte;
  const [verdicts, sondes, publications, navigateur, incidents] =
    await Promise.all([
      lireVerdicts(),
      lireSondes(),
      lirePublications(),
      lireMesuresNavigateur(),
      lireIncidents(),
    ]);
  const maintenant = verdicts.lueLe ?? new Date().toISOString();
  const fin = Date.parse(maintenant);
  /** Position d'un instant sur la frise : de 0 (il y a 24 h) a 24 (maintenant). */
  const surFrise = (iso: string | null) =>
    iso === null
      ? 24
      : Math.min(24, Math.max(0, 24 - (fin - Date.parse(iso)) / HEURE_MS));
  const pasDe = (iso: string) =>
    Math.min(23, Math.max(0, Math.ceil(surFrise(iso)) - 1));
  const position = (ville: string) => {
    const v = VILLES[ville];
    return v ? projeter(v.lat, v.lon) : null;
  };

  const villes = regrouper(sondes.donnees, langue, c);
  const paysSondes = new Set(sondes.donnees.map((s) => s.pays));
  const developpeurs = sondes.donnees.filter((s) => s.type === "dev");
  const heures = Array.from({ length: 24 }, (_, i) =>
    heureUTC(langue, new Date(fin - (23 - i) * HEURE_MS).toISOString()),
  );
  const degrades = verdicts.donnees.filter(
    (v) => v.observation.etat !== "normal",
  );
  const publicationsTriees = trierPourAccueil(publications.donnees).slice(0, 4);

  const arcs = publications.donnees.flatMap((p) => {
    const vers = position(p.ville);
    return p.confirmations.flatMap((conf) => {
      const de = position(conf.ville);
      return de && vers && conf.ville !== p.ville
        ? [{ x1: de.x, y1: de.y, x2: vers.x, y2: vers.y, pas: pasDe(conf.le) }]
        : [];
    });
  });

  return (
    <main>
      <CarteInteractive
        villes={villes}
        cibles={verdicts.donnees.map((v) => ({
          cle: v.cible.cle,
          nom: v.cible.nom,
        }))}
        heures={heures}
        axe={[
          c.hier(heures[0] ?? ""),
          heureUTC(langue, isoA(fin, 17)),
          heureUTC(langue, isoA(fin, 11)),
          heureUTC(langue, isoA(fin, 5)),
          c.maintenant,
        ]}
        navigateur={navigateur.donnees.flatMap((m) => {
          const pos = position(m.ville);
          return pos ? [{ ...pos, pas: pasDe(m.le) }] : [];
        })}
        arcs={arcs}
        couloirs={incidents.donnees.map((i) => ({
          libelle: libelleCouloir(i, t),
          bandes: [
            {
              de: surFrise(i.debut),
              a: surFrise(i.fin),
              teinte: i.nature === "absence" ? "vide" : "degrade",
            },
          ],
        }))}
        marques={[
          ...publications.donnees.map((p) => ({
            pas: surFrise(p.creeLe),
            nature: "publication" as const,
          })),
          ...navigateur.donnees.map((m) => ({
            pas: surFrise(m.le),
            nature: "navigateur" as const,
          })),
        ]}
        largeur={LARGEUR}
        hauteur={HAUTEUR}
        fond={
          <svg
            viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
            className={carte.fond}
            aria-hidden="true"
          >
            {PAYS_AFRIQUE.map(({ iso, d }, i) => (
              <path
                key={`${iso}-${i}`}
                d={d}
                data-sondes={paysSondes.has(iso) || undefined}
              />
            ))}
          </svg>
        }
        entetePanneau={
          <>
            <h1 className={styles.titre}>{t.site.devise}</h1>
            <p className={styles.resume}>
              {c.resume(
                developpeurs.length,
                new Set(developpeurs.map((s) => s.ville)).size,
                new Set(developpeurs.map((s) => s.pays)).size,
              )}
            </p>
          </>
        }
        panneau={
          <>
            <section aria-labelledby="en-ce-moment" className={styles.section}>
              <div className={styles.titreSection}>
                <h2 id="en-ce-moment">{c.enCeMoment}</h2>
                <Link href={lien(langue, "/services")}>
                  {c.lesMesures(verdicts.donnees.length)}
                </Link>
              </div>
              {degrades.length === 0 && (
                <p className={styles.vide}>
                  {c.aucuneDegradation(verdicts.donnees.length)}
                </p>
              )}
              {degrades.map((v) => {
                const vide = v.observation.etat === "pas-de-donnee";
                const solutions = publications.donnees.filter(
                  (p) => p.cible === v.cible.cle && p.type === "contournement",
                ).length;
                const fiche = lien(langue, `/services/${v.cible.cle}`);
                return (
                  <article key={v.cible.cle} className={styles.incident}>
                    <div className={styles.ligneTitre}>
                      <span className={styles.nomService}>{v.cible.nom}</span>
                      {!vide && v.observation.depuis && (
                        <span className={styles.petit}>
                          {t.services.depuis(v.observation.depuis)}
                        </span>
                      )}
                    </div>
                    <div className={styles.rangee}>
                      <Etiquette nature="observe" teinte={teinte(v)}>
                        {t.verdict.observe}
                      </Etiquette>
                      <span>
                        {vide
                          ? t.services.sansDonnee(v.observation.depuis)
                          : libelleObservation(v.observation.depuis, t)}
                      </span>
                    </div>
                    <div className={styles.rangee}>
                      <Etiquette nature="hypothese">
                        {v.hypothese
                          ? t.verdict.hypothese
                          : t.verdict.indetermine}
                      </Etiquette>
                      <span className={styles.corps}>
                        {vide
                          ? t.services.sansHypothese
                          : texteHypothese(v, t.verdict)}
                      </span>
                    </div>
                    <span className={styles.petit}>
                      {vide
                        ? c.aucuneMesure
                        : c.compteurs(
                            v.preuves.sondesTouchees,
                            v.preuves.sondesEpargnees,
                            v.preuves.mesures,
                            v.preuves.sondesEnRodage,
                          )}
                    </span>
                    <div className={styles.liens}>
                      <a
                        href={`#service-${v.cible.cle}`}
                        className={styles.montrer}
                      >
                        {c.montrer}
                      </a>
                      {!vide && (
                        <Link href={fiche}>{t.services.diagnostic}</Link>
                      )}
                      {solutions > 0 && (
                        <Link href={`${fiche}#solutions`}>
                          {t.services.solutions(solutions)}
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>

            <section aria-labelledby="communaute" className={styles.section}>
              <div className={styles.titreSection}>
                <h2 id="communaute">{c.communaute}</h2>
                <Link href={lien(langue, "/echanges")}>{c.tousEchanges}</Link>
              </div>
              {publicationsTriees.map((p) => (
                <Link
                  key={p.id}
                  href={lien(langue, `/echanges/${p.id}`)}
                  className={styles.publication}
                >
                  <span className={styles.ligneMeta}>
                    <span className={styles.genre} data-type={p.type}>
                      {p.type === "demande"
                        ? t.publication.demande
                        : t.publication.solution}
                    </span>
                    <span className={styles.cible}>
                      {t.services.nomCourt(p.cible)}
                    </span>
                    <span className={styles.petit}>
                      · {t.publication.ilYA(minutesEntre(p.creeLe, maintenant))}
                    </span>
                  </span>
                  <span className={styles.titrePublication}>{p.titre}</span>
                  <span className={styles.petit}>
                    {contexte(p, t, maintenant)}
                  </span>
                  <span
                    className={styles.statut}
                    data-statut={statut(p, t).cle}
                  >
                    {statut(p, t).texte}
                  </span>
                </Link>
              ))}
            </section>

            <section className={styles.appel}>
              <span className={styles.gras}>{c.lentTitre}</span>
              <span className={styles.corps}>{c.lentTexte}</span>
              <Link href={lien(langue, "/mesurer")} className={styles.bouton}>
                {t.navigation.mesurerChezMoi}
              </Link>
            </section>
            <p className={styles.note}>
              {c.note}{" "}
              <Link href={lien(langue, "/methodologie")}>
                {t.verdict.lienMethode}
              </Link>
            </p>
          </>
        }
        textes={{
          tousServices: c.tousServices,
          serviceAffiche: c.serviceAffiche,
          afrique: c.afrique,
          niveau: c.niveau,
          calques: c.calques,
          mesuresNavigateur: c.mesuresNavigateur,
          entraide: c.entraide,
          affichage: c.affichage,
          vueCarte: c.vueCarte,
          vueListe: c.vueListe,
          zoomer: c.zoomer,
          dezoomer: c.dezoomer,
          legende: c.legende,
          legendeNormal: c.legendeNormal,
          legendeDegrade: c.legendeDegrade,
          legendeRodage: c.legendeRodage,
          legendeRepere: c.legendeRepere,
          legendeLien: c.legendeLien,
          legendePulse: c.legendePulse,
          repere: c.repere,
          description: c.description(
            developpeurs.length,
            new Set(developpeurs.map((s) => s.ville)).size,
          ),
          listeDetail: c.listeDetail,
          listeTitre: c.listeTitre("{heure}"),
          etats: {
            normal: c.etatSonde("normal"),
            degrade: c.etatSonde("degrade"),
            "pas-de-donnee": c.etatSonde("pas-de-donnee"),
            absente: c.etatSonde("absente"),
            rodage: c.etatSonde("rodage"),
          },
          lire: c.lire,
          pause: c.pause,
          enDirect: c.enDirect,
          sousDirect: c.sousDirect,
          sousRelecture: heures.map((h) => c.sousRelecture(h)),
          vitesse: [1, 2, 4].map((n) => c.vitesse(n)),
          heureAffichee: c.heureAffichee,
          periode: c.periode,
          h24: c.h24,
          sondesEntraide: c.sondesEntraide,
          publication: c.publication,
          mesureNavigateur: c.mesureNavigateur,
          fermer: c.fermer,
          ville: c.ville,
          sondes: c.sondes,
          repereHorsCalcul: c.repereHorsCalcul,
        }}
      />
    </main>
  );
}

const isoA = (fin: number, heuresAvant: number) =>
  new Date(fin - heuresAvant * HEURE_MS).toISOString();

/** Les sondes groupees par ville, avec leur position sur la carte. */
function regrouper(
  sondes: Sonde[],
  langue: Langue,
  c: Dictionnaire["carte"],
): VilleCarte[] {
  const villes = new Map<string, VilleCarte>();
  for (const s of sondes) {
    const coordonnees = VILLES[s.ville];
    const position = coordonnees
      ? projeter(coordonnees.lat, coordonnees.lon)
      : null;
    const ville = villes.get(s.ville) ?? {
      nom: s.ville,
      pays: nomPays(langue, s.pays),
      x: position?.x ?? null,
      y: position?.y ?? null,
      sondes: [],
    };
    ville.sondes.push({
      id: s.pseudonyme,
      libelle: c.sonde(s.operateur, s.numero),
      repere: s.type === "repere",
      enRodage: s.enRodage,
      etats: s.etats as Record<string, EtatSonde[]>,
    });
    villes.set(s.ville, ville);
  }
  return [...villes.values()];
}

function libelleCouloir(i: Incident, t: Dictionnaire): string {
  const c = t.carte;
  const sonde = i.sondes[0];
  if (i.cible === null)
    return c.laneLocale(
      sonde?.ville ?? "",
      sonde ? `${sonde.operateur.replace(/^\D*\s/, "")}·${sonde.numero}` : "",
    );
  const nom = t.services.nomCourt(i.cible);
  if (i.nature === "absence") return c.laneAbsence(nom);
  if (i.cause === "operateur" && sonde)
    return c.laneService(nom, t.publication.operateur(sonde.operateur));
  return c.laneIndeterminee(nom);
}

function libelleObservation(depuis: string | null, t: Dictionnaire): string {
  return depuis ? t.verdict.degradationDepuis(depuis) : t.verdict.degradation;
}

/** D'abord ce qui date d'un incident en cours, puis les plus confirmees et les plus votees. */
function trierPourAccueil(publications: Publication[]): Publication[] {
  const score = (p: Publication) =>
    (p.contexte?.enCours ? 1000 : 0) +
    (p.type === "contournement" ? p.confirmations.length * 10 + p.votes : 5);
  return [...publications].sort((a, b) => score(b) - score(a));
}
