import type { Metadata } from "next";
import { MentionFrancais } from "@/components/MentionFrancais";
import { Mesure, type LigneMesure } from "@/components/mesurer/Mesure";
import styles from "@/components/mesurer/mesurer.module.css";
import { valeur } from "@/lib/affichage/verdicts";
import {
  estService,
  lireCibles,
  lireResumes,
  lireVerdicts,
} from "@/lib/donnees";
import { dictionnaire } from "@/lib/i18n";
import { langueDe } from "@/lib/i18n/params";

type Props = { params: Promise<{ langue: string }> };

export const revalidate = 60;

export const metadata: Metadata = { title: "Mesurer depuis chez moi" };

/** Le registre Docker exige une authentification : le navigateur ne peut pas le mesurer proprement. */
const NON_MESURABLES = new Set(["docker"]);

/** Page en francais seulement (decision 0002, D13). */
export default async function Mesurer({ params }: Props) {
  const langue = await langueDe(params);
  const t = dictionnaire("fr");
  const [cibles, resumes, verdicts] = await Promise.all([
    lireCibles(),
    lireResumes(),
    lireVerdicts(),
  ]);
  const lignes: LigneMesure[] = cibles.donnees
    .filter((c) => estService(c) && !NON_MESURABLES.has(c.cle))
    .map((c) => {
      const r = resumes.donnees.find((x) => x.cle === c.cle);
      const v = verdicts.donnees.find((x) => x.cible.cle === c.cle);
      const degrade = v?.observation.etat === "degrade";
      const sondes =
        !r || r.valeur === null || v?.observation.etat === "pas-de-donnee"
          ? `Sondes : ${t.services.sansDonnee(v?.observation.depuis ?? null).toLowerCase()}`
          : `Sondes : ${valeur(r.valeur, r.unite, t.services)}, ${degrade ? "dégradé" : "normal"}`;
      return {
        cle: c.cle,
        nom: c.nom,
        url: c.url,
        objet: c.methode === "objet",
        taille: c.tailleAttendue,
        sondes,
        sondesDegradees: degrade,
      };
    });

  return (
    <main className={styles.page}>
      <MentionFrancais langue={langue} />
      <div lang="fr">
        <span className={styles.surtitre}>
          Mesure navigateur · une dizaine de secondes · moins de 1 Mo
        </span>
        <h1>Mesurer depuis chez moi</h1>
        <p className={styles.chapeau}>
          Votre navigateur chronomètre une petite requête vers {lignes.length}{" "}
          services, puis la compare avec ce que voient les sondes installées.
        </p>
      </div>
      <div lang="fr">
        <Mesure lignes={lignes} />
      </div>
    </main>
  );
}
