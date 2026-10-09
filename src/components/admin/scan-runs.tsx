import { ExternalLink } from "lucide-react";

import { Snippet } from "@/components/prompts/snippet";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminClientData } from "@/lib/data/admin";
import { SCAN_ENGINES, type EngineResult, type ScanEngine, type ScanSummary } from "@/lib/scan/types";
import { cn, formatDateTime } from "@/lib/utils";
import type { AiCitationStatus, ScanRun } from "@/types/database";

const ENGINE: Record<ScanEngine, string> = { chatgpt: "ChatGPT", gemini: "Gemini" };
const STATUS = {
  ok: { label: "Complet", variant: "success" },
  partial: { label: "Partiel", variant: "warning" },
  error: { label: "Échec", variant: "danger" },
} as const;

function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

const hasSummary = (s: ScanRun["summary"]): s is ScanSummary => "score" in s;

function Position({ status, position }: { status: AiCitationStatus | EngineResult["status"] | undefined; position: number | null | undefined }) {
  if (!status || status === "pending") return <span className="text-muted-foreground">…</span>;
  if (status === "error") return <span className="text-rose-400">erreur</span>;
  if (status === "not_cited") return <span className="text-muted-foreground">—</span>;
  return <span className="font-medium text-emerald-400">{position ? `${position}e` : "cité"}</span>;
}

/** Historique des relevés automatiques du client. */
export function ScanRunsTable({ runs }: { runs: AdminClientData["runs"] }) {
  if (runs.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Aucun relevé automatique pour ce client.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>État</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Cité</TableHead>
            <TableHead className="text-right">1re place</TableHead>
            <TableHead className="text-right">Erreurs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => {
            const s = hasSummary(run.summary) ? run.summary : null;
            return (
              <TableRow key={run.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(run.created_at)}</TableCell>
                <TableCell>
                  <Badge variant={run.mode === "live" ? "default" : "outline"}>
                    {run.mode === "live" ? (s?.published ? "Publié" : "Live non publié") : "Test"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS[run.status].variant} title={run.error ?? undefined}>
                    {STATUS[run.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{s ? `${s.score} %` : "—"}</TableCell>
                <TableCell className="text-right">{s ? `${s.cited}/${s.answers}` : "—"}</TableCell>
                <TableCell className="text-right">{s?.first_place ?? "—"}</TableCell>
                <TableCell className="text-right">{s?.errors ?? "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Détail du dernier relevé : chiffres, part de voix et réponses question par question,
 * comparées au Cockpit actuel (relevé manuel tant que le mode test est actif).
 */
export function ScanRunDetail({
  run,
  cockpitScore,
  prompts,
}: {
  run: ScanRun;
  cockpitScore: number | null;
  prompts: AdminClientData["prompts"];
}) {
  if (!hasSummary(run.summary)) {
    return <p className="text-sm text-rose-400">Relevé en échec : {run.error ?? "erreur inconnue"}.</p>;
  }
  const s = run.summary;
  const cockpit = new Map(prompts.map((p) => [p.prompt_text, p]));
  const engines = SCAN_ENGINES.filter((e) => run.results.some((r) => r.engines[e]));
  const compare = run.mode === "test";

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Score", `${s.score} %`, compare && cockpitScore !== null ? `Cockpit : ${cockpitScore} %` : null],
          ["Taux de citation", `${s.ai_presence_rate} %`, `${s.cited} réponses sur ${s.answers}`],
          ["Top 3", `${s.top3_rate} %`, `${s.first_place} fois 1er`],
          [
            "Par moteur",
            engines.map((e) => `${ENGINE[e]} ${s[`${e}_presence_rate`] ?? "—"} %`).join(" · "),
            `Note ${s.google_rating ?? "—"} · NAP ${s.nap_conformity ?? 0} %`,
          ],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-lg border bg-background/40 p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-lg font-semibold">{value}</dd>
            {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
          </div>
        ))}
      </dl>

      <div>
        <h3 className="mb-2 text-sm font-medium">Part de voix ({s.questions} questions)</h3>
        <div className="flex flex-wrap gap-2">
          {[...s.share_of_voice]
            .sort((a, b) => b.chatgpt + b.gemini - (a.chatgpt + a.gemini))
            .map((b) => (
              <span
                key={b.name}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs",
                  b.is_client ? "border-havnn-blue/40 bg-havnn-blue/10 text-blue-200" : "text-muted-foreground",
                )}
              >
                {b.name} · {engines.map((e) => b[e]).join(" / ")}
              </span>
            ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Nombre de réponses qui citent la marque ({engines.map((e) => ENGINE[e]).join(" / ")}).</p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Question par question</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Position du client dans chaque réponse{compare ? ", comparée au Cockpit actuel (relevé manuel)" : ""}. Cliquez sur une
          question pour lire les réponses complètes et les sources.
        </p>
        <ul className="divide-y rounded-lg border">
          {run.results.map((r) => {
            const manual = cockpit.get(r.question);
            return (
              <li key={r.question}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-col gap-2 p-3 hover:bg-accent/40 sm:flex-row sm:items-center">
                    <span className="flex-1 text-sm">{r.question}</span>
                    <span className="flex shrink-0 gap-4 text-xs">
                      {engines.map((e) => (
                        <span key={e} className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">{ENGINE[e]}</span>
                          <Position status={r.engines[e]?.status} position={r.engines[e]?.position} />
                          {compare && manual && (
                            <span className="text-muted-foreground">
                              (cockpit <Position status={manual[`${e}_status`]} position={manual[`${e}_position`]} />)
                            </span>
                          )}
                        </span>
                      ))}
                    </span>
                  </summary>
                  <div className="grid gap-4 border-t bg-background/30 p-3 lg:grid-cols-2">
                    {engines.map((e) => {
                      const res = r.engines[e];
                      if (!res) return null;
                      return (
                        <div key={e} className="min-w-0 space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wider text-havnn-blue">{ENGINE[e]}</p>
                          {res.status === "error" ? (
                            <p className="text-sm text-rose-400">{res.error}</p>
                          ) : (
                            <>
                              {res.snippet && <Snippet text={res.snippet} />}
                              {res.ranking.length > 0 && (
                                <p className="text-xs text-muted-foreground">Entreprises citées : {res.ranking.join(", ")}</p>
                              )}
                              <details>
                                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                  Réponse complète
                                </summary>
                                <p className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md border bg-background/60 p-2 text-xs text-foreground/80">
                                  {res.answer}
                                </p>
                              </details>
                              {res.sources.length > 0 && (
                                <ul className="space-y-0.5">
                                  {res.sources.slice(0, 8).map((src) => (
                                    <li key={src.url} className="truncate text-xs">
                                      <a href={src.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                        {src.title || hostOf(src.url)}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Modèles : {Object.entries(s.models).map(([k, v]) => `${k} ${v}`).join(" · ")} · durée {s.duration_s} s ·{" "}
        {Object.entries(s.usage)
          .map(([k, u]) => `${k} ${u.calls} appels`)
          .join(" · ")}
      </p>
    </div>
  );
}
