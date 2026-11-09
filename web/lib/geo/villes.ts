/**
 * Coordonnees des villes ou une sonde peut se trouver.
 * La base ne stocke que le nom de la ville (table probes) : ce tableau la place sur la carte.
 * Une ville absente d'ici reste visible dans la vue Liste, simplement pas sur la carte.
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
};
