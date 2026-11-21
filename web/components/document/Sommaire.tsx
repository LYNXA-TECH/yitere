import styles from "./sommaire.module.css";

/**
 * Sommaire repliable d'une longue page. Element natif details : il s'ouvre au clavier et au
 * toucher sans JavaScript, et les lecteurs d'ecran l'annoncent comme un bouton depliable.
 */
export function Sommaire({
  entrees,
  titre = "Sommaire",
}: {
  entrees: { id: string; texte: string }[];
  titre?: string;
}) {
  if (entrees.length < 3) return null;
  return (
    <details className={styles.sommaire}>
      <summary>
        {titre}
        <span className={styles.compte}>{entrees.length} parties</span>
      </summary>
      <ul>
        {entrees.map((e) => (
          <li key={e.id}>
            <a href={`#${e.id}`}>{e.texte}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}
