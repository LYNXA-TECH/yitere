import { PAYS_AFRIQUE } from "@/lib/geo/afrique";
import { HAUTEUR, LARGEUR } from "@/lib/geo/projection";
import styles from "./CarteAfrique.module.css";

export type PointVille = {
  nom: string;
  x: number;
  y: number;
  sondes: number;
  /** Vrai quand un verdict en cours cite cette ville. */
  citee: boolean;
};

type Props = {
  villes: PointVille[];
  /** Codes ISO des pays qui ont au moins une sonde. */
  paysAvecSondes: ReadonlySet<string>;
  /** Phrase lue par un lecteur d'ecran a la place du dessin. */
  description: string;
};

/**
 * Carte dessinee sur le serveur, en SVG : aucun JavaScript a telecharger.
 * La vue Liste de la page porte les memes informations sous forme de tableau.
 */
export function CarteAfrique({ villes, paysAvecSondes, description }: Props) {
  return (
    <svg
      className={styles.carte}
      viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
      role="img"
      aria-label={description}
    >
      <g className={styles.pays}>
        {PAYS_AFRIQUE.map(({ iso, d }, i) => (
          <path
            key={`${iso}-${i}`}
            d={d}
            data-sondes={paysAvecSondes.has(iso) || undefined}
          />
        ))}
      </g>
      {villes.map((v) => (
        <g
          key={v.nom}
          className={styles.ville}
          data-citee={v.citee || undefined}
        >
          <title>{v.nom}</title>
          {v.citee && (
            <circle className={styles.anneau} cx={v.x} cy={v.y} r={24} />
          )}
          <circle className={styles.point} cx={v.x} cy={v.y} r={15} />
          <text x={v.x} y={v.y} dy="0.35em" textAnchor="middle">
            {v.sondes}
          </text>
        </g>
      ))}
    </svg>
  );
}
