/**
 * Relevé automatique ChatGPT / Gemini — lancé par GitHub Actions (.github/workflows/weekly-scan.yml).
 *
 *   npx tsx scripts/scan.ts --mode=test                      # tous les clients « Relevé automatique »
 *   npx tsx scripts/scan.ts --mode=live --company=dgco-fermetures.com
 *   npx tsx scripts/scan.ts --mode=test --company=… --no-save  # essai sans rien enregistrer
 *
 * Variables : SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
 * OPENAI_API_KEY, GEMINI_API_KEY, et en option OPENAI_MODEL, GEMINI_MODEL, GEMINI_ANALYSIS_MODEL.
 */

import { appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

import { createAiClient, DEFAULT_MODELS } from "../src/lib/scan/engines";
import { runScan, type CompanyReport, type ScanMode } from "../src/lib/scan/run";

function arg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length).trim();
}

const env = (name: string) => process.env[name]?.trim() || undefined;

async function main() {
  const mode = (arg("mode") ?? "test") as ScanMode;
  if (mode !== "test" && mode !== "live") throw new Error("--mode doit valoir test ou live");
  const companies = arg("company")?.split(",").map((c) => c.trim()).filter(Boolean);
  const noSave = process.argv.includes("--no-save");

  const url = env("SUPABASE_URL") ?? env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const ai = createAiClient({
    openaiKey: env("OPENAI_API_KEY"),
    geminiKey: env("GEMINI_API_KEY"),
    openaiModel: env("OPENAI_MODEL") ?? DEFAULT_MODELS.openai,
    geminiModel: env("GEMINI_MODEL") ?? DEFAULT_MODELS.gemini,
    analysisModel: env("GEMINI_ANALYSIS_MODEL") ?? DEFAULT_MODELS.analysis,
  });
  if (!ai.engines.includes("chatgpt")) console.warn("⚠ OPENAI_API_KEY absent : ChatGPT n'est pas interrogé.");
  if (!ai.engines.includes("gemini")) console.warn("⚠ GEMINI_API_KEY absent : Gemini n'est pas interrogé, analyse simplifiée.");

  console.log(`Relevé ${mode === "live" ? "PUBLIÉ dans le Cockpit" : "de TEST (Cockpit inchangé)"}${noSave ? ", sans enregistrement" : ""}`);
  console.log(`Modèles : ${Object.entries(ai.models).map(([k, v]) => `${k} = ${v}`).join(" · ")}\n`);

  const reports = await runScan(db, ai, { mode, companies, noSave });
  writeJobSummary(mode, reports);

  if (reports.some((r) => r.status === "error")) process.exitCode = 1;
}

/** Tableau récapitulatif affiché sur la page du relevé dans GitHub Actions. */
function writeJobSummary(mode: ScanMode, reports: CompanyReport[]) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (!file) return;
  const icon = { ok: "✅", partial: "⚠️", error: "❌", skipped: "⏭️" };
  const rows = reports.map((r) => {
    const s = r.summary;
    return `| ${icon[r.status]} ${r.company} | ${s ? `${s.score} %` : "—"} | ${s ? `${s.cited}/${s.answers}` : "—"} | ${s?.first_place ?? "—"} | ${s?.errors ?? "—"} | ${s?.published ? "oui" : "non"} | ${r.detail ?? ""} |`;
  });
  appendFileSync(
    file,
    [
      `## Relevé ${mode === "live" ? "publié" : "de test"} — ${new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}`,
      "",
      "| Client | Score | Cité | 1re place | Erreurs | Publié | Détail |",
      "| --- | --- | --- | --- | --- | --- | --- |",
      ...rows,
      "",
      "Détail question par question : vue admin du portail, onglet « Relevé auto ».",
      "",
    ].join("\n"),
  );
}

main().catch((e) => {
  console.error(`✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
