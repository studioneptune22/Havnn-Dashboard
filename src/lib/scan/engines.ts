/**
 * Appels aux moteurs IA : ChatGPT (API OpenAI Responses + recherche web), Gemini (API Gemini +
 * recherche Google), et analyse des réponses (modèle Gemini léger, sortie JSON).
 */

import type { EngineAnswer, ScanEngine, Source } from "./types";

export interface AiConfig {
  openaiKey?: string;
  geminiKey?: string;
  openaiModel: string;
  geminiModel: string;
  analysisModel: string;
}

/** Modèles par défaut (modifiables via les variables OPENAI_MODEL, GEMINI_MODEL, GEMINI_ANALYSIS_MODEL). */
export const DEFAULT_MODELS = {
  openai: "gpt-5.6-terra",
  gemini: "gemini-3.8-flash",
  analysis: "gemini-3.8-flash-lite",
};

export interface AskContext {
  /** Ville du client : localisation approximative de la recherche web ChatGPT. */
  city: string | null;
}

/** Interface commune, remplaçable par des réponses simulées dans les tests. */
export interface AiClient {
  engines: ScanEngine[];
  models: Partial<Record<ScanEngine | "analysis", string>>;
  ask(engine: ScanEngine, question: string, ctx: AskContext): Promise<EngineAnswer>;
  /** Entreprises recommandées dans la réponse, dans l'ordre. */
  extractBusinesses(question: string, answer: string): Promise<{ names: string[]; usage?: EngineAnswer["usage"] }>;
}

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/** POST JSON avec 3 nouvelles tentatives (2 s, 6 s, 18 s) sur les erreurs temporaires. */
export async function postJson<T>(url: string, headers: Record<string, string>, body: unknown, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(2000 * 3 ** (attempt - 1));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180_000),
      });
      if (res.ok) return (await res.json()) as T;
      const detail = (await res.text()).slice(0, 300);
      lastError = new ApiError(`${label} : HTTP ${res.status} ${detail}`, res.status);
      if (!RETRYABLE.has(res.status)) break;
    } catch (e) {
      lastError = e instanceof Error ? new ApiError(`${label} : ${e.message}`) : e;
    }
  }
  throw lastError;
}

// ----------------------------------------------------------------------------- ChatGPT
interface OpenAiResponse {
  output?: {
    type: string;
    content?: { type: string; text?: string; annotations?: { type: string; url?: string; title?: string }[] }[];
  }[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

export function parseOpenAi(data: OpenAiResponse): EngineAnswer {
  const parts = (data.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text");
  const sources: Source[] = parts
    .flatMap((p) => p.annotations ?? [])
    .filter((a) => a.type === "url_citation" && a.url)
    .map((a) => ({ url: a.url!, title: a.title }));
  return {
    text: parts.map((p) => p.text ?? "").join("\n").trim(),
    sources: dedupeSources(sources),
    usage: { input: data.usage?.input_tokens ?? 0, output: data.usage?.output_tokens ?? 0 },
  };
}

// ------------------------------------------------------------------------------ Gemini
interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] };
  }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

export function parseGemini(data: GeminiResponse): EngineAnswer {
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  const sources: Source[] = (candidate?.groundingMetadata?.groundingChunks ?? [])
    .filter((c) => c.web?.uri)
    .map((c) => ({ url: c.web!.uri!, title: c.web!.title }));
  return {
    text,
    sources: dedupeSources(sources),
    usage: { input: data.usageMetadata?.promptTokenCount ?? 0, output: data.usageMetadata?.candidatesTokenCount ?? 0 },
  };
}

function dedupeSources(sources: Source[]) {
  const seen = new Set<string>();
  return sources.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
}

const geminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

// ----------------------------------------------------------------------------- Analyse
export const EXTRACTION_PROMPT = `Tu analyses la réponse d'un assistant IA à la question d'un internaute.
Liste, dans l'ordre où elles apparaissent, les entreprises présentées comme prestataires possibles
(artisans, sociétés, agences, magasins, enseignes locales…), avec leur nom exact tel qu'il est écrit.
N'inclus pas : les annuaires et plateformes (PagesJaunes, Houzz, Google, Habitatpresto…),
les marques de produits ou fabricants cités comme matériaux, les organismes publics ou labels.
Si aucune entreprise n'est citée, renvoie une liste vide.`;

export function createAiClient(config: AiConfig): AiClient {
  const engines: ScanEngine[] = [];
  if (config.openaiKey) engines.push("chatgpt");
  if (config.geminiKey) engines.push("gemini");

  return {
    engines,
    models: {
      ...(config.openaiKey ? { chatgpt: config.openaiModel } : {}),
      ...(config.geminiKey ? { gemini: config.geminiModel, analysis: config.analysisModel } : {}),
    },

    async ask(engine, question, ctx) {
      if (engine === "chatgpt") {
        if (!config.openaiKey) throw new ApiError("OPENAI_API_KEY manquant");
        const data = await postJson<OpenAiResponse>(
          "https://api.openai.com/v1/responses",
          { authorization: `Bearer ${config.openaiKey}` },
          {
            model: config.openaiModel,
            input: question,
            tools: [
              {
                type: "web_search",
                user_location: { type: "approximate", country: "FR", ...(ctx.city ? { city: ctx.city } : {}) },
              },
            ],
            store: false,
          },
          "ChatGPT",
        );
        return parseOpenAi(data);
      }

      if (!config.geminiKey) throw new ApiError("GEMINI_API_KEY manquant");
      const data = await postJson<GeminiResponse>(
        geminiUrl(config.geminiModel),
        { "x-goog-api-key": config.geminiKey },
        { contents: [{ role: "user", parts: [{ text: question }] }], tools: [{ google_search: {} }] },
        "Gemini",
      );
      return parseGemini(data);
    },

    async extractBusinesses(question, answer) {
      if (!config.geminiKey || !answer.trim()) return { names: [] };
      const data = await postJson<GeminiResponse>(
        geminiUrl(config.analysisModel),
        { "x-goog-api-key": config.geminiKey },
        {
          contents: [
            {
              role: "user",
              parts: [{ text: `${EXTRACTION_PROMPT}\n\nQuestion : ${question}\n\nRéponse :\n"""\n${answer}\n"""` }],
            },
          ],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: { businesses: { type: "ARRAY", items: { type: "STRING" } } },
              required: ["businesses"],
            },
          },
        },
        "Analyse",
      );
      const parsed = parseGemini(data);
      const json = JSON.parse(parsed.text || "{}") as { businesses?: unknown };
      const names = Array.isArray(json.businesses)
        ? json.businesses.filter((n): n is string => typeof n === "string" && n.trim() !== "").map((n) => n.trim())
        : [];
      return { names, usage: parsed.usage };
    },
  };
}
