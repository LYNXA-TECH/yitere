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
    expect(html).toContain(
      '<h2 id="ce-que-nous-mesurons">1. Ce que nous mesurons</h2>',
    );
    expect(html).toContain("<table>");
    // Le sommaire repliable renvoie vers chaque partie.
    expect(html).toContain("<summary>Sommaire");
    expect(html).toContain('<a href="#objet-temoin">');
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

  it("donne l'adresse de l'equipe : contact, arret d'une sonde, mesures, publication sans compte, compte", async () => {
    const html = renderToStaticMarkup(
      (await Confidentialite(params({ langue: "fr" })))!,
    );
    // Vos droits passe par l'equipe tant que Mon espace ne gere pas les sondes.
    expect(html.match(/href="mailto:kantecellou70@gmail.com"/g)).toHaveLength(
      5,
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
    // L'en-tete ne parle plus de brouillon ni de passages en orange.
    expect(html).not.toMatch(/brouillon/i);
    expect(html).not.toMatch(/orange/i);
    expect(html).toContain(
      "Ce que YITERE collecte, pourquoi, combien de temps, et vos droits. Dernière mise à jour : 21 novembre 2026.",
    );
    // Les reponses validees par l'equipe, dans l'ordre de la page.
    expect(html).toContain("Responsable des données : LYNXA SARL.");
    expect(html).toContain("<td>14 jours</td>");
    expect(html).toContain(
      "Mesures brutes : 90 jours. Médianes horaires : sans limite.",
    );
    expect(html).toContain("ne vendons aucune donnée.");
    expect(html).toContain("arrondie à 10 minutes.");
    expect(html).not.toContain("Supabase");
    expect(html).toContain(
      "Les médianes horaires déjà publiées sont conservées.",
    );
    // Vos droits ne renvoie pas a des pages qui n'existent pas encore.
    expect(html).not.toContain("Mes sondes");
    expect(html).not.toContain("Mes contributions");
    expect(html).not.toContain("Mettre en pause");
    expect(html).toContain('href="/fr/contribuer/sonde"');
    // La connexion GitHub (contrat, section 6) : le login et son numero, jamais le jeton
    // ni l'adresse e-mail ; le cookie de session dure 30 jours.
    expect(html).toContain("Votre identifiant GitHub et son numéro");
    expect(html).toContain("jamais le jeton de GitHub");
    expect(html).toContain("ni votre adresse e-mail");
    expect(html).toContain("Cookie de session : 30 jours.");
    expect(html).toContain(
      "Seuls deux cookies existent, et seulement si vous vous connectez à GitHub : un cookie de 10 minutes pendant la connexion, qui la protège, puis le cookie de session, pour 30 jours.",
    );
    // La demande de sonde se fait dans Mon espace, sans adresse e-mail.
    expect(html).toContain("Vous demandez une sonde");
    expect(html).toContain("Aucune adresse e-mail. La clé de la sonde");
  });
});
