import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function PillarCard({
  index,
  title,
  description,
  icon: Icon,
  score,
  children,
}: {
  index: number;
  title: string;
  description: string;
  icon: LucideIcon;
  /** 0–100 */
  score: number;
  children: React.ReactNode;
}) {
  const color = score >= 90 ? "bg-havnn-emerald" : score >= 60 ? "bg-havnn-blue" : "bg-havnn-amber";
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border bg-background/50">
              <Icon className="h-5 w-5 text-havnn-blue" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pilier {index}</p>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold tabular">{score}%</div>
            <div className="text-[11px] text-muted-foreground">conformité</div>
          </div>
        </div>
        <Progress value={score} className="mt-3 h-1.5" indicatorClassName={color} />
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}
