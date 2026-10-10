/**
 * Relevé automatique ChatGPT / Gemini : pour chaque client, pose ses questions suivies aux moteurs,
 * analyse les réponses et enregistre le résultat.
 *
 *   mode "test" : résultat enregistré dans scan_runs uniquement (calibrage, Cockpit inchangé)
 *   mode "live" : publié dans le Cockpit (questions, part de voix, score, journal) + scan_runs
 *
 * Lancé chaque lundi par GitHub Actions (scripts/scan.ts). Aucune dépendance à Next.js.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { monthlyNewReviews } from "@/lib/google-reviews";
import { groupGoogleRating } from "@/lib/locations";
import { napConformity } from "@/lib/scores";
import type { Company, GeoScore, Location, NapCitation, TrackedBrand } from "@/types/database";

import { analyzeAnswer, type BrandMatcher } from "./analyze";
import type { AiClient } from "./engines";
import { computeMetrics, mainSnippet } from "./metrics";
import type { EngineResult, QuestionResult, ScanEngine, ScanSummary } from "./types";

export type ScanMode = "test" | "live";

export interface RunOptions {
  mode: ScanMode;
  /** Domaines ou identifiants ciblés ; sinon tous les clients avec `auto_scan` activé. */
  companies?: string[];
  /** N'écrit rien en base (essai local). */
  noSave?: boolean;
  maxQuestions?: number;
  /** Questions traitées en parallèle. */
  concurrency?: number;
  now?: () => Date;
  log?: (line: string) => void;
}

export interface CompanyReport {
  company: string;
  status: "ok" | "partial" | "error" | "skipped";
  summary?: ScanSummary;
  detail?: string;
}

/** Au-delà de 25 % de réponses en erreur, un relevé live n'est pas publié dans le Cockpit. */
const MAX_ERROR_RATE = 0.25;
const DEFAULT_MAX_QUESTIONS = 30;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function pool<T, R>(items: T[], size: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!, i);
    }
  });
  await Promise.all(workers);
  return out;
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function runScan(db: SupabaseClient, ai: AiClient, options: RunOptions): Promise<CompanyReport[]> {
  const log = options.log ?? console.log;
  const now = options.now ?? (() => new Date());
  if (ai.engines.length === 0) throw new Error("Aucun moteur configuré (OPENAI_API_KEY ou GEMINI_API_KEY).");

  // --------------------------------------------------------------- Clients ciblés
  let query = db.from("companies").select("*").order("name");
  if (options.companies?.length) {
    const ids = options.companies.filter((c) => UUID_RE.test(c));
    const domains = options.companies.filter((c) => !UUID_RE.test(c)).map((d) => d.toLowerCase());
    const filters = [ids.length ? `id.in.(${ids.join(",")})` : null, domains.length ? `domain.in.(${domains.join(",")})` : null];
    query = query.or(filters.filter(Boolean).join(","));
  } else {
    query = query.eq("auto_scan", true);
  }
  const { data: companies, error } = await query.returns<Company[]>();
  if (error) throw new Error(`Lecture des clients : ${error.message}`);
  if (!companies?.length) {
    log("Aucun client à relever (activez « Relevé automatique » dans la vue admin).");
    return [];
  }

  const reports: CompanyReport[] = [];
  for (const company of companies) {
    try {
      reports.push(await scanCompany(db, ai, company, options, now, log));
    } catch (e) {
      log(`✗ ${company.name} : ${message(e)}`);
      reports.push({ company: company.name, status: "error", detail: message(e) });
      if (!options.noSave) {
        await db.from("scan_runs").insert({ company_id: company.id, mode: options.mode, status: "error", error: message(e) });
      }
    }
  }
  return reports;
}

