import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { fetchPlaceStats, monthlyNewReviews, newReviews, reviewsLogEntry, roundRating } from "@/lib/google-reviews";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Relevé quotidien des avis Google (Vercel Cron, voir vercel.json).
 *
 * GET /api/cron/google-reviews
 * Header : Authorization: Bearer <CRON_SECRET>   (ajouté automatiquement par Vercel)
 *
 * Pour chaque fiche dont le Place ID est renseigné :
 *   • client mono-site  (companies.google_place_id) → note et avis du dernier geo_scores
 *   • client multi-sites (locations.google_place_id) → note et avis de l'établissement
 * Chaque nouvel avis est ajouté au compteur du mois et noté dans le journal d'activité.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const received = request.headers.get("authorization");
  if (!secret || !received) return false;
  const a = Buffer.from(`Bearer ${secret}`);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Result = { place: string; status: "updated" | "unchanged" | "skipped" | "error"; added?: number; detail?: string };

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, error: "GOOGLE_PLACES_API_KEY manquant." }, { status: 500 });

  const supabase = createAdminClient();
  const results: Result[] = [];

  // ---------------------------------------------------------------- Mono-site
  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id, name, google_place_id")
    .not("google_place_id", "is", null);
  if (companiesError) return NextResponse.json({ ok: false, error: companiesError.message }, { status: 500 });

  for (const c of companies ?? []) {
    try {
      const { data: snapshot } = await supabase
        .from("geo_scores")
        .select("id, google_rating, google_reviews_total, google_reviews_new, recorded_at")
        .eq("company_id", c.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      // Pas encore de relevé : le Cockpit est masqué, la note arrivera avec le premier scan.
      if (!snapshot) {
        results.push({ place: c.name, status: "skipped", detail: "aucun relevé geo_scores" });
        continue;
      }

      const stats = await fetchPlaceStats(c.google_place_id, apiKey);
      const rating = roundRating(stats.rating);
      const added = newReviews(snapshot.google_reviews_total, stats.reviews);
      if (rating === (snapshot.google_rating === null ? null : Number(snapshot.google_rating)) && stats.reviews === snapshot.google_reviews_total) {
        results.push({ place: c.name, status: "unchanged" });
        continue;
      }

      const { error } = await supabase
        .from("geo_scores")
        .update({
          google_rating: rating,
          google_reviews_total: stats.reviews,
          google_reviews_new: monthlyNewReviews(snapshot, added),
        })
        .eq("id", snapshot.id);
      if (error) throw new Error(error.message);
      if (added > 0) await supabase.from("activity_logs").insert({ company_id: c.id, ...reviewsLogEntry(added, stats) });
      results.push({ place: c.name, status: "updated", added });
    } catch (e) {
      results.push({ place: c.name, status: "error", detail: e instanceof Error ? e.message : String(e) });
    }
  }

  // ------------------------------------------------------------- Multi-sites
  const { data: locations, error: locationsError } = await supabase
    .from("locations")
    .select("id, company_id, name, google_place_id, google_rating, google_reviews_total")
    .not("google_place_id", "is", null);
  if (locationsError) return NextResponse.json({ ok: false, error: locationsError.message }, { status: 500 });

  for (const l of locations ?? []) {
    try {
      const stats = await fetchPlaceStats(l.google_place_id, apiKey);
      const rating = roundRating(stats.rating);
      const added = newReviews(l.google_reviews_total, stats.reviews);
      if (rating === (l.google_rating === null ? null : Number(l.google_rating)) && stats.reviews === l.google_reviews_total) {
        results.push({ place: l.name, status: "unchanged" });
        continue;
      }

      const { error } = await supabase
        .from("locations")
        .update({ google_rating: rating, google_reviews_total: stats.reviews })
        .eq("id", l.id);
      if (error) throw new Error(error.message);

      if (added > 0) {
        // Le compteur « avis capturés ce mois » du Cockpit est celui du groupe.
        const { data: snapshot } = await supabase
          .from("geo_scores")
          .select("id, google_reviews_new, recorded_at")
          .eq("company_id", l.company_id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (snapshot) {
          await supabase
            .from("geo_scores")
            .update({ google_reviews_new: monthlyNewReviews(snapshot, added) })
            .eq("id", snapshot.id);
        }
        await supabase.from("activity_logs").insert({ company_id: l.company_id, ...reviewsLogEntry(added, stats, l.name) });
      }
      results.push({ place: l.name, status: "updated", added });
    } catch (e) {
      results.push({ place: l.name, status: "error", detail: e instanceof Error ? e.message : String(e) });
    }
  }

  const failed = results.filter((r) => r.status === "error");
  if (failed.length) console.error("[google-reviews]", JSON.stringify(failed));
  return NextResponse.json({ ok: failed.length === 0, results });
}
