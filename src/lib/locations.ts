import type { Location, NapCitation } from "@/types/database";

/** Valeur du paramètre d'URL `centre` qui désigne l'ensemble des établissements. */
export const ALL_LOCATIONS = "all";

/** Établissement sélectionné via `?centre=<id>`, ou null pour « tous ». */
export function parseLocation(value: string | string[] | undefined, locations: Location[]): Location | null {
  const v = Array.isArray(value) ? value[0] : value;
  return locations.find((l) => l.id === v) ?? null;
}

/** Note Google du groupe : moyenne des établissements pondérée par leur nombre d'avis. */
export function groupGoogleRating(locations: Location[]) {
  const rated = locations.filter((l) => l.google_rating !== null);
  const reviews = rated.reduce((sum, l) => sum + (l.google_reviews_total ?? 0), 0);
  if (rated.length === 0) return { rating: null, reviews: 0, rated: 0 };

  const rating = reviews
    ? rated.reduce((sum, l) => sum + Number(l.google_rating) * (l.google_reviews_total ?? 0), 0) / reviews
    : rated.reduce((sum, l) => sum + Number(l.google_rating), 0) / rated.length;
  return { rating: Math.round(rating * 10) / 10, reviews, rated: rated.length };
}

export const isNapAligned = (c: NapCitation) => c.name_ok && c.address_ok && c.phone_ok;

/** Bilan NAP d'un établissement : plateformes vérifiées et plateformes conformes. */
export function napSummary(citations: NapCitation[], locationId: string) {
  const own = citations.filter((c) => c.location_id === locationId);
  return { checked: own.length, aligned: own.filter(isNapAligned).length };
}
