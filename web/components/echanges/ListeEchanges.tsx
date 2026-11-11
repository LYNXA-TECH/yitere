"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import styles from "./echanges.module.css";

/** Une publication deja mise en forme sur le serveur : le client ne fait que filtrer et trier. */
export type CarteEchange = {
  id: string;
  type: "contournement" | "demande";
  cible: string;
  pays: string;
  operateurs: string[];
  etiquettes: string[];
  enCours: boolean;
  votes: number;
  confirmations: number;
  creeLe: string;
  confirmee: boolean;
  genre: string;
  nomCible: string;
  titre: string;
  contenu: string;
  contexte: string;
  statut: string;
  statutCle: "confirmee" | "aucune" | "attente" | "repondue";
  signature: string;
  href: string;
};

type Option = { valeur: string; libelle: string };

type Props = {
  cartes: CarteEchange[];
  services: Option[];
  pays: Option[];
  operateurs: Option[];
  etiquettes: string[];
  lienPublier: string;
  /** Colonne de droite (incidents, demandes en attente, regle), rendue sur le serveur. */
  encadres: ReactNode;
};

type Tri = "pertinence" | "recent" | "confirme";

const score: Record<Tri, (c: CarteEchange) => number> = {
  pertinence: (c) =>
    (c.enCours ? 1000 : 0) +
    c.confirmations * 10 +
    c.votes +
    Date.parse(c.creeLe) / 3.6e8,
  recent: (c) => Date.parse(c.creeLe),
  confirme: (c) => c.confirmations * 100 + c.votes,
};

