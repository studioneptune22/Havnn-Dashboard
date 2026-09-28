import type { Metadata } from "next";
import { Crown, MessageSquareText, Target, TrendingUp } from "lucide-react";

import { ACTIVE_ENGINES_LABEL } from "@/components/dashboard/chart-theme";
import { PageHeader } from "@/components/dashboard/page-header";
import { ENGINES, promptOutcome } from "@/components/prompts/prompt-utils";
import { PromptsTable } from "@/components/prompts/prompts-table";
import { Card } from "@/components/ui/card";
import { getPrompts, getSession } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Benchmark IA & Prompts" };

export default async function GeoPromptsPage() {
  const { company } = await getSession();
  const prompts = await getPrompts(company.id);

  const scanned = prompts.filter((p) => promptOutcome(p) !== "pending");
  const citedSomewhere = scanned.filter((p) => promptOutcome(p) !== "missed").length;
  const topOne = scanned.filter((p) => p.position === 1).length;
  const citations = scanned.flatMap((p) => ENGINES.map((e) => p[`${e}_status`])).filter((s) => s !== "pending");
  const citationRate = citations.length
    ? Math.round((citations.filter((s) => s === "cited").length / citations.length) * 100)
    : 0;

  const stats = [
    { label: "Prompts suivis", value: prompts.length, icon: MessageSquareText },
    { label: "Prompts avec citation", value: `${citedSomewhere} / ${scanned.length}`, icon: Target },
    { label: "Taux de citation global", value: `${citationRate} %`, icon: TrendingUp },
    { label: "Citée en 1ʳᵉ position", value: topOne, icon: Crown },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Benchmark IA"
        title="Prompts métiers"
        description={`Les questions que vos clients posent aux IA génératives. Chaque semaine, HAVNN vérifie si ${company.name} est citée par ${ACTIVE_ENGINES_LABEL}. Cliquez sur une ligne pour lire l'extrait de réponse.`}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg border bg-background/50">
              <Icon className="h-4 w-4 text-havnn-blue" />
            </div>
            <div>
              <div className="text-lg font-semibold tabular">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </Card>
        ))}
      </div>

      <PromptsTable prompts={prompts} />
    </>
  );
}
