import type { Metadata } from "next";
import Link from "next/link";
import { Etiquette } from "@/components/Etiquette";
import { Pastille } from "@/components/Pastille";
import {
  estService,
  lireCibles,
  lireMesuresNavigateur,
  lireResumes,
  lireSondes,
  lireVerdicts,
} from "@/lib/donnees";
import type { Cible, ResumeService, Verdict } from "@/lib/donnees/types";
import {
  detailValeur,
  libelleEtat,
  libelleSansDonnee,
  texteHypothese,
  teinte,
  valeur,
} from "@/lib/affichage/verdicts";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";
import { lien } from "@/lib/navigation";
import styles from "./services.module.css";

type Props = { params: Promise<{ langue: string }> };

// Regeneree au plus tot toutes les 60 s (FRAICHEUR_SECONDES ; Next.js exige ici un nombre ecrit en clair).
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: dictionnaire(await langueDe(params)).services.titre };
}

type Ligne = { cible: Cible; verdict: Verdict; resume: ResumeService };

export default async function Services({ params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire(langue);
  const s = t.services;
  const [cibles, verdicts, resumes, sondes, navigateur] = await Promise.all([
    lireCibles(),
    lireVerdicts(),
    lireResumes(),
    lireSondes(),
    lireMesuresNavigateur(),
  ]);
  const heure = verdicts.lueLe ?? new Date().toISOString();

  // L'ordre de la maquette : d'abord ce qui demande l'attention, puis le reste.
  const lignes: Ligne[] = cibles.donnees.filter(estService).flatMap((cible) => {
    const verdict = verdicts.donnees.find((v) => v.cible.cle === cible.cle);
    const resume = resumes.donnees.find((r) => r.cle === cible.cle);
    return verdict && resume ? [{ cible, verdict, resume }] : [];
  });
  const rang = (l: Ligne) =>
    ({ degrade: 0, "pas-de-donnee": 1, normal: 2 })[l.verdict.observation.etat];
  const triees = [...lignes].sort((a, b) => rang(a) - rang(b));
  const alertes = triees.filter((l) => l.verdict.observation.etat !== "normal");
  const nombreDe = (etat: Verdict["observation"]["etat"]) =>
    lignes.filter((l) => l.verdict.observation.etat === etat).length;
  const hotes = new Set(lignes.map((l) => new URL(l.cible.url).host)).size;
  const references = cibles.donnees.length - lignes.length;
  const developpeurs = sondes.donnees.filter((x) => x.type === "dev");
  const reperes = sondes.donnees.filter((x) => x.type === "repere").length;
  const rodage = developpeurs.filter((x) => x.enRodage).length;
  const villesNavigateur = [
    ...new Set(navigateur.donnees.map((m) => m.ville)),
  ].join(", ");
  const fiche = (cle: string) => lien(langue, `/services/${cle}`);

  return (
    <main className={styles.page}>
      <div className={styles.entete}>
        <h1>{s.titre}</h1>
        <p>{s.intro(hotes, lignes.length, references, heure)}</p>
      </div>

      <section aria-labelledby="attention" className={styles.section}>
        <div className={styles.titreSection}>
          <h2 id="attention">{s.attention}</h2>
          <span className={styles.discret}>
            {s.decompte(
              nombreDe("degrade"),
              nombreDe("normal"),
              nombreDe("pas-de-donnee"),
            )}
          </span>
        </div>
        <div className={styles.alertes}>
          {alertes.map(({ cible, verdict: v, resume: r }) => {
            const vide = v.observation.etat === "pas-de-donnee";
            return (
              <article
                key={cible.cle}
                className={styles.alerte}
                data-teinte={teinte(v)}
              >
                <div className={styles.alerteTitre}>
                  <span className={styles.nomService}>{cible.nom}</span>
                  {!vide && v.observation.depuis && (
                    <span className={styles.discret}>
                      {s.depuis(v.observation.depuis)}
                    </span>
                  )}
                </div>
                <div className={styles.rangee}>
                  <Etiquette nature="observe" teinte={teinte(v)}>
                    {t.verdict.observe}
                  </Etiquette>
                  <span>
                    {vide
                      ? libelleSansDonnee(v, s)
                      : s.plusLentes(
                          v.preuves.sondesTouchees,
                          valeur(r.valeur ?? 0, r.unite, s),
                        )}
                  </span>
                </div>
                <div className={styles.rangee}>
                  <Etiquette nature="hypothese">
                    {v.hypothese ? t.verdict.hypothese : t.verdict.indetermine}
                  </Etiquette>
                  <span className={styles.corps}>
                    {vide ? s.sansHypothese : texteHypothese(v, t.verdict)}
                  </span>
                </div>
                <span className={styles.petit}>
                  {vide
                    ? v.preuves.sondesEnRodage > 0
                      ? t.fiche.observationRodage(v.preuves.sondesEnRodage)
                      : s.detailSansDonnee(v.observation.depuis)
                    : s.detailAlerte(
                        v.preuves.sondesTouchees,
                        v.preuves.sondesEpargnees,
                        s.repere(v.preuves.repere),
                        v.preuves.mesures,
                      )}
                </span>
                {!vide && (
                  <div className={styles.liens}>
                    <Link href={fiche(cible.cle)}>{s.diagnostic}</Link>
                    {r.solutions > 0 && (
                      <Link href={`${fiche(cible.cle)}#solutions`}>
                        {s.solutions(r.solutions)}
                      </Link>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="toutes"
        className={`${styles.section} ${styles.toutes}`}
      >
        <div className={styles.titreSection}>
          <div>
            <h2 id="toutes">{s.toutes}</h2>
            <span className={styles.discret}>{s.toutesDetail}</span>
          </div>
          {/* Trois boutons radio : le choix se fait sans JavaScript, le CSS montre le bon tableau. */}
          <fieldset className={styles.choix}>
            <legend className={styles.masque}>{s.typeSonde}</legend>
            <label>
              <input type="radio" name="type" value="dev" defaultChecked />
              {s.typeDeveloppeur(developpeurs.length)}
            </label>
            <label>
              <input type="radio" name="type" value="repere" />
              {s.typeRepere(reperes)}
            </label>
            <label>
              <input type="radio" name="type" value="navigateur" />
              {s.typeNavigateur(navigateur.donnees.length)}
            </label>
          </fieldset>
        </div>

        {(["dev", "repere"] as const).map((type) => (
          <div key={type} data-type={type} className={styles.panneau}>
            <div className={styles.tableau}>
              <table>
                <caption>
                  {type === "dev"
                    ? s.legendeDeveloppeur(rodage)
                    : s.legendeRepere}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{s.colService}</th>
                    <th scope="col">{s.colEtat(heure)}</th>
                    <th scope="col" className={styles.nombre}>
                      {s.colPremierOctet}
                    </th>
                    <th scope="col" className={styles.nombre}>
                      {s.colDebit}
                    </th>
                    <th scope="col" className={styles.nombre}>
                      {s.colDisponibilite}
                    </th>
                    <th scope="col" className={styles.nombre}>
                      {s.colPassages}
                    </th>
                    <th scope="col">{s.colEchanges}</th>
                  </tr>
                </thead>
                <tbody>
                  {triees.map(({ cible, verdict: v, resume: r }) => {
                    const repere = type === "repere";
                    const mesure = repere ? r.repere : r.valeur;
                    const texte =
                      mesure === null
                        ? repere
                          ? s.exclu
                          : s.pasDeDonnee
                        : valeur(mesure, r.unite, s);
                    return (
                      <tr key={cible.cle}>
                        <th scope="row">
                          <Link
                            href={fiche(cible.cle)}
                            className={styles.nomService}
                          >
                            {cible.nom}
                          </Link>
                          <br />
                          <span className={styles.petit}>
                            {ligneFamille(cible, s)}
                          </span>
                        </th>
                        <td>
                          {repere ? (
                            <Pastille teinte="vide">{s.etatRepere}</Pastille>
                          ) : (
                            <Pastille
                              teinte={teinte(v)}
                              creuse={
                                v.observation.etat === "degrade" && !v.hypothese
                              }
                            >
                              {libelleEtat(v, s)}
                            </Pastille>
                          )}
                        </td>
                        <td className={styles.nombre}>
                          {r.unite === "ms" ? texte : "—"}
                          <br />
                          <span className={styles.sousNombre}>
                            {repere
                              ? s.madrid
                              : detailValeur(r, v, s, cible.cadenceMinutes)}
                          </span>
                        </td>
                        <td className={styles.nombre}>
                          {r.unite === "mbps" ? texte : "—"}
                        </td>
                        <td className={styles.nombre}>
                          {repere || r.disponibilite === null
                            ? "—"
                            : s.pourcent(r.disponibilite)}
                        </td>
                        <td className={styles.nombre}>
                          {repere ? "—" : s.entier(r.passages)}
                        </td>
                        <td className={styles.communaute}>
                          {s.echanges(r.solutions, r.demandes)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className={styles.listeMobile}>
              {triees.map(({ cible, verdict: v, resume: r }) => {
                const repere = type === "repere";
                const mesure = repere ? r.repere : r.valeur;
                const texte =
                  mesure === null ? s.pasDeDonnee : valeur(mesure, r.unite, s);
                return (
                  <li key={cible.cle}>
                    <Link href={fiche(cible.cle)}>
                      <span className={styles.nomService}>{cible.nom}</span>
                      <span
                        className={styles.etatMobile}
                        data-teinte={repere ? "vide" : teinte(v)}
                      >
                        {repere ? s.etatRepere : libelleEtat(v, s)}
                      </span>
                      <span className={styles.petit}>
                        {[
                          r.unite === "ms"
                            ? s.mobilePremierOctet(texte)
                            : s.mobileDebit(texte),
                          !repere && r.disponibilite !== null
                            ? s.mobileDisponibilite(s.pourcent(r.disponibilite))
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div
          data-type="navigateur"
          className={`${styles.panneau} ${styles.navigateur}`}
        >
          <span className={styles.gras}>{s.navigateurTitre}</span>
          <span className={styles.corps}>
            {s.navigateurTexte(navigateur.donnees.length, villesNavigateur)}
          </span>
          <Link href={lien(langue, "/mesurer")}>{s.faireMaMesure}</Link>
        </div>

        <p className={styles.petit}>
          {s.noteReferences}{" "}
          <Link href={lien(langue, "/methodologie")} className="lien-tactile">
            {s.commentCestCalcule}
          </Link>
        </p>
      </section>

      <section className={styles.appel}>
        <div>
          <span className={styles.appelTitre}>{s.lentTitre}</span>
          <span className={styles.corps}>{s.lentTexte}</span>
        </div>
        <Link href={lien(langue, "/mesurer")} className={styles.bouton}>
          {t.navigation.mesurerChezMoi}
        </Link>
        <Link href={lien(langue, "/echanges")} className={styles.gras}>
          {s.voirEchanges}
        </Link>
      </section>
    </main>
  );
}

function ligneFamille(
  c: Cible,
  s: ReturnType<typeof dictionnaire>["services"],
): string {
  return [
    s.famille(c.famille),
    s.cadence(c.cadenceMinutes),
    c.codeAttendu !== 200 ? s.codeAttendu(c.codeAttendu) : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