/** Page en francais seulement (decision 0002, D13) : les textes sont ecrits ici. */
export function ListeEchanges({
  cartes,
  services,
  pays,
  operateurs,
  etiquettes,
  lienPublier,
  encadres,
}: Props) {
  const [type, setType] = useState<"tout" | CarteEchange["type"]>("tout");
  const [service, setService] = useState("tous");
  const [unPays, setPays] = useState("tous");
  const [operateur, setOperateur] = useState("tous");
  const [tri, setTri] = useState<Tri>("pertinence");
  const [etiquette, setEtiquette] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const visibles = cartes
    .filter(
      (c) =>
        (type === "tout" || c.type === type) &&
        (service === "tous" || c.cible === service) &&
        (unPays === "tous" || c.pays === unPays) &&
        (operateur === "tous" || c.operateurs.includes(operateur)) &&
        (!etiquette || c.etiquettes.includes(etiquette)) &&
        (!enCours || c.enCours),
    )
    .sort((a, b) => score[tri](b) - score[tri](a));
  const filtre =
    type !== "tout" ||
    service !== "tous" ||
    unPays !== "tous" ||
    operateur !== "tous" ||
    etiquette ||
    enCours;
  const effacer = () => {
    setType("tout");
    setService("tous");
    setPays("tous");
    setOperateur("tous");
    setEtiquette(null);
    setEnCours(false);
  };

  return (
    <>
      <section aria-label="Filtres" className={styles.filtres}>
        <div className={styles.ligneFiltres}>
          <div
            role="group"
            aria-label="Type de publication"
            className={styles.onglets}
          >
            {(
              [
                ["tout", "Tout"],
                ["contournement", "Solutions"],
                ["demande", "Demandes"],
              ] as const
            ).map(([valeur, libelle]) => (
              <button
                key={valeur}
                type="button"
                aria-pressed={type === valeur}
                onClick={() => setType(valeur)}
              >
                {libelle}
              </button>
            ))}
          </div>
          <Choix
            id="f-service"
            libelle="Service"
            valeur={service}
            tous="Tous les services"
            options={services}
            changer={setService}
          />
          <Choix
            id="f-pays"
            libelle="Pays"
            valeur={unPays}
            tous="Tous les pays"
            options={pays}
            changer={setPays}
          />
          <Choix
            id="f-operateur"
            libelle="Opérateur"
            valeur={operateur}
            tous="Tous les opérateurs"
            options={operateurs}
            changer={setOperateur}
          />
          <div className={styles.champ}>
            <label htmlFor="f-tri">Trier par</label>
            <select
              id="f-tri"
              value={tri}
              onChange={(e) => setTri(e.target.value as Tri)}
            >
              <option value="pertinence">
                Pertinence (incidents en cours d&apos;abord)
              </option>
              <option value="recent">Plus récent</option>
              <option value="confirme">Plus confirmé</option>
            </select>
          </div>
        </div>
        <div className={styles.ligneEtiquettes}>
          <span className={styles.libelleEtiquettes}>Technologie</span>
          {etiquettes.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={etiquette === e}
              onClick={() => setEtiquette(etiquette === e ? null : e)}
              className={styles.puce}
            >
              {e}
            </button>
          ))}
          <span className={styles.ressort} />
          <label className={styles.case}>
            <input
              type="checkbox"
              checked={enCours}
              onChange={(e) => setEnCours(e.target.checked)}
            />
            Seulement pendant un incident en cours
          </label>
        </div>
      </section>

      <div className={styles.colonnes}>
        <section aria-label="Publications" className={styles.publications}>
          <span role="status" className={styles.discret}>
            {visibles.length} publication{visibles.length > 1 ? "s" : ""}
            {filtre ? " avec ces filtres" : ""}
          </span>
          {visibles.map((c) => (
            <article
              key={c.id}
              className={styles.carte}
              data-confirmee={c.confirmee || undefined}
            >
              <div className={styles.votes}>
                <span>{c.votes}</span>
                <span>utile</span>
              </div>
              <div className={styles.corpsCarte}>
                <span className={styles.badges}>
                  <span className={styles.genre} data-type={c.type}>
                    {c.genre}
                  </span>
                  {c.confirmee && (
                    <span className={styles.confirmee}>
                      Confirmée par la communauté
                    </span>
                  )}
                  <span className={styles.cible}>{c.nomCible}</span>
                  {c.etiquettes.map((e) => (
                    <span key={e} className={styles.etiquette}>
                      {e}
                    </span>
                  ))}
                </span>
                <Link href={c.href} className={styles.titre}>
                  {c.titre}
                </Link>
                {c.contenu && <span className={styles.texte}>{c.contenu}</span>}
                <span
                  className={styles.contexte}
                  data-incident={
                    c.contexte.includes("dégradation") || undefined
                  }
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  {c.contexte}
                </span>
                <span className={styles.statut} data-statut={c.statutCle}>
                  {c.statut}
                </span>
                <span className={styles.petit}>{c.signature}</span>
              </div>
            </article>
          ))}
          {visibles.length === 0 && (
            <div className={styles.vide}>
              <span className={styles.gras}>
                Rien ne correspond à ces filtres
              </span>
              <span className={styles.discret}>
                Aucune publication pour cette combinaison. Si vous rencontrez le
                problème, posez la question : une sonde de la ville concernée
                pourra y répondre.
              </span>
              <div className={styles.boutons}>
                <button
                  type="button"
                  onClick={effacer}
                  className={styles.secondaire}
                >
                  Effacer les filtres
                </button>
                <Link href={lienPublier} className={styles.principal}>
                  Poser la question
                </Link>
              </div>
            </div>
          )}
        </section>
        {encadres}
      </div>
    </>
  );
}

function Choix({
  id,
  libelle,
  valeur,
  tous,
  options,
  changer,
}: {
  id: string;
  libelle: string;
  valeur: string;
  tous: string;
  options: Option[];
  changer: (v: string) => void;
}) {
  return (
    <div className={styles.champ}>
      <label htmlFor={id}>{libelle}</label>
      <select id={id} value={valeur} onChange={(e) => changer(e.target.value)}>
        <option value="tous">{tous}</option>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </div>
  );
}
