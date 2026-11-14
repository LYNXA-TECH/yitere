import { NextResponse, type NextRequest } from "next/server";
import { estLangue, negocierLangue } from "@/lib/i18n/langues";

/**
 * Une adresse sans langue (« / », « /services ») est redirigee vers la langue
 * du navigateur. Consequence assumee (decision 0002) : ce code tourne a chaque
 * requete de ce type, le site n'est donc plus un simple jeu de fichiers statiques.
 */
export function middleware(requete: NextRequest) {
  const { pathname } = requete.nextUrl;
  const premier = pathname.split("/")[1] ?? "";
  if (estLangue(premier)) return NextResponse.next();

  const langue = negocierLangue(requete.headers.get("accept-language"));
  const destination = requete.nextUrl.clone();
  destination.pathname = `/${langue}${pathname === "/" ? "" : pathname}`;
  const reponse = NextResponse.redirect(destination, 307);
  // Les caches doivent garder une reponse par langue demandee.
  reponse.headers.set("Vary", "Accept-Language");
  return reponse;
}

export const config = {
  // Ni les fichiers de Next.js, ni les fichiers statiques (tout ce qui a une extension),
  // ni l'API (/api/v1/...), qui n'a pas de langue.
  matcher: ["/((?!_next/|api/|.*\\.[^/]+$).*)"],
};
