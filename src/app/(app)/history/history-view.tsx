"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { CaloriesChart } from "@/components/charts/calories-chart";
import { WeightChart } from "@/components/charts/weight-chart";
import { PageColumn, PageHeader } from "@/components/layout/page-header";
import { MacroBar } from "@/components/nutrition/macro-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, Panel, SectionLabel, Skeleton } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/segmented";
import { isDateKey, parseDateKey, todayKey } from "@/lib/dates";
import { formatGrams, formatKcal } from "@/lib/format";
import { sumNutrients, scaleNutrients, ZERO } from "@/lib/nutrition";
import { useDeleteWeight, useHistory, useSaveWeight, useWeights, type HistoryDay } from "@/lib/queries/history";
import { useProfile } from "@/lib/queries/profile";
import { kgToLb, lbToKg } from "@/lib/units";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
] as const;

const subscribe = () => () => {};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular mt-1 text-[20px] leading-tight font-bold tracking-tight">{value}</p>
      {sub ? <p className="mt-0.5 truncate text-xs text-faint">{sub}</p> : null}
    </div>
  );
}

function summarize(days: HistoryDay[]) {
  const logged = days.filter((d) => d.itemCount > 0);
  const n = logged.length;
  const avg = n ? scaleNutrients(sumNutrients(logged.map((d) => d.totals)), 1 / n) : ZERO;
  const withGoal = logged.filter((d) => d.goal);
  const avgGoal = withGoal.length ? scaleNutrients(sumNutrients(withGoal.map((d) => d.goal!)), 1 / withGoal.length) : null;
  const onTarget = withGoal.filter((d) => Math.abs(d.totals.calories - d.goal!.calories) <= d.goal!.calories * 0.1).length;
  return { logged: n, avg, avgGoal, onTarget, withGoal: withGoal.length };
}

