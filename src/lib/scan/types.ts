/** Relevé automatique ChatGPT / Gemini : types partagés entre le robot et la vue admin. */

export const SCAN_ENGINES = ["chatgpt", "gemini"] as const;
export type ScanEngine = (typeof SCAN_ENGINES)[number];

export interface Source {
  url: string;
  title?: string;
}

/** Réponse brute d'un moteur IA à une question. */
export interface EngineAnswer {
  text: string;
  sources: Source[];
  usage?: { input: number; output: number };
}

/** Résultat analysé d'une réponse. */
export interface EngineResult {
  status: "cited" | "not_cited" | "error";
  /** Rang du client parmi les entreprises citées (1 = première), null si absent. */
  position: number | null;
  /** Marques suivies (client et concurrents) présentes dans la réponse. */
  mentions: string[];
  /** Entreprises recommandées, dans l'ordre de la réponse. */
  ranking: string[];
  /** Extrait affiché dans le portail, mentions du client entourées de **…**. */
  snippet: string | null;
  answer: string;
  sources: Source[];
  error?: string;
}

export interface QuestionResult {
  question: string;
  location_id: string | null;
  engines: Partial<Record<ScanEngine, EngineResult>>;
}

export interface BrandShare {
  name: string;
  is_client: boolean;
  chatgpt: number;
  gemini: number;
}

export interface ScanSummary {
  score: number;
  ai_presence_rate: number;
  top3_rate: number;
  chatgpt_presence_rate: number | null;
  gemini_presence_rate: number | null;
  questions: number;
  /** Réponses exploitables (hors erreurs). */
  answers: number;
  cited: number;
  first_place: number;
  errors: number;
  google_rating: number | null;
  nap_conformity: number | null;
  nap_errors: number;
  share_of_voice: BrandShare[];
  models: Partial<Record<ScanEngine | "analysis", string>>;
  usage: Record<string, { input: number; output: number; calls: number }>;
  duration_s: number;
  /** Relevé publié dans le Cockpit (mode live et assez de réponses valides). */
  published: boolean;
}
