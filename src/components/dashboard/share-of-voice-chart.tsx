"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ShareOfVoice } from "@/types/database";

import { ChartLegend, ChartTooltip } from "./chart-tooltip";
import { ACTIVE_ENGINES as ENGINES, CHART, ENGINE_COLORS, ENGINE_LABELS } from "./chart-theme";

export function ShareOfVoiceChart({ data }: { data: ShareOfVoice[] }) {
  const promptsTotal = data[0]?.prompts_total ?? 20;
  const rows = data.map((b) => ({
    brand: b.is_client ? `${b.brand_name} (vous)` : b.brand_name,
    isClient: b.is_client,
    chatgpt: b.chatgpt_mentions,
    perplexity: b.perplexity_mentions,
    gemini: b.gemini_mentions,
  }));

  return (
    <div className="space-y-3">
      <ChartLegend items={ENGINES.map((e) => ({ label: ENGINE_LABELS[e], color: ENGINE_COLORS[e] }))} />
      <div className="-mx-1 overflow-x-auto scrollbar-thin">
        <div className="h-[340px] min-w-[520px] px-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -24 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis
              dataKey="brand"
              tickLine={false}
              axisLine={false}
              interval={0}
              height={40}
              tick={(props) => <BrandTick {...props} />}
            />
            <YAxis
              domain={[0, promptsTotal]}
              ticks={[0, 5, 10, 15, 20].filter((t) => t <= promptsTotal)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: CHART.axis, fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              content={<ChartTooltip valueFormatter={(v) => `${v} / ${promptsTotal} prompts`} />}
            />
            {ENGINES.map((e) => (
              <Bar
                key={e}
                dataKey={e}
                name={ENGINE_LABELS[e]}
                fill={ENGINE_COLORS[e]}
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

interface TickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
}

/** Libellé d'axe sur 2 lignes, marque cliente mise en avant. */
function BrandTick({ x = 0, y = 0, payload }: TickProps) {
  const value = payload?.value ?? "";
  const isClient = value.endsWith("(vous)");
  const name = value.replace(" (vous)", "");
  const words = name.split(" ");
  const mid = Math.ceil(words.length / 2);
  const lines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")].filter(Boolean);

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={12 + i * 13}
          textAnchor="middle"
          fontSize={11}
          fontWeight={isClient ? 600 : 400}
          fill={isClient ? CHART.text : CHART.axis}
        >
          {line}
        </text>
      ))}
    </g>
  );
}
