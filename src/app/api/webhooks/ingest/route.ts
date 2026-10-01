import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Point d'entrée des webhooks Make.com / N8N.
 *
 * POST /api/webhooks/ingest
 * Header : x-havnn-webhook-secret: <HAVNN_WEBHOOK_SECRET>
 * Body   : {
 *   "type": "geo_scores",                 // table cible (voir TABLES)
 *   "company_domain": "exemple.fr",       // ou "company_id": "<uuid>"
 *   "records": [{ "score_percentage": 72, "ai_presence_rate": 58, ... }]
 * }
 *
 * `company_id` est toujours injecté par le serveur : un record ne peut pas
 * écrire dans une autre entreprise que celle ciblée.
 *
 * Clients multi-sites : un record `prompts_monitoring` ou `nap_citations` peut
 * cibler un établissement par `location_id` ou par son nom (`"location": "Autovision Illkirch"`).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TableConfig = { columns: readonly string[]; onConflict?: string };

const TABLES = {
  geo_scores: {
    columns: [
      "score_percentage", "ai_presence_rate", "nap_errors_count", "google_rating", "google_reviews_total",
      "google_reviews_new", "chatgpt_presence_rate", "perplexity_presence_rate", "gemini_presence_rate", "recorded_at",
    ],
  },
  prompts_monitoring: {
    columns: [
      "prompt_text", "chatgpt_status", "perplexity_status", "gemini_status", "chatgpt_position",
      "perplexity_position", "gemini_position", "ai_snippet", "ai_snippets", "location_id", "scanned_at",
    ],
  },
  activity_logs: { columns: ["title", "description", "category", "created_at"] },
  documents: { columns: ["title", "file_url", "category", "file_size", "period", "created_at"] },
  share_of_voice: {
    columns: [
      "brand_name", "is_client", "chatgpt_mentions", "perplexity_mentions", "gemini_mentions", "prompts_total",
      "recorded_at",
    ],
  },
  technical_checks: {
    columns: ["pillar", "item_key", "label", "status", "details", "checked_at"],
    onConflict: "company_id,item_key",
  },
  nap_citations: {
    columns: ["location_id", "platform", "listing_url", "name_ok", "address_ok", "phone_ok", "checked_at"],
    onConflict: "company_id,location_id,platform",
  },
  locations: {
    columns: [
      "name", "brand", "address", "postal_code", "city", "phone", "google_rating", "google_reviews_total",
      "google_maps_url", "sort_order",
    ],
    onConflict: "company_id,name",
  },
  sentiment_snapshots: {
    columns: ["source", "positive_pct", "neutral_pct", "critical_pct", "summary", "recorded_at"],
  },
} satisfies Record<string, TableConfig>;

type TableName = keyof typeof TABLES;

const MAX_RECORDS = 500;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isAuthorized(request: NextRequest) {
  const expected = process.env.HAVNN_WEBHOOK_SECRET;
  const received = request.headers.get("x-havnn-webhook-secret");
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

function error(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return error(401, "Unauthorized");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "Invalid JSON body");
  }

  const { type, company_id, company_domain, records } = (body ?? {}) as Record<string, unknown>;

  if (typeof type !== "string" || !(type in TABLES)) {
    return error(400, `Unknown type. Expected one of: ${Object.keys(TABLES).join(", ")}`);
  }
  if (!Array.isArray(records) || records.length === 0) return error(400, "`records` must be a non-empty array");
  if (records.length > MAX_RECORDS) return error(413, `Too many records (max ${MAX_RECORDS})`);

  const supabase = createAdminClient();

  // Résolution de l'entreprise cible
  let companyId: string | null = null;
  if (typeof company_id === "string" && UUID_RE.test(company_id)) {
    companyId = company_id;
  } else if (typeof company_domain === "string" && company_domain.trim()) {
    const { data } = await supabase
      .from("companies")
      .select("id")
      .eq("domain", company_domain.trim().toLowerCase())
      .maybeSingle();
    companyId = data?.id ?? null;
  }
  if (!companyId) return error(404, "Company not found (provide a valid company_id or company_domain)");

  // Filtrage des colonnes autorisées + injection de company_id
  const table = type as TableName;
  const config: TableConfig = TABLES[table];

  // Établissement désigné par son nom → location_id (limité à l'entreprise ciblée)
  let locationIds: Map<string, string> | null = null;
  const byName = config.columns.includes("location_id") && records.some((r) => r && typeof r === "object" && "location" in r);
  if (byName) {
    const { data } = await supabase.from("locations").select("id, name").eq("company_id", companyId);
    locationIds = new Map((data ?? []).map((l) => [l.name.trim().toLowerCase(), l.id]));
  }

  const rows: Record<string, unknown>[] = [];
  for (const record of records) {
    const row: Record<string, unknown> = { company_id: companyId };
    if (record && typeof record === "object") {
      const r = record as Record<string, unknown>;
      for (const col of config.columns) {
        if (col in r) row[col] = r[col];
      }
      if (locationIds && typeof r.location === "string") {
        const id = locationIds.get(r.location.trim().toLowerCase());
        if (!id) return error(422, `Unknown location: ${r.location}`);
        row.location_id = id;
      }
    }
    rows.push(row);
  }

  const query = config.onConflict
    ? supabase.from(table).upsert(rows, { onConflict: config.onConflict })
    : supabase.from(table).insert(rows);

  const { error: dbError } = await query;
  if (dbError) return error(422, dbError.message);

  return NextResponse.json({ ok: true, table, company_id: companyId, inserted: rows.length });
}
