import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type {
  ActivityLog,
  AppUser,
  Company,
  DocumentItem,
  GeoScore,
  Location,
  NapCitation,
  PromptMonitoring,
  SentimentSnapshot,
  ShareOfVoice,
  TechnicalCheck,
} from "@/types/database";

import * as mock from "./mock";
import { periodStart, type Period } from "./period";

/**
 * Couche d'accès aux données.
 * - Supabase configuré → requêtes réelles, filtrées par le RLS.
 * - Sinon → mock data (mode démo).
 */

export interface Session {
  user: AppUser;
  company: Company;
  demo: boolean;
}

export const getSession = cache(async (): Promise<Session> => {
  if (!isSupabaseConfigured) {
    return {
      demo: true,
      company: mock.mockCompany,
      user: {
        id: "demo-user",
        company_id: mock.DEMO_COMPANY_ID,
        email: "julien@atelier-vogel-paysage.fr",
        full_name: "Julien Vogel",
        role: "client",
      },
    };
  }

  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, company_id, email, full_name, role")
    .eq("id", authUser.id)
    .single<AppUser>();

  if (!profile?.company_id) redirect("/login?error=no_company");

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single<Company>();

  if (!company) redirect("/login?error=no_company");

  return { user: profile, company, demo: false };
});

// -----------------------------------------------------------------------------
// Établissements (clients multi-sites)
// -----------------------------------------------------------------------------
/** Établissements du client, dans l'ordre d'affichage. Vide pour un client mono-site. */
export const getLocations = cache(async (companyId: string): Promise<Location[]> => {
  if (!isSupabaseConfigured) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("company_id", companyId)
    .order("sort_order")
    .order("name")
    .returns<Location[]>();
  return data ?? [];
});

/** Fiches NAP (toutes plateformes, tous établissements). */
export async function getNapCitations(companyId: string): Promise<NapCitation[]> {
  if (!isSupabaseConfigured) return mock.mockNapCitations;

  const supabase = createClient();
  const { data } = await supabase
    .from("nap_citations")
    .select("*")
    .eq("company_id", companyId)
    .order("platform")
    .returns<NapCitation[]>();
  return data ?? [];
}

// -----------------------------------------------------------------------------
// Cockpit
// -----------------------------------------------------------------------------
export interface CockpitData {
  /** Snapshots ordonnés du plus ancien au plus récent, sur la période. */
  scores: GeoScore[];
  latest: GeoScore | null;
  /** Dernier snapshot du mois précédent le dernier snapshot. */
  previous: GeoScore | null;
  shareOfVoice: ShareOfVoice[];
  activity: ActivityLog[];
}

function previousMonthSnapshot(all: GeoScore[], latest: GeoScore | null) {
  if (!latest) return null;
  const d = new Date(latest.recorded_at);
  const monthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
  return [...all].reverse().find((s) => s.recorded_at < monthStart) ?? null;
}

export async function getCockpitData(companyId: string, period: Period): Promise<CockpitData> {
  if (!isSupabaseConfigured) {
    const all = mock.mockGeoScores;
    const latest = all.at(-1) ?? null;
    const start = periodStart(period, new Date(latest?.recorded_at ?? Date.now()));
    return {
      scores: all.filter((s) => s.recorded_at >= start),
      latest,
      previous: previousMonthSnapshot(all, latest),
      shareOfVoice: mock.mockShareOfVoice,
      activity: mock.mockActivity.slice(0, 5),
    };
  }

  const supabase = createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - 13); // marge pour calculer le "mois précédent"

  const [scoresRes, sovRes, activityRes] = await Promise.all([
    supabase
      .from("geo_scores")
      .select("*")
      .eq("company_id", companyId)
      .gte("recorded_at", since.toISOString())
      .order("recorded_at", { ascending: true })
      .returns<GeoScore[]>(),
    supabase
      .from("share_of_voice")
      .select("*")
      .eq("company_id", companyId)
      .order("recorded_at", { ascending: false })
      .limit(10)
      .returns<ShareOfVoice[]>(),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<ActivityLog[]>(),
  ]);

  const all = scoresRes.data ?? [];
  const latest = all.at(-1) ?? null;
  const start = periodStart(period);

  // Ne garder que le dernier scan de part de voix
  const sov = sovRes.data ?? [];
  const lastScan = sov[0]?.recorded_at;
  const shareOfVoice = sov
    .filter((s) => s.recorded_at === lastScan)
    .sort((a, b) => Number(b.is_client) - Number(a.is_client));

  return {
    scores: all.filter((s) => s.recorded_at >= start),
    latest,
    previous: previousMonthSnapshot(all, latest),
    shareOfVoice,
    activity: activityRes.data ?? [],
  };
}

// -----------------------------------------------------------------------------
// Benchmark IA & Prompts
// -----------------------------------------------------------------------------
export async function getPrompts(companyId: string): Promise<PromptMonitoring[]> {
  if (!isSupabaseConfigured) return mock.mockPrompts;

  const supabase = createClient();
  const { data } = await supabase
    .from("prompts_latest")
    .select("*")
    .eq("company_id", companyId)
    .order("prompt_text")
    .returns<PromptMonitoring[]>();
  return data ?? [];
}

// -----------------------------------------------------------------------------
// Structure & Factualité
// -----------------------------------------------------------------------------
export interface AuditData {
  checks: TechnicalCheck[];
  nap: NapCitation[];
  sentiment: SentimentSnapshot[];
}

export async function getAuditData(companyId: string): Promise<AuditData> {
  if (!isSupabaseConfigured) {
    return { checks: mock.mockTechnicalChecks, nap: mock.mockNapCitations, sentiment: mock.mockSentiment };
  }

  const supabase = createClient();
  const [checks, nap, sentiment] = await Promise.all([
    supabase.from("technical_checks").select("*").eq("company_id", companyId).order("item_key").returns<TechnicalCheck[]>(),
    getNapCitations(companyId),
    supabase
      .from("sentiment_snapshots")
      .select("*")
      .eq("company_id", companyId)
      .order("recorded_at", { ascending: false })
      .limit(10)
      .returns<SentimentSnapshot[]>(),
  ]);

  // Dernier snapshot par source
  const latestBySource = new Map<string, SentimentSnapshot>();
  for (const s of sentiment.data ?? []) if (!latestBySource.has(s.source)) latestBySource.set(s.source, s);

  return {
    checks: checks.data ?? [],
    nap,
    sentiment: Array.from(latestBySource.values()),
  };
}

// -----------------------------------------------------------------------------
// Documents & Rapports
// -----------------------------------------------------------------------------
export async function getDocuments(companyId: string): Promise<DocumentItem[]> {
  if (!isSupabaseConfigured) return mock.mockDocuments;

  const supabase = createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<DocumentItem[]>();

  const docs = data ?? [];

  // Les fichiers stockés dans le bucket privé reçoivent une URL signée (1 h).
  const storagePaths = docs.filter((d) => !/^https?:\/\//.test(d.file_url)).map((d) => d.file_url);
  if (storagePaths.length === 0) return docs;

  const { data: signed } = await supabase.storage.from("documents").createSignedUrls(storagePaths, 3600);
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  return docs.map((d) => ({ ...d, file_url: urlByPath.get(d.file_url) ?? d.file_url }));
}
