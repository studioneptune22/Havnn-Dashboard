/** Relevé quotidien des avis Google (Places API) : appel API et calcul des mises à jour. */

export interface PlaceStats {
  rating: number | null;
  reviews: number;
}

/** Note et nombre d'avis d'une fiche Google, via Places API (New) · Place Details. */
export async function fetchPlaceStats(placeId: string, apiKey: string): Promise<PlaceStats> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "rating,userRatingCount" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Places API ${res.status} : ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { rating?: number; userRatingCount?: number };
  return { rating: data.rating ?? null, reviews: data.userRatingCount ?? 0 };
}

/** Note arrondie au dixième, comme en base (numeric(2,1)). */
export const roundRating = (r: number | null) => (r === null ? null : Math.round(r * 10) / 10);

/** Nouveaux avis depuis le dernier relevé (une baisse — avis supprimé — n'en compte aucun). */
export function newReviews(previous: number | null, current: number) {
  return previous === null ? 0 : Math.max(0, current - previous);
}

/**
 * Compteur « avis capturés ce mois » du dernier snapshot : cumulé si le snapshot
 * est du mois en cours (heure de Paris), sinon on repart des nouveaux avis du jour.
 */
export function monthlyNewReviews(snapshot: { recorded_at: string; google_reviews_new: number | null }, added: number, now = new Date()) {
  const month = (d: Date) => d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", month: "2-digit", year: "numeric" });
  const sameMonth = month(new Date(snapshot.recorded_at)) === month(now);
  return (sameMonth ? snapshot.google_reviews_new ?? 0 : 0) + added;
}

const fr = (r: number | null) => (r === null ? "—" : r.toLocaleString("fr-FR", { minimumFractionDigits: 1 }));

/** Entrée du journal d'activité pour de nouveaux avis. */
export function reviewsLogEntry(added: number, stats: PlaceStats, where?: string) {
  const title = `${added} ${added > 1 ? "nouveaux" : "nouvel"} avis Google${where ? ` · ${where}` : ""}`;
  const description = `La fiche Google compte désormais ${stats.reviews} avis, note ${fr(roundRating(stats.rating))}/5.`;
  return { title, description, category: "reviews" as const };
}
