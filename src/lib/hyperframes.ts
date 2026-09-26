import type { GeoScore, ShareOfVoice } from "@/types/database";

import { delta } from "./utils";

/** Composition HyperFrames du bilan mensuel, servie en statique depuis /public. */
export const MONTHLY_RECAP_COMPOSITION = "/hyperframes/bilan-mensuel/index.html";

const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

/**
 * URL de la vidéo "Bilan GEO du mois" alimentée par les données du client.
 * Les paramètres d'URL surchargent les variables déclarées dans la composition.
 */
export function monthlyRecapSrc({
  companyName,
  latest,
  previous,
  shareOfVoice,
}: {
  companyName: string;
  latest: GeoScore;
  previous: GeoScore | null;
  shareOfVoice: ShareOfVoice[];
}) {
  const month = monthFmt.format(new Date(latest.recorded_at));
  const sov = shareOfVoice
    .map((b) => {
      const mentions = b.chatgpt_mentions + b.perplexity_mentions + b.gemini_mentions;
      return [b.brand_name.replace(/[|;]/g, " "), mentions, b.is_client ? 1 : 0].join("|");
    })
    .join(";");

  const params = new URLSearchParams({
    company: companyName,
    month: month.charAt(0).toUpperCase() + month.slice(1),
    score: String(latest.score_percentage),
    scoreDelta: String(delta(latest.score_percentage, previous?.score_percentage)),
    presence: String(latest.ai_presence_rate),
    presenceDelta: String(delta(latest.ai_presence_rate, previous?.ai_presence_rate)),
    rating: String(latest.google_rating ?? 0),
    reviewsNew: String(latest.google_reviews_new ?? 0),
    napErrors: String(latest.nap_errors_count),
  });
  if (sov) params.set("sov", sov);

  return `${MONTHLY_RECAP_COMPOSITION}?${params.toString()}`;
}
