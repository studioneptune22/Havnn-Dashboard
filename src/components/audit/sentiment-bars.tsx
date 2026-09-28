import { Frown, Meh, Smile } from "lucide-react";

import type { SentimentSnapshot } from "@/types/database";

const SOURCE_LABEL: Record<SentimentSnapshot["source"], string> = {
  google_reviews: "Avis clients (Google)",
  llm_answers: "Réponses des IA (LLM)",
};

const TONES = [
  { key: "positive_pct", label: "Positif", icon: Smile, color: "#10B981", text: "text-emerald-400" },
  { key: "neutral_pct", label: "Neutre", icon: Meh, color: "#4b5160", text: "text-muted-foreground" },
  { key: "critical_pct", label: "Critique", icon: Frown, color: "#F43F5E", text: "text-rose-400" },
] as const;

export function SentimentBars({ snapshots }: { snapshots: SentimentSnapshot[] }) {
  if (snapshots.length === 0) {
    return <p className="text-sm text-muted-foreground">Analyse de sentiment en cours.</p>;
  }
  return (
    <div className="space-y-6">
      {snapshots.map((s) => (
        <div key={s.id} className="space-y-2.5">
          <p className="text-sm font-medium">{SOURCE_LABEL[s.source]}</p>
          {/* Barre empilée, 2px d'écart entre segments */}
          <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label={TONES.map((t) => `${t.label} ${s[t.key]} %`).join(", ")}>
            {TONES.map((t) =>
              Number(s[t.key]) > 0 ? (
                <div key={t.key} style={{ width: `${s[t.key]}%`, backgroundColor: t.color }} />
              ) : null,
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {TONES.map(({ key, label, icon: Icon, text }) => (
              <span key={key} className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className={`h-3.5 w-3.5 ${text}`} />
                {label}
                <span className="font-medium text-foreground tabular">{Number(s[key])}%</span>
              </span>
            ))}
          </div>
          {s.summary && <p className="text-xs leading-relaxed text-muted-foreground">{s.summary}</p>}
        </div>
      ))}
    </div>
  );
}
