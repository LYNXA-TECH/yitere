import { notFound } from "next/navigation";
import { estLangue, type Langue } from "./langues";

/** La langue d'une page d'apres son adresse ; une langue inconnue donne une page 404. */
export async function langueDe(
  params: Promise<{ langue: string }>,
): Promise<Langue> {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();
  return langue;
}
