import Link from "next/link";
import { CalorieRing } from "@/components/nutrition/calorie-ring";
import { MacroBar } from "@/components/nutrition/macro-bar";
import { Panel } from "@/components/ui/misc";
import { formatKcal } from "@/lib/format";
import type { Nutrients } from "@/lib/nutrition";
import type { GoalDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "over" }) {
  return (
    <div className="rounded-[20px] bg-subtle px-3 py-2.5 text-center">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className={cn("tabular mt-0.5 text-base font-bold tracking-tight", tone === "over" && "text-over")}>{value}</dd>
    </div>
  );
}

export function DaySummary({ totals, goal, compact }: { totals: Nutrients; goal: GoalDTO | null; compact?: boolean }) {
  const target = goal?.calories ?? 0;
  const remaining = target - totals.calories;
  return (
    <Panel className="p-5 sm:p-6" aria-label="Daily progress">
      <div className="flex flex-col items-center gap-6">
        <CalorieRing
          consumed={totals.calories}
          target={target}
          macros={{
            protein: { consumed: totals.protein, target: goal?.protein ?? null },
            carbs: { consumed: totals.carbs, target: goal?.carbs ?? null },
            fat: { consumed: totals.fat, target: goal?.fat ?? null },
            fiber: { consumed: totals.fiber, target: goal?.fiber ?? null },
          }}
          size={compact ? 248 : 264}
        />
        <dl className={cn("grid w-full gap-2", goal ? "grid-cols-3" : "grid-cols-1")}>
          {goal ? (
            <>
              <Stat label="Goal" value={formatKcal(target)} />
              <Stat label="Eaten" value={formatKcal(totals.calories)} />
              <Stat
                label={remaining < 0 ? "Over" : "Left"}
                value={formatKcal(Math.abs(remaining))}
                tone={remaining < -target * 0.05 ? "over" : undefined}
              />
            </>
          ) : (
            <div className="text-center">
              <dt className="text-xs text-muted">Eaten</dt>
              <dd className="tabular mt-0.5 text-base font-bold">{formatKcal(totals.calories)} kcal</dd>
              <p className="mt-3 text-[13px] text-muted">
                Set your daily targets to see what&apos;s left.{" "}
                <Link href="/onboarding" className="font-semibold text-accent underline underline-offset-4">
                  Set targets
                </Link>
              </p>
            </div>
          )}
        </dl>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
        <MacroBar nutrient="protein" consumed={totals.protein} target={goal?.protein ?? null} />
        <MacroBar nutrient="carbs" consumed={totals.carbs} target={goal?.carbs ?? null} />
        <MacroBar nutrient="fat" consumed={totals.fat} target={goal?.fat ?? null} />
        <MacroBar nutrient="fiber" consumed={totals.fiber} target={goal?.fiber ?? null} />
      </div>
    </Panel>
  );
}
