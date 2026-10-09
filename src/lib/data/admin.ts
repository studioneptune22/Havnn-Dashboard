import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ActivityLog, AppUser, Company, Location, PromptMonitoring, ScanRun, TrackedBrand } from "@/types/database";

/**
 * Lectures de la vue admin (client Supabase de l'utilisateur : le RLS réserve
 * tracked_brands et scan_runs aux admins HAVNN et leur ouvre toutes les entreprises).
 */

export interface ClientOverview {
  company: Company;
  score: number | null;
  scoredAt: string | null;
  questions: number;
  lastRun: Pick<ScanRun, "mode" | "status" | "created_at"> | null;
}

export async function getClientsOverview(): Promise<ClientOverview[]> {
  const supabase = createClient();
  const [companies, scores, prompts, runs] = await Promise.all([
    supabase.from("companies").select("*").order("name").returns<Company[]>(),
    supabase
      .from("geo_scores")
      .select("company_id, score_percentage, recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(2000),
    supabase.from("prompts_latest").select("company_id").limit(5000),
    supabase
      .from("scan_runs")
      .select("company_id, mode, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const latestScore = new Map<string, { score_percentage: number; recorded_at: string }>();
  for (const s of scores.data ?? []) if (!latestScore.has(s.company_id)) latestScore.set(s.company_id, s);
  const questionCount = new Map<string, number>();
  for (const p of prompts.data ?? []) questionCount.set(p.company_id, (questionCount.get(p.company_id) ?? 0) + 1);
  const lastRun = new Map<string, ClientOverview["lastRun"]>();
  for (const r of runs.data ?? []) if (!lastRun.has(r.company_id)) lastRun.set(r.company_id, r);

  return (companies.data ?? []).map((company) => {
    const score = latestScore.get(company.id);
    return {
      company,
      score: score ? Number(score.score_percentage) : null,
      scoredAt: score?.recorded_at ?? null,
      questions: questionCount.get(company.id) ?? 0,
      lastRun: lastRun.get(company.id) ?? null,
    };
  });
}

export interface AdminClientData {
  activity: ActivityLog[];
  prompts: Pick<PromptMonitoring, "prompt_text" | "location_id" | "chatgpt_status" | "gemini_status" | "chatgpt_position" | "gemini_position" | "scanned_at">[];
  brands: TrackedBrand[];
  locations: Location[];
  /** Comptes de connexion rattachés au client. */
  accounts: Pick<AppUser, "email" | "full_name" | "role">[];
  /** Derniers relevés automatiques, sans le détail des réponses. */
  runs: Omit<ScanRun, "results">[];
  /** Relevé le plus récent, avec le détail question par question. */
  latestRun: ScanRun | null;
}

/** Données du client actif pour les onglets Journal, Questions, Concurrents et Relevé auto. */
export async function getAdminClientData(companyId: string): Promise<AdminClientData> {
  const supabase = createClient();
  const [activity, prompts, brands, locations, accounts, runs, latestRun] = await Promise.all([
    supabase
      .from("activity_logs")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<ActivityLog[]>(),
    supabase
      .from("prompts_latest")
      .select("prompt_text, location_id, chatgpt_status, gemini_status, chatgpt_position, gemini_position, scanned_at")
      .eq("company_id", companyId)
      .order("prompt_text")
      .returns<AdminClientData["prompts"]>(),
    supabase.from("tracked_brands").select("*").eq("company_id", companyId).order("sort_order").order("name").returns<TrackedBrand[]>(),
    supabase.from("locations").select("*").eq("company_id", companyId).order("sort_order").order("name").returns<Location[]>(),
    supabase.from("users").select("email, full_name, role").eq("company_id", companyId).eq("role", "client").order("email"),
    supabase
      .from("scan_runs")
      .select("id, company_id, mode, status, summary, error, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<Omit<ScanRun, "results">[]>(),
    supabase
      .from("scan_runs")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<ScanRun>(),
  ]);

  return {
    activity: activity.data ?? [],
    prompts: prompts.data ?? [],
    brands: brands.data ?? [],
    locations: locations.data ?? [],
    accounts: (accounts.data ?? []) as AdminClientData["accounts"],
    runs: runs.data ?? [],
    latestRun: latestRun.data ?? null,
  };
}
