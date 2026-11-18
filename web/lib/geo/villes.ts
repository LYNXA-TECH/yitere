/**
 * Coordonnees des villes ou une sonde peut se trouver.
 * La base ne stocke que le nom de la ville (table probes) : ce tableau la place sur la carte.
 * Capitales et villes secondaires, d'abord en Afrique de l'Ouest. Une ville absente d'ici
 * se place au centre de son pays (positionVille), plutot que de disparaitre de la carte.
 */
export const VILLES: Readonly<Record<string, { lat: number; lon: number }>> = {
  Abidjan: { lat: 5.36, lon: -4.01 },
  Accra: { lat: 5.6, lon: -0.19 },
  "Addis-Abeba": { lat: 9.03, lon: 38.74 },
  Alger: { lat: 36.75, lon: 3.06 },
  Bamako: { lat: 12.64, lon: -8.0 },
  Brazzaville: { lat: -4.27, lon: 15.28 },
  Casablanca: { lat: 33.57, lon: -7.59 },
  Conakry: { lat: 9.64, lon: -13.58 },
  Cotonou: { lat: 6.37, lon: 2.39 },
  Dakar: { lat: 14.72, lon: -17.47 },
  "Dar es Salam": { lat: -6.79, lon: 39.21 },
  Douala: { lat: 4.05, lon: 9.77 },
  Freetown: { lat: 8.48, lon: -13.23 },
  Johannesburg: { lat: -26.2, lon: 28.05 },
  Kampala: { lat: 0.35, lon: 32.58 },
  Kigali: { lat: -1.95, lon: 30.06 },
  Kinshasa: { lat: -4.44, lon: 15.27 },
  Lagos: { lat: 6.52, lon: 3.38 },
  "Le Caire": { lat: 30.04, lon: 31.24 },
  Libreville: { lat: 0.42, lon: 9.47 },
  Lomé: { lat: 6.13, lon: 1.22 },
  Madrid: { lat: 40.42, lon: -3.7 },
  Monrovia: { lat: 6.29, lon: -10.76 },
  Nairobi: { lat: -1.29, lon: 36.82 },
  Niamey: { lat: 13.51, lon: 2.11 },
  Nouakchott: { lat: 18.09, lon: -15.98 },
  Ouagadougou: { lat: 12.37, lon: -1.52 },
  Tunis: { lat: 36.81, lon: 10.18 },
  Yaoundé: { lat: 3.85, lon: 11.5 },
  // Villes secondaires : un pays peut avoir des sondes dans plusieurs villes.
  Kankan: { lat: 10.38, lon: -9.31 },
  Labé: { lat: 11.32, lon: -12.28 },
  Kindia: { lat: 10.06, lon: -12.87 },
  Nzérékoré: { lat: 7.75, lon: -8.82 },
  Boké: { lat: 10.94, lon: -14.3 },
  Mamou: { lat: 10.38, lon: -12.09 },
  Kamsar: { lat: 10.65, lon: -14.61 },
  Siguiri: { lat: 11.42, lon: -9.17 },
  Kissidougou: { lat: 9.19, lon: -10.1 },
  Faranah: { lat: 10.04, lon: -10.74 },
  Bo: { lat: 7.96, lon: -11.74 },
  Kenema: { lat: 7.88, lon: -11.19 },
  Makeni: { lat: 8.88, lon: -12.04 },
  Banjul: { lat: 13.45, lon: -16.58 },
  Bissau: { lat: 11.86, lon: -15.6 },
  Thiès: { lat: 14.79, lon: -16.93 },
  "Saint-Louis": { lat: 16.03, lon: -16.49 },
  Ziguinchor: { lat: 12.58, lon: -16.27 },
  Touba: { lat: 14.85, lon: -15.88 },
  Kaolack: { lat: 14.15, lon: -16.07 },
  Bouaké: { lat: 7.69, lon: -5.03 },
  Yamoussoukro: { lat: 6.82, lon: -5.28 },
  "San-Pédro": { lat: 4.75, lon: -6.64 },
  Korhogo: { lat: 9.46, lon: -5.63 },
  Daloa: { lat: 6.88, lon: -6.45 },
  Sikasso: { lat: 11.32, lon: -5.67 },
  Ségou: { lat: 13.43, lon: -6.26 },
  Mopti: { lat: 14.49, lon: -4.2 },
  Kayes: { lat: 14.45, lon: -11.44 },
  "Bobo-Dioulasso": { lat: 11.18, lon: -4.3 },
  Kumasi: { lat: 6.69, lon: -1.62 },
  Tamale: { lat: 9.4, lon: -0.84 },
  Kara: { lat: 9.55, lon: 1.19 },
  "Porto-Novo": { lat: 6.5, lon: 2.6 },
  Parakou: { lat: 9.34, lon: 2.63 },
  Abuja: { lat: 9.08, lon: 7.4 },
  Ibadan: { lat: 7.38, lon: 3.94 },
  Kano: { lat: 12.0, lon: 8.52 },
  "Port Harcourt": { lat: 4.82, lon: 7.03 },
  Bafoussam: { lat: 5.48, lon: 10.42 },
  "N'Djamena": { lat: 12.13, lon: 15.06 },
  Rabat: { lat: 34.02, lon: -6.84 },
  Marrakech: { lat: 31.63, lon: -8.01 },
  Oran: { lat: 35.7, lon: -0.63 },
  Sfax: { lat: 34.74, lon: 10.76 },
  Alexandrie: { lat: 31.2, lon: 29.92 },
  Khartoum: { lat: 15.5, lon: 32.56 },
  Mombasa: { lat: -4.04, lon: 39.67 },
  Dodoma: { lat: -6.16, lon: 35.75 },
  Lubumbashi: { lat: -11.66, lon: 27.48 },
  Luanda: { lat: -8.84, lon: 13.23 },
  Lusaka: { lat: -15.42, lon: 28.28 },
  Harare: { lat: -17.83, lon: 31.05 },
  Maputo: { lat: -25.97, lon: 32.57 },
  Antananarivo: { lat: -18.88, lon: 47.51 },
  Pretoria: { lat: -25.75, lon: 28.19 },
  "Le Cap": { lat: -33.92, lon: 18.42 },
};

/** « Labé », « labe » et « LABE » sont la meme ville : sans accents, sans casse, sans espaces en trop. */
const cle = (nom: string) =>
  nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s'-]+/g, " ")
    .trim();

const PAR_CLE = new Map(
  Object.entries(VILLES).map(([nom, c]) => [cle(nom), { nom, ...c }] as const),
);

/** Les coordonnees d'une ville, quelle que soit la facon dont son nom est ecrit. */
export function coordonneesVille(
  nom: string,
): { lat: number; lon: number } | null {
  const v = PAR_CLE.get(cle(nom));
  return v ? { lat: v.lat, lon: v.lon } : null;
}

/** Le nom bien ecrit d'une ville connue (« labe » devient « Labé ») ; sinon tel quel. */
export function nomVille(nom: string): string {
  return PAR_CLE.get(cle(nom))?.nom ?? nom.trim();
}
