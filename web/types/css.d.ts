// Les feuilles de style importees pour leur seul effet (import "x.css") n'exportent rien.
// TypeScript 6 exige une declaration pour ces imports ; Next.js ne declare que les *.module.css.
declare module "*.css";