export function HistoryView() {
  const [range, setRange] = useState<"7" | "30" | "90">("7");
  const today = useSyncExternalStore(subscribe, () => todayKey(), () => null);
  const { data: days, isLoading } = useHistory(today, Number(range));
  const s = days ? summarize(days) : null;

  return (
    <PageColumn>
      <PageHeader
        title="History"
        actions={<Segmented ariaLabel="Range" value={range} onChange={setRange} options={[...RANGES]} size="sm" />}
      />
      <div className="grid gap-8">
        <section>
          <Panel className="p-5">
            {isLoading || !days || !s ? (
              <Skeleton className="h-72 w-full" />
            ) : s.logged === 0 ? (
              <EmptyState
                title="No meals logged in this range"
                body="Your daily totals and averages will show up here."
                action={
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/today">Log today</Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Stat
                    label="Average calories"
                    value={formatKcal(s.avg.calories)}
                    sub={s.avgGoal ? `Target ${formatKcal(s.avgGoal.calories)}` : "kcal a day"}
                  />
                  <Stat label="Average protein" value={`${formatGrams(s.avg.protein)} g`} sub={s.avgGoal ? `Target ${formatGrams(s.avgGoal.protein)} g` : undefined} />
                  <Stat
                    label="Days logged"
                    value={`${s.logged} / ${days.length}`}
                    sub={s.withGoal ? `${s.onTarget} within 10% of target` : undefined}
                  />
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-sage" /> Calories
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-over" /> Over target
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 border-t border-dashed border-muted" /> Target
                    </span>
                  </div>
                  <CaloriesChart days={days} />
                </div>
                <p className="mt-3 text-xs text-faint">Averages count only days with something logged.</p>
              </>
            )}
          </Panel>
        </section>

        {s && s.logged > 0 ? (
          <section>
            <SectionLabel>Average macros</SectionLabel>
            <Panel className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-4">
              <MacroBar nutrient="protein" consumed={s.avg.protein} target={s.avgGoal ? Math.round(s.avgGoal.protein) : null} />
              <MacroBar nutrient="carbs" consumed={s.avg.carbs} target={s.avgGoal ? Math.round(s.avgGoal.carbs) : null} />
              <MacroBar nutrient="fat" consumed={s.avg.fat} target={s.avgGoal ? Math.round(s.avgGoal.fat) : null} />
              <MacroBar nutrient="fiber" consumed={s.avg.fiber} target={s.avgGoal ? Math.round(s.avgGoal.fiber) : null} />
            </Panel>
          </section>
        ) : null}

        <WeightSection />

        {days && s && s.logged > 0 ? (
          <section>
            <details className="group">
              <summary className="label-caps cursor-pointer list-none hover:text-text">
                <span className="group-open:hidden">Show daily table</span>
                <span className="hidden group-open:inline">Hide daily table</span>
              </summary>
              <Panel className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[480px] text-[13px]">
                  <thead>
                    <tr className="text-left text-xs text-faint">
                      <th className="px-4 py-2 font-normal">Day</th>
                      <th className="px-2 py-2 text-right font-normal">Calories</th>
                      <th className="px-2 py-2 text-right font-normal">Protein</th>
                      <th className="px-2 py-2 text-right font-normal">Carbs</th>
                      <th className="px-2 py-2 text-right font-normal">Fat</th>
                      <th className="px-4 py-2 text-right font-normal">Fiber</th>
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    {[...days].reverse().map((d) => (
                      <tr key={d.date} className="border-t border-border">
                        <td className="px-4 py-2">
                          <Link href={`/today?date=${d.date}`} className="hover:underline">
                            {parseDateKey(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </Link>
                        </td>
                        {d.itemCount ? (
                          <>
                            <td className="px-2 py-2 text-right">
                              {formatKcal(d.totals.calories)}
                              {d.goal ? <span className="text-faint"> / {formatKcal(d.goal.calories)}</span> : null}
                            </td>
                            <td className="px-2 py-2 text-right">{formatGrams(d.totals.protein)} g</td>
                            <td className="px-2 py-2 text-right">{formatGrams(d.totals.carbs)} g</td>
                            <td className="px-2 py-2 text-right">{formatGrams(d.totals.fat)} g</td>
                            <td className="px-4 py-2 text-right">{formatGrams(d.totals.fiber)} g</td>
                          </>
                        ) : (
                          <td colSpan={5} className="px-4 py-2 text-right text-faint">
                            Not logged
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </details>
          </section>
        ) : null}
      </div>
    </PageColumn>
  );
}

function WeightSection() {
  const { data: entries } = useWeights();
  const { data: profile } = useProfile();
  const unit = profile?.weightUnit ?? "KG";
  const u = unit === "LB" ? "lb" : "kg";
  const save = useSaveWeight();
  const del = useDeleteWeight();
  const [date, setDate] = useState(() => todayKey());
  const [value, setValue] = useState("");
  const n = Number(value.replace(",", "."));
  const kg = value.trim() && Number.isFinite(n) ? (unit === "LB" ? lbToKg(n) : n) : null;
  const show = (w: number) => `${Math.round((unit === "LB" ? kgToLb(w) : w) * 10) / 10} ${u}`;
  const latest = entries?.at(-1);
  const first = entries?.[0];
  const change = latest && first && latest !== first ? latest.weightKg - first.weightKg : null;

  return (
    <section>
      <SectionLabel>Weight</SectionLabel>
      <Panel className="mt-3 p-5">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!kg || !isDateKey(date)) return;
            save.mutate({ date, weightKg: Math.round(kg * 10) / 10 }, { onSuccess: () => setValue("") });
          }}
        >
          <label className="grid gap-1.5 text-xs text-muted">
            Date
            <Input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </label>
          <label className="grid gap-1.5 text-xs text-muted">
            Weight
            <div className="relative w-28">
              <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="pr-8" placeholder={latest ? show(latest.weightKg).split(" ")[0] : ""} />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">{u}</span>
            </div>
          </label>
          <Button type="submit" disabled={!kg || kg < 25 || kg > 350 || save.isPending}>
            Log weight
          </Button>
        </form>

        {entries && entries.length >= 2 ? (
          <>
            <div className="mt-6 flex items-baseline gap-3">
              <p className="tabular text-[20px] font-semibold">{show(latest!.weightKg)}</p>
              {change != null ? (
                <p className="tabular text-xs text-muted">
                  {change === 0 ? "No change" : `${change > 0 ? "+" : "−"}${show(Math.abs(change))}`} since{" "}
                  {parseDateKey(first!.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              ) : null}
            </div>
            <div className="mt-3">
              <WeightChart entries={entries} unit={unit} />
            </div>
          </>
        ) : (
          <p className="mt-4 text-[13px] text-muted">Log your weight a few times a week to see a trend. Day-to-day changes are mostly water.</p>
        )}

        {entries?.length ? (
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {[...entries]
              .reverse()
              .slice(0, 8)
              .map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2 text-[13px]">
                  <span className="text-muted">
                    {parseDateKey(e.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular">{show(e.weightKg)}</span>
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete weight for ${e.date}`} onClick={() => del.mutate(e.id)}>
                      <Trash2 />
                    </Button>
                  </span>
                </li>
              ))}
          </ul>
        ) : null}
      </Panel>
    </section>
  );
}
