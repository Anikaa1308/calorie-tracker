"use client";

import { ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { NutritionTable } from "@/components/nutrition/nutrition-table";
import { SourceBadge, sourceHint } from "@/components/nutrition/source-badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { useToggleFavorite } from "@/lib/queries/foods";
import { cn } from "@/lib/cn";
import { formatGrams, formatKcal, formatQuantity } from "@/lib/format";
import { calculateNutrition } from "@/lib/nutrition";
import { MEAL_LABEL, MEAL_TYPES, type FoodDTO, type MealTypeCode } from "@/lib/types";
import { parseQuantity } from "@/lib/units";
import { MACRO_COLOR } from "@/components/nutrition/macro-bar";
import { defaultQuantity, QuantityPicker, type QuantityState } from "./quantity-picker";

export interface FoodDetailSubmit {
  quantity: number;
  unit: string;
  meal: MealTypeCode;
}

export function FoodDetail({
  food,
  meal,
  onBack,
  onSubmit,
  submitting,
  submitLabel,
  initial,
  extraActions,
}: {
  food: FoodDTO;
  meal: MealTypeCode;
  onBack?: () => void;
  onSubmit: (v: FoodDetailSubmit) => void;
  submitting?: boolean;
  submitLabel?: (meal: MealTypeCode) => string;
  initial?: QuantityState;
  extraActions?: React.ReactNode;
}) {
  const [q, setQ] = useState<QuantityState>(() => initial ?? defaultQuantity(food));
  const [mealType, setMealType] = useState<MealTypeCode>(meal);
  const [fav, setFav] = useState(!!food.isFavorite);
  const toggleFav = useToggleFavorite();

  const quantity = parseQuantity(q.text);
  const result = food.per100 && quantity ? calculateNutrition({ ...food, per100: food.per100 }, quantity, q.unit) : null;
  const canSubmit = !!result && !submitting;
  const isLocal = !food.id.startsWith("ext:");

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit && quantity) onSubmit({ quantity, unit: q.unit, meal: mealType });
      }}
    >
      <div className="flex items-start gap-2">
        {onBack ? (
          <Button variant="dashed" size="icon-sm" onClick={onBack} aria-label="Back to results">
            <ArrowLeft />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-text">{food.name}</h3>
          <p className="mt-0.5 text-[13px] text-muted">{[food.brand, food.category].filter(Boolean).join(" · ")}</p>
        </div>
        {isLocal ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={fav}
            aria-label={fav ? "Remove from favorites" : "Save to favorites"}
            onClick={() => {
              setFav(!fav);
              toggleFav.mutate({ id: food.id, favorite: !fav });
            }}
          >
            <Star className={cn(fav && "fill-current text-carbs")} />
          </Button>
        ) : null}
      </div>

      <div className="mt-2 rounded-control bg-subtle px-3 py-2">
        <SourceBadge source={food.source} confidence={food.confidence} withPrefix />
        <p className="mt-1 text-xs text-muted">{food.sourceNote ?? sourceHint(food.source)}</p>
        {food.addedBy ? (
          <p className="mt-1 text-xs text-muted">
            {food.isOwn ? "You added this, and everyone using Plate can find it." : `Added by ${food.addedBy}. Only they can edit it.`}
          </p>
        ) : null}
      </div>

      {food.per100 ? (
        <>
          <div className="mt-5">
            <QuantityPicker food={food} value={q} onChange={setQ} autoFocus />
          </div>

          <div className="mt-5 rounded-panel border border-border p-4" aria-live="polite">
            {result ? (
              <>
                <div className="flex items-baseline justify-between">
                  <p>
                    <span className="tabular text-[28px] leading-none font-bold tracking-tight">
                      {formatKcal(result.nutrients.calories)}
                    </span>{" "}
                    <span className="text-muted">kcal</span>
                  </p>
                  <p className="tabular text-xs text-faint">{formatQuantity(result.grams)} g</p>
                </div>
                <dl className="mt-4 grid grid-cols-4 gap-2">
                  {(["protein", "carbs", "fat", "fiber"] as const).map((k) => (
                    <div key={k}>
                      <dt className="flex items-center gap-1 text-xs text-muted">
                        <span className="size-1.5 rounded-full" style={{ background: MACRO_COLOR[k] }} />
                        {k[0].toUpperCase() + k.slice(1)}
                      </dt>
                      <dd className="tabular mt-0.5 text-sm font-medium">{formatGrams(result.nutrients[k])} g</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="text-[13px] text-muted">Enter an amount to see the nutrition.</p>
            )}
          </div>

          <details className="group mt-4">
            <summary className="cursor-pointer list-none text-xs text-muted hover:text-text">
              <span className="group-open:hidden">Show per 100 {food.basis === "PER_100ML" ? "ml" : "g"}</span>
              <span className="hidden group-open:inline">Hide per 100 {food.basis === "PER_100ML" ? "ml" : "g"}</span>
            </summary>
            <div className="mt-2">
              <NutritionTable
                columns={[
                  ...(result ? [{ label: "This amount", values: result.nutrients }] : []),
                  { label: `Per 100 ${food.basis === "PER_100ML" ? "ml" : "g"}`, values: food.per100 },
                ]}
              />
            </div>
          </details>
        </>
      ) : (
        <div className="mt-5 rounded-panel border border-dashed border-border-strong p-4">
          <p className="text-sm font-medium">Nutrition information isn&apos;t available</p>
          <p className="mt-1 text-[13px] text-muted">
            We won&apos;t guess. Add it from the pack label as your own food and it&apos;ll be ready to log.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-3">
            <Link href={`/foods/new?name=${encodeURIComponent(food.name)}${food.brand ? `&brand=${encodeURIComponent(food.brand)}` : ""}${food.barcode ? `&barcode=${food.barcode}` : ""}`}>
              Add from label
            </Link>
          </Button>
        </div>
      )}

      {extraActions}

      <div className="mt-auto pt-6">
        <div className="flex gap-2">
          <NativeSelect
            aria-label="Meal"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealTypeCode)}
            className="w-36 shrink-0"
          >
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>
                {MEAL_LABEL[m]}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" className="flex-1" disabled={!canSubmit}>
            {submitLabel ? submitLabel(mealType) : `Add to ${MEAL_LABEL[mealType].toLowerCase()}`}
          </Button>
        </div>
      </div>
    </form>
  );
}
