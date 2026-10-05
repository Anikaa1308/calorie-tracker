"use client";

import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatKcal } from "@/lib/format";
import { parseDateKey } from "@/lib/dates";
import type { HistoryDay } from "@/lib/queries/history";

interface Point {
  date: string;
  label: string;
  calories: number | null;
  target: number | null;
  over: boolean;
}

function TooltipBody({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-control border border-border bg-surface px-3 py-2 text-xs shadow-float">
      <p className="font-medium text-text">
        {parseDateKey(p.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      </p>
      <p className="tabular mt-1 text-text">
        {p.calories == null ? "Nothing logged" : `${formatKcal(p.calories)} kcal`}
        {p.target ? <span className="text-muted"> / {formatKcal(p.target)} target</span> : null}
      </p>
      {p.calories != null && p.target ? (
        <p className="tabular text-muted">
          {p.calories > p.target
            ? `${formatKcal(p.calories - p.target)} kcal over`
            : `${formatKcal(p.target - p.calories)} kcal under`}
        </p>
      ) : null}
    </div>
  );
}

export function CaloriesChart({ days }: { days: HistoryDay[] }) {
  const dense = days.length > 31;
  const data: Point[] = days.map((d) => ({
    date: d.date,
    label: parseDateKey(d.date).toLocaleDateString("en-US", days.length <= 7 ? { weekday: "short" } : { month: "short", day: "numeric" }),
    calories: d.itemCount ? Math.round(d.totals.calories) : null,
    target: d.goal?.calories ?? null,
    over: !!d.goal && d.itemCount > 0 && d.totals.calories > d.goal.calories * 1.05,
  }));
  return (
    <div className="h-56 w-full" role="img" aria-label="Daily calories compared with your target. A table of the same data is below.">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barCategoryGap={dense ? 1 : "30%"}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--faint)", fontSize: 11 }}
            interval={days.length <= 7 ? 0 : "preserveStartEnd"}
            minTickGap={16}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--faint)", fontSize: 11 }}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : String(v))}
            width={44}
          />
          <Tooltip content={<TooltipBody />} cursor={{ fill: "var(--subtle)" }} />
          <Bar dataKey="calories" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.date} fill={d.over ? "var(--over)" : "var(--accent)"} />
            ))}
          </Bar>
          <Line
            dataKey="target"
            type="stepAfter"
            stroke="var(--muted)"
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
