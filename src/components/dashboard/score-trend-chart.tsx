"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { GeoScore } from "@/types/database";

import { ChartLegend, ChartTooltip } from "./chart-tooltip";
import { CHART } from "./chart-theme";

const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" });

const SERIES = [
  { key: "score", label: "Score de Dominance GEO", color: "#3987e5" },
  { key: "presence", label: "Taux de Présence IA", color: "#d95926" },
] as const;

export function ScoreTrendChart({ data }: { data: GeoScore[] }) {
  const rows = data.map((s) => ({
    date: monthFmt.format(new Date(s.recorded_at)),
    score: Number(s.score_percentage),
    presence: Number(s.ai_presence_rate),
  }));

  return (
    <div className="space-y-3">
      <ChartLegend items={SERIES.map((s) => ({ label: s.label, color: s.color }))} />
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: CHART.axis, fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              cursor={{ stroke: CHART.axis, strokeDasharray: "3 3" }}
              content={<ChartTooltip valueFormatter={(v) => `${v.toLocaleString("fr-FR")} %`} />}
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: CHART.surface, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
