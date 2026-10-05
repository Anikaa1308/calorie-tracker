import { ACTIVITY_FACTOR, ACTIVITY_LABEL, GOAL_LABEL, MAX_DEFICIT_KCAL, RATE_LABEL, type BodyInput, type GoalResult } from "@/lib/goals";
import { formatKcal } from "@/lib/format";

function Row({ label, detail, value }: { label: string; detail?: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border py-2.5 first:border-t-0">
      <div className="min-w-0">
        <p className="text-[13px] text-text">{label}</p>
        {detail ? <p className="text-xs text-muted">{detail}</p> : null}
      </div>
      <p className="tabular shrink-0 text-[13px] font-medium">{value}</p>
    </div>
  );
}

/** Step-by-step explanation of how the recommendation was reached. */
export function TargetsExplainer({ input, result }: { input: BodyInput; result: GoalResult }) {
  const adj =
    input.goal === "LOSE"
      ? `${RATE_LABEL[input.rate ?? "MODERATE"].label} loss${result.deficitCapped ? `, deficit capped at ${MAX_DEFICIT_KCAL} kcal` : ""}`
      : GOAL_LABEL[input.goal].label;
  const diff = result.adjustedCalories - result.tdee;
  return (
    <div>
      <Row
        label="Resting energy (BMR)"
        detail={`Mifflin–St Jeor: 10 × ${input.weightKg} kg + 6.25 × ${input.heightCm} cm − 5 × ${input.age} ${input.sex === "MALE" ? "+ 5" : "− 161"}`}
        value={`${formatKcal(result.bmr)} kcal`}
      />
      <Row
        label="Daily energy (TDEE)"
        detail={`BMR × ${ACTIVITY_FACTOR[input.activity]} for ${ACTIVITY_LABEL[input.activity].label.toLowerCase()}`}
        value={`${formatKcal(result.tdee)} kcal`}
      />
      <Row
        label="Goal adjustment"
        detail={adj}
        value={diff === 0 ? "±0 kcal" : `${diff > 0 ? "+" : "−"}${formatKcal(Math.abs(diff))} kcal`}
      />
      {result.floorApplied ? (
        <p className="my-2 rounded-control bg-over-soft px-3 py-2 text-xs text-text">
          Raised to a safe minimum. Plate doesn&apos;t recommend eating below your BMR or{" "}
          {input.sex === "MALE" ? "1,500" : "1,200"} kcal a day without medical supervision.
        </p>
      ) : null}
      <Row label="Daily calories" detail="Rounded to the nearest 10" value={`${formatKcal(result.calories)} kcal`} />
      <Row
        label="Protein"
        detail={`${result.proteinPerKg} g per kg of ${result.referenceWeightKg !== input.weightKg ? `reference weight (${result.referenceWeightKg} kg, BMI 25)` : "body weight"}, max 35 % of calories`}
        value={`${result.protein} g`}
      />
      <Row label="Fat" detail="At least 25 % of calories and 0.6 g per kg" value={`${result.fat} g`} />
      <Row label="Carbs" detail="The calories left after protein and fat" value={`${result.carbs} g`} />
      <Row label="Fiber" detail="14 g per 1,000 kcal, at least 25 g" value={`${result.fiber} g`} />
    </div>
  );
}
