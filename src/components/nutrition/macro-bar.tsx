import { ProgressBar } from "@/components/ui/progress";
import { describeRemaining, formatNutrient, NUTRIENT_LABEL } from "@/lib/format";
import type { NutrientKey } from "@/lib/nutrition";
import { cn } from "@/lib/cn";

export const MACRO_COLOR: Record<Exclude<NutrientKey, "calories">, string> = {
  protein: "var(--protein)",
  carbs: "var(--carbs)",
  fat: "var(--fat)",
  fiber: "var(--fiber)",
};

export function MacroBar({
  nutrient,
  consumed,
  target,
  className,
}: {
  nutrient: Exclude<NutrientKey, "calories">;
  consumed: number;
  target: number | null;
  className?: string;
}) {
  const label = NUTRIENT_LABEL[nutrient];
  const hasTarget = target != null && target > 0;
  const remaining = hasTarget ? target - consumed : 0;
  const over = hasTarget && consumed > target * 1.05;
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="flex min-w-0 items-center gap-1.5 truncate font-medium text-muted">
          <span className="size-2.5 rounded-full" style={{ background: MACRO_COLOR[nutrient] }} aria-hidden />
          {label}
        </span>
        <span className="tabular whitespace-nowrap">
          <span className="font-bold text-text">{formatNutrient(nutrient, consumed)}</span>
          {hasTarget ? <span className="text-faint"> / {target} g</span> : <span className="text-faint"> g</span>}
        </span>
      </div>
      <ProgressBar
        className="mt-1.5"
        value={consumed}
        max={hasTarget ? target : 0}
        color={MACRO_COLOR[nutrient]}
        label={label}
        valueText={
          hasTarget
            ? `${formatNutrient(nutrient, consumed)} of ${target} grams, ${describeRemaining(nutrient, remaining, target)}`
            : `${formatNutrient(nutrient, consumed)} grams`
        }
      />
      {hasTarget ? (
        <p className={cn("mt-1 text-xs tabular", over ? "text-over" : "text-faint")}>
          {describeRemaining(nutrient, remaining, target)}
        </p>
      ) : null}
    </div>
  );
}
