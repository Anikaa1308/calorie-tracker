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
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={cn("tabular mt-0.5 text-base font-medium", tone === "over" && "text-over")}>{value}</dd>
    </div>
  );
}

export function DaySummary({ totals, goal, compact }: { totals: Nutrients; goal: GoalDTO | null; compact?: boolean }) {
  const target = goal?.calories ?? 0;
  const remaining = target - totals.calories;
  return (
    <Panel className="p-5" aria-label="Daily progress">
      <div className={cn("flex items-center gap-5 sm:gap-8", compact && "xl:flex-col xl:gap-6")}>
        <CalorieRing consumed={totals.calories} target={target} size={128} stroke={8} />
        <dl className={cn("grid flex-1 gap-3 sm:gap-4", goal ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1", compact && "xl:w-full xl:grid-cols-3")}>
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
            <div>
              <dt className="text-xs text-muted">Eaten</dt>
              <dd className="tabular mt-0.5 text-base font-medium">{formatKcal(totals.calories)} kcal</dd>
              <p className="mt-3 text-[13px] text-muted">
                Set your daily targets to see what&apos;s left.{" "}
                <Link href="/onboarding" className="font-medium text-accent hover:underline">
                  Set targets
                </Link>
              </p>
            </div>
          )}
        </dl>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
        <MacroBar nutrient="protein" consumed={totals.protein} target={goal?.protein ?? null} />
        <MacroBar nutrient="carbs" consumed={totals.carbs} target={goal?.carbs ?? null} />
        <MacroBar nutrient="fat" consumed={totals.fat} target={goal?.fat ?? null} />
        <MacroBar nutrient="fiber" consumed={totals.fiber} target={goal?.fiber ?? null} />
      </div>
    </Panel>
  );
}
