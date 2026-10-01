/**
 * Types métier alignés sur `supabase/schema.sql`.
 * (Peuvent être remplacés par `supabase gen types typescript` une fois le projet lié.)
 */

export type UserRole = "client" | "havnn_admin";
export type AiCitationStatus = "cited" | "not_cited" | "pending";
export type ActivityCategory =
  | "schema"
  | "nap"
  | "content"
  | "reviews"
  | "llms_txt"
  | "report"
  | "monitoring"
  | "other";
export type DocumentCategory = "monthly_report" | "roadmap" | "contract" | "csv_export" | "other";
export type CheckStatus = "ok" | "warning" | "error" | "pending";
export type GeoPillar = "schema" | "llms_txt" | "nap" | "sentiment";
export type AiEngine = "chatgpt" | "perplexity" | "gemini";

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  city: string | null;
  sector: string | null;
  plan_status: "onboarding" | "active" | "paused";
  created_at: string;
}

/** Établissement d'un client multi-sites (centre, agence…). */
export interface Location {
  id: string;
  company_id: string;
  name: string;
  brand: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  google_rating: number | null;
  google_reviews_total: number | null;
  google_maps_url: string | null;
  sort_order: number;
}

export interface AppUser {
  id: string;
  company_id: string | null;
  email: string;
  full_name: string | null;
  role: UserRole;
}

export interface GeoScore {
  id: string;
  company_id: string;
  score_percentage: number;
  ai_presence_rate: number;
  nap_errors_count: number;
  google_rating: number | null;
  google_reviews_total: number | null;
  google_reviews_new: number | null;
  chatgpt_presence_rate: number | null;
  perplexity_presence_rate: number | null;
  gemini_presence_rate: number | null;
  recorded_at: string;
}

export interface PromptMonitoring {
  id: string;
  company_id: string;
  prompt_text: string;
  chatgpt_status: AiCitationStatus;
  perplexity_status: AiCitationStatus;
  gemini_status: AiCitationStatus;
  chatgpt_position: number | null;
  perplexity_position: number | null;
  gemini_position: number | null;
  position: number | null;
  ai_snippet: string | null;
  ai_snippets: Partial<Record<AiEngine, string>>;
  /** Établissement concerné, ou null pour une question transverse. */
  location_id: string | null;
  scanned_at: string;
}

export interface ActivityLog {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  category: ActivityCategory;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  company_id: string;
  title: string;
  file_url: string;
  category: DocumentCategory;
  file_size: number | null;
  period: string | null;
  created_at: string;
}

export interface ShareOfVoice {
  id: string;
  company_id: string;
  brand_name: string;
  is_client: boolean;
  chatgpt_mentions: number;
  perplexity_mentions: number;
  gemini_mentions: number;
  prompts_total: number;
  recorded_at: string;
}

export interface TechnicalCheck {
  id: string;
  company_id: string;
  pillar: GeoPillar;
  item_key: string;
  label: string;
  status: CheckStatus;
  details: string | null;
  checked_at: string;
}

export interface NapCitation {
  id: string;
  company_id: string;
  /** Établissement concerné, ou null pour une fiche unique (client mono-site). */
  location_id: string | null;
  platform: string;
  listing_url: string | null;
  name_ok: boolean;
  address_ok: boolean;
  phone_ok: boolean;
  checked_at: string;
}

export interface SentimentSnapshot {
  id: string;
  company_id: string;
  source: "google_reviews" | "llm_answers";
  positive_pct: number;
  neutral_pct: number;
  critical_pct: number;
  summary: string | null;
  recorded_at: string;
}
