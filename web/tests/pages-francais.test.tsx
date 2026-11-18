import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Confidentialite from "@/app/[langue]/confidentialite/page";
import Contribuer from "@/app/[langue]/contribuer/page";
import HebergerSonde from "@/app/[langue]/contribuer/sonde/page";
import Donnees from "@/app/[langue]/donnees/page";
import DetailPublication from "@/app/[langue]/echanges/[id]/page";
import Echanges from "@/app/[langue]/echanges/page";
import Mesurer from "@/app/[langue]/mesurer/page";
import Methodologie from "@/app/[langue]/methodologie/page";
import MonEspace from "@/app/[langue]/moi/page";
import Publier from "@/app/[langue]/publier/page";

const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
const PAGES = {
  Echanges,
  Methodologie,
  Contribuer,
  HebergerSonde,
  Mesurer,
  Publier,
  MonEspace,
  Donnees,
  Confidentialite,
};

describe("pages en français seulement (décision 0002, D13)", () => {
  for (const [nom, Page] of Object.entries(PAGES)) {
    it(`${nom} prévient le visiteur anglophone, dans sa langue`, async () => {
      const html = renderToStaticMarkup(
        (await Page(params({ langue: "en" })))!,
      );
      expect(html).toContain("This page is only available in French for now.");
      expect(html).toContain('lang="fr"');
    });
  }

  it("ne préviennent rien en français", async () => {
    expect(
      renderToStaticMarkup(await Echanges(params({ langue: "fr" }))),
    ).not.toContain("only available in French");
  });
});

describe("contenu", () => {
  it("la méthodologie est lue dans docs/methodologie.md", async () => {
    const html = renderToStaticMarkup(
      await Methodologie(params({ langue: "fr" })),
    );
    expect(html).toContain("<h2>1. Ce que nous mesurons</h2>");
    expect(html).toContain("<table>");
  });

  it("une publication montre le contexte mesuré et qui l'a confirmée", async () => {
    const html = renderToStaticMarkup(
      await DetailPublication(params({ langue: "fr", id: "p1" })),
    );
    expect(html).toContain(
      "Ce que les sondes observaient quand elle a été publiée",
    );
    expect(html).toContain("A marché pour 5 personnes");
    expect(html).toContain("2 sur 2 dégradées");
  });

  it("la mesure navigateur laisse de côté le registre Docker", async () => {
    const html = renderToStaticMarkup(await Mesurer(params({ langue: "fr" })));
    expect(html).toContain("registry.npmjs.org");
    expect(html).not.toContain("registry-1.docker.io</span>");
  });

  it("contribuer montre les villes où une sonde manque", async () => {
    const html = renderToStaticMarkup(
      await Contribuer(params({ langue: "fr" })),
    );
    expect(html).toContain("Héberger la première sonde à Dakar");
  });

  it("la page sonde décrit la vraie commande, pas un paquet npm qui n'existe pas", async () => {
    const html = renderToStaticMarkup(
      await HebergerSonde(params({ langue: "fr" })),
    );
    expect(html).toContain("node sonde.js");
    expect(html).not.toContain("npx yitere-sonde");
  });

  it("la page sonde donne le guide complet : passage toutes les dix minutes, verification, depannage", async () => {
    const html = renderToStaticMarkup(
      await HebergerSonde(params({ langue: "fr" })),
    );
    // Linux : la cle dans un fichier, puis la ligne de cron.
    expect(html).toContain("chmod 600 cle");
    expect(html).toContain("*/10 * * * * cd $HOME/yitere");
    // Windows : le fichier de lancement, puis la tache programmee.
    expect(html).toContain("lancer.cmd");
    expect(html).toContain(
      "schtasks /Create /SC MINUTE /MO 10 /TN YitereSonde",
    );
    // Ce qu'il faut voir, ce qu'il faut installer, et quoi faire si ca coince.
    expect(html).toContain("passage: 8 mesures, 8 posees, 0 ignorees");
    expect(html).toContain('href="https://nodejs.org"');
    expect(html).toContain("401 ... jeton inconnu");
    expect(html).toContain("schtasks /Delete /TN YitereSonde /F");
    // Un bouton Copier par bloc de commandes : 4 sous Linux, 4 sous Windows.
    expect(html.match(/>Copier</g)).toHaveLength(8);
    // L'etape 3 du haut renvoie au guide.
    expect(html).toContain('href="#installer"');
    expect(html).toContain('id="installer"');
  });
});

describe("confidentialité", () => {
  it("dit ce que garde le serveur web : rien dans le journal d'accès, parfois une adresse dans le journal d'erreurs", async () => {
    const html = renderToStaticMarkup(
      (await Confidentialite(params({ langue: "fr" })))!,
    );
    expect(html).toContain(
      "Le journal d&#x27;accès du serveur web ne garde aucune adresse IP",
    );
    expect(html).toContain("journal d&#x27;erreurs technique");
  });

  it("dit ce qu'enregistre une publication sans compte : pseudonyme, texte, pays, jamais d'adresse IP", async () => {
    const html = renderToStaticMarkup(
      (await Confidentialite(params({ langue: "fr" })))!,
    );
    expect(html).toContain("Vous publiez sans compte");
    expect(html).toContain("Le pseudonyme que vous choisissez, le texte");
    expect(html).toContain("le pays s&#x27;il est donné");
    expect(html).toContain("Toujours aucune adresse IP.");
  });

  it("donne l'adresse de l'equipe : contact, publication sans compte, compte", async () => {
    const html = renderToStaticMarkup(
      (await Confidentialite(params({ langue: "fr" })))!,
    );
    expect(html.match(/href="mailto:kantecellou70@gmail.com"/g)).toHaveLength(
      3,
    );
    expect(html).not.toContain("contact@lynxatech.com");
    expect(html).not.toContain("[adresse de contact]");
    expect(html).not.toContain("[adresse e-mail dédiée]");
  });

  it("ne laisse plus aucun texte entre crochets, visible par le jury", async () => {
    const html = renderToStaticMarkup(
      (await Confidentialite(params({ langue: "fr" })))!,
    );
    expect(html).not.toContain("[");
    // Les reponses validees par l'equipe, dans l'ordre de la page.
    expect(html).toContain("Responsable des données : LYNXA SARL.");
    expect(html).toContain("<td>14 jours</td>");
    expect(html).toContain(
      "Mesures brutes : 90 jours. Médianes horaires : sans limite.",
    );
    expect(html).toContain("ne vendons aucune donnée.</p>");
    expect(html).toContain("arrondie à 10 minutes.");
    expect(html).not.toContain("Supabase");
    expect(html).toContain(
      "Les médianes horaires déjà publiées sont conservées.",
    );
  });
});