async function scanCompany(
  db: SupabaseClient,
  ai: AiClient,
  company: Company,
  options: RunOptions,
  now: () => Date,
  log: (line: string) => void,
): Promise<CompanyReport> {
  const started = now();

  const [promptsRes, brandsRes, napRes, scoreRes, locationsRes] = await Promise.all([
    db.from("prompts_latest").select("prompt_text, location_id").eq("company_id", company.id).order("prompt_text"),
    db.from("tracked_brands").select("*").eq("company_id", company.id).order("sort_order").order("name").returns<TrackedBrand[]>(),
    db.from("nap_citations").select("*").eq("company_id", company.id).returns<NapCitation[]>(),
    db
      .from("geo_scores")
      .select("*")
      .eq("company_id", company.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .returns<GeoScore[]>(),
    db.from("locations").select("*").eq("company_id", company.id).returns<Location[]>(),
  ]);
  for (const r of [promptsRes, brandsRes, napRes, scoreRes, locationsRes]) if (r.error) throw new Error(r.error.message);

  const questions = (promptsRes.data ?? []) as { prompt_text: string; location_id: string | null }[];
  const brands: BrandMatcher[] = (brandsRes.data ?? []).map((b) => ({ name: b.name, is_client: b.is_client, aliases: b.aliases ?? [] }));
  if (!brands.some((b) => b.is_client)) {
    log(`– ${company.name} : marque client non définie (onglet Concurrents de la vue admin).`);
    return { company: company.name, status: "skipped", detail: "marque client non définie" };
  }
  if (questions.length === 0) {
    log(`– ${company.name} : aucune question suivie.`);
    return { company: company.name, status: "skipped", detail: "aucune question suivie" };
  }
  const max = options.maxQuestions ?? DEFAULT_MAX_QUESTIONS;
  if (questions.length > max) log(`  ${company.name} : ${questions.length} questions, seules les ${max} premières sont posées.`);
  const asked = questions.slice(0, max);

  log(`→ ${company.name} : ${asked.length} questions × ${ai.engines.join(" + ")}`);

  // ------------------------------------------------------------ Questions × moteurs
  const usage: ScanSummary["usage"] = {};
  const addUsage = (key: string, u?: { input: number; output: number }) => {
    const entry = (usage[key] ??= { input: 0, output: 0, calls: 0 });
    entry.calls += 1;
    entry.input += u?.input ?? 0;
    entry.output += u?.output ?? 0;
  };

  const results: QuestionResult[] = await pool(asked, options.concurrency ?? 4, async (q) => {
    const engines: QuestionResult["engines"] = {};
    await Promise.all(
      ai.engines.map(async (engine: ScanEngine) => {
        try {
          const answer = await ai.ask(engine, q.prompt_text, { city: company.city });
          addUsage(engine, answer.usage);
          if (!answer.text) throw new Error("réponse vide");
          let ranking: string[] = [];
          try {
            const extracted = await ai.extractBusinesses(q.prompt_text, answer.text);
            if (extracted.usage) addUsage("analysis", extracted.usage);
            ranking = extracted.names;
          } catch (e) {
            log(`  ! analyse « ${q.prompt_text.slice(0, 50)}… » (${engine}) : ${message(e)} → classement par ordre d'apparition`);
          }
          engines[engine] = analyzeAnswer(answer, brands, ranking);
        } catch (e) {
          log(`  ! ${engine} « ${q.prompt_text.slice(0, 50)}… » : ${message(e)}`);
          engines[engine] = errorResult(message(e));
        }
      }),
    );
    return { question: q.prompt_text, location_id: q.location_id, engines };
  });

  // ------------------------------------------------------------------- Chiffres
  const locations = locationsRes.data ?? [];
  const previous = scoreRes.data?.[0] ?? null;
  const googleRating = locations.length
    ? groupGoogleRating(locations).rating
    : previous?.google_rating === null || previous?.google_rating === undefined
      ? null
      : Number(previous.google_rating);
  const nap = napConformity(napRes.data ?? []);
  const metrics = computeMetrics(results, brands, { googleRating, napConformity: nap.score });

  const totalAnswers = asked.length * ai.engines.length;
  const errorRate = metrics.errors / totalAnswers;
  const status: CompanyReport["status"] = metrics.errors === 0 ? "ok" : errorRate <= MAX_ERROR_RATE ? "partial" : "error";
  const publish = options.mode === "live" && status !== "error";

  const summary: ScanSummary = {
    ...metrics,
    google_rating: googleRating,
    nap_conformity: nap.score,
    nap_errors: nap.misaligned,
    models: ai.models,
    usage,
    duration_s: Math.round((now().getTime() - started.getTime()) / 1000),
    published: publish,
  };

  const client = brands.find((b) => b.is_client)!;
  log(
    `  ${status === "ok" ? "✓" : status === "partial" ? "≈" : "✗"} score ${summary.score} % · cité ${summary.cited}/${summary.answers}` +
      ` · 1re place ${summary.first_place} · erreurs ${summary.errors}${publish ? " · publié" : ""}`,
  );

  if (options.noSave) return { company: company.name, status, summary };

  // ------------------------------------------------------------------ Écritures
  const runAt = now().toISOString();
  if (publish) {
    await publishToCockpit(db, company, client.name, results, summary, previous, runAt, ai.engines);
  }

  const { error } = await db.from("scan_runs").insert({
    company_id: company.id,
    mode: options.mode,
    status,
    summary,
    results,
    error: status === "error" ? `${metrics.errors} réponses en erreur sur ${totalAnswers} : relevé non publié.` : null,
    created_at: runAt,
  });
  if (error) throw new Error(`Enregistrement du relevé : ${error.message}`);

  return { company: company.name, status, summary };
}

function errorResult(error: string): EngineResult {
  return { status: "error", position: null, mentions: [], ranking: [], snippet: null, answer: "", sources: [], error };
}

const ENGINE_NAMES: Record<ScanEngine, string> = { chatgpt: "ChatGPT", gemini: "Gemini" };

const dbStatus = (r?: EngineResult) => (!r || r.status === "error" ? "pending" : r.status);

async function publishToCockpit(
  db: SupabaseClient,
  company: Company,
  clientName: string,
  results: QuestionResult[],
  summary: ScanSummary,
  previous: GeoScore | null,
  runAt: string,
  engines: ScanEngine[],
) {
  const check = ({ error }: { error: { message: string } | null }, what: string) => {
    if (error) throw new Error(`${what} : ${error.message}`);
  };

  check(
    await db.from("prompts_monitoring").insert(
      results.map((r) => ({
        company_id: company.id,
        prompt_text: r.question,
        location_id: r.location_id,
        chatgpt_status: dbStatus(r.engines.chatgpt),
        gemini_status: dbStatus(r.engines.gemini),
        chatgpt_position: r.engines.chatgpt?.position ?? null,
        gemini_position: r.engines.gemini?.position ?? null,
        ai_snippet: mainSnippet(r),
        ai_snippets: Object.fromEntries(
          engines.map((e) => [e, r.engines[e]?.snippet]).filter(([, s]) => typeof s === "string"),
        ),
        scanned_at: runAt,
      })),
    ),
    "Questions",
  );

  check(
    await db.from("share_of_voice").insert(
      summary.share_of_voice.map((b) => ({
        company_id: company.id,
        brand_name: b.name,
        is_client: b.is_client,
        chatgpt_mentions: b.chatgpt,
        gemini_mentions: b.gemini,
        prompts_total: summary.questions,
        recorded_at: runAt,
      })),
    ),
    "Part de voix",
  );

  check(
    await db.from("geo_scores").insert({
      company_id: company.id,
      score_percentage: summary.score,
      ai_presence_rate: summary.ai_presence_rate,
      nap_errors_count: summary.nap_errors,
      chatgpt_presence_rate: summary.chatgpt_presence_rate,
      gemini_presence_rate: summary.gemini_presence_rate,
      // Avis Google : repris du dernier relevé (mis à jour chaque jour par le cron des avis).
      google_rating: previous?.google_rating ?? null,
      google_reviews_total: previous?.google_reviews_total ?? null,
      google_reviews_new:
        previous && previous.google_reviews_new !== null ? monthlyNewReviews(previous, 0, new Date(runAt)) : null,
      recorded_at: runAt,
    }),
    "Score",
  );

  const delta = previous ? Math.round(summary.score - Number(previous.score_percentage)) : null;
  const trend = delta === null ? "" : delta === 0 ? " (stable)" : ` (${delta > 0 ? "+" : ""}${delta} pts)`;
  check(
    await db.from("activity_logs").insert({
      company_id: company.id,
      category: "monitoring",
      title: `Relevé hebdomadaire ${engines.map((e) => ENGINE_NAMES[e]).join(" et ")}`,
      description:
        `${summary.questions} questions posées : ${clientName} est cité dans ${summary.cited} réponses sur ${summary.answers}` +
        `${summary.first_place ? `, dont ${summary.first_place} en 1re position` : ""}. Score de dominance ${summary.score} %${trend}.`,
      created_at: runAt,
    }),
    "Journal",
  );
}
