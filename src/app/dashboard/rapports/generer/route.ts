import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import { ACTIVE_ENGINES } from "@/components/dashboard/chart-theme";
import { getActivity, getAuditData, getCockpitData, getLocations, getPrompts, getSession } from "@/lib/data/queries";
import { groupGoogleRating } from "@/lib/locations";
import { ReportDocument, type ReportData } from "@/lib/report/report-document";
import { checksScore, napConformity, sentimentScore } from "@/lib/scores";

/**
 * GET /dashboard/rapports/generer
 * Génère à la volée le rapport PDF de l'entreprise de l'utilisateur connecté
 * (Cockpit, Benchmark IA & Prompts, Structure & Factualité). Les données passent
 * par le client Supabase de la session : le RLS s'applique comme dans le portail.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slug = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function GET() {
  const { company } = await getSession();
  const generatedAt = new Date();

  const [cockpit, activity, prompts, audit, locations] = await Promise.all([
    getCockpitData(company.id, "12m"),
    getActivity(company.id, 10),
    getPrompts(company.id),
    getAuditData(company.id),
    getLocations(company.id),
  ]);

  const multiSite = locations.length > 0;
  const group = groupGoogleRating(locations);

  const data: ReportData = {
    company,
    generatedAt,
    engines: ACTIVE_ENGINES,
    latest: cockpit.latest,
    previous: cockpit.previous,
    history: cockpit.scores,
    googleRating: multiSite ? group.rating : cockpit.latest?.google_rating ?? null,
    googleReviews: multiSite ? group.reviews : cockpit.latest?.google_reviews_total ?? 0,
    shareOfVoice: cockpit.shareOfVoice,
    activity,
    locations,
    prompts,
    checks: audit.checks,
    nap: audit.nap,
    sentiment: audit.sentiment,
    pillars: [
      { label: "Schema.org", score: checksScore(audit.checks.filter((c) => c.pillar === "schema")) },
      { label: "llms.txt", score: checksScore(audit.checks.filter((c) => c.pillar === "llms_txt")) },
      { label: "Signal NAP", score: napConformity(audit.nap).score },
      { label: "Sentiment", score: sentimentScore(audit.sentiment) },
    ],
  };

  // ReportDocument rend un <Document> : le cast reflète ce que renderToBuffer attend.
  const pdf = await renderToBuffer(createElement(ReportDocument, { data }) as ReactElement<DocumentProps>);

  const stamp = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  })
    .format(generatedAt)
    .replace(" ", "-")
    .replace(":", "h");
  const filename = `rapport-geo-${slug(company.name)}-${stamp}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
