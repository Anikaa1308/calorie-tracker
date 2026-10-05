"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { parseDateKey } from "@/lib/dates";
import type { WeightEntry } from "@/lib/queries/history";
import { kgToLb } from "@/lib/units";

export function WeightChart({ entries, unit }: { entries: WeightEntry[]; unit: "KG" | "LB" }) {
  const data = entries.map((e) => ({
    date: e.date,
    label: parseDateKey(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: Math.round((unit === "LB" ? kgToLb(e.weightKg) : e.weightKg) * 10) / 10,
  }));
  const values = data.map((d) => d.weight);
  const lo = Math.floor(Math.min(...values) - 0.5);
  const hi = Math.ceil(Math.max(...values) + 0.5);
  const step = Math.max(1, Math.ceil((hi - lo) / 4));
  const ticks = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const u = unit === "LB" ? "lb" : "kg";
  return (
    <div className="h-48 w-full" role="img" aria-label="Weight over time. The entries are also listed below.">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--faint)", fontSize: 11 }} minTickGap={24} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--faint)", fontSize: 11 }}
            domain={[lo, ticks[ticks.length - 1]]}
            ticks={ticks}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: "var(--border-strong)" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-control border border-border bg-surface px-3 py-2 text-xs shadow-float">
                  <p className="font-medium">{parseDateKey(payload[0].payload.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  <p className="tabular mt-0.5">
                    {payload[0].payload.weight} {u}
                  </p>
                </div>
              ) : null
            }
          />
          <Line
            dataKey="weight"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            dot={{ r: 4, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
