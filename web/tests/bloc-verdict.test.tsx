import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BlocVerdict } from "../components/BlocVerdict";
import type { Verdict } from "../lib/donnees/types";

const npm: Verdict = {
  cible: { cle: "npm", nom: "registry.npmjs.org" },
  observation: { etat: "degrade", depuis: "2026-11-03T14:10:00Z" },
  hypothese: { cause: "operateur", operateur: "Opérateur A", ville: "Conakry" },
  preuves: {
    sondesTouchees: 2,
    sondesEpargnees: 2,
    sondesEnRodage: 1,
    mesures: 24,
    periode: "dernière heure",
    repere: "normal",
  },
};

const docker: Verdict = {
  ...npm,
  cible: { cle: "docker", nom: "registry-1.docker.io" },
  observation: { etat: "degrade", depuis: "2026-11-03T15:00:00Z" },
  hypothese: null,
  preuves: { ...npm.preuves, sondesTouchees: 1, sondesEpargnees: 3 },
};

const rendu = (v: Verdict) => renderToStaticMarkup(<BlocVerdict verdict={v} />);

describe("BlocVerdict", () => {
  it("sépare ce qui est observé de l'hypothèse", () => {
    const html = rendu(npm);
    expect(html).toContain("Observé");
    expect(html).toContain("Dégradation depuis 14:10 GMT");
    expect(html).toContain("Hypothèse");
    expect(html).toContain("Cause probable : Opérateur A à Conakry");
  });

  it("dit « indéterminé » et ne propose aucune cause quand les données ne suffisent pas", () => {
    const html = rendu(docker);
    expect(html).toContain("Indéterminé");
    expect(html).toContain("Cause indéterminée : données insuffisantes");
    expect(html).not.toContain("Cause probable");
  });

  it("indique sur combien de sondes et de mesures, et sur quelle période, le verdict repose", () => {
    const html = rendu(npm);
    expect(html).toContain("2 sondes touchées, 2 épargnées");
    expect(html).toContain("24 mesures, dernière heure");
    expect(html).toContain("1 sonde en rodage, non comptée");
  });

  it("accorde au singulier", () => {
    expect(rendu(docker)).toContain("1 sonde touchée, 3 épargnées");
  });

  it("présente le repère de Madrid comme hors calcul", () => {
    expect(rendu(npm)).toContain("Repère de Madrid (hors calcul) : normal");
  });

  it("rappelle qu'une hypothèse ne prouve pas la cause", () => {
    expect(rendu(npm)).toContain("Elle oriente, elle ne prouve pas.");
  });

  it("n'affiche ni hypothèse ni preuves de dégradation quand tout est normal", () => {
    const html = rendu({
      ...npm,
      observation: { etat: "normal", depuis: null },
      hypothese: null,
      preuves: { ...npm.preuves, sondesTouchees: 0, sondesEpargnees: 4 },
    });
    expect(html).toContain("Aucune dégradation observée");
    expect(html).not.toContain("Hypothèse");
    expect(html).not.toContain("Indéterminé");
  });
});
