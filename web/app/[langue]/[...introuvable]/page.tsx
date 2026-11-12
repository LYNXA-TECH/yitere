import { notFound } from "next/navigation";

/**
 * Toute adresse inconnue sous /fr ou /en passe par ici, pour que la page « introuvable »
 * s'affiche dans le gabarit du site (en-tete, onglets), et non dans la page 404 brute de
 * Next.js, sans style, qui s'affiche faute de gabarit racine.
 */
export default function Introuvable(): never {
  notFound();
}
