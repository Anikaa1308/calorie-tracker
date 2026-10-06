"use client";

import { Plus, Star } from "lucide-react";
import { SourceBadge } from "@/components/nutrition/source-badge";
import { formatGrams, formatKcal, formatQuantity } from "@/lib/format";
import { calculateNutrition } from "@/lib/nutrition";
import type { FoodDTO } from "@/lib/types";
import { defaultQuantity } from "./quantity-picker";
import { parseQuantity } from "@/lib/units";

/** "100 g", "1 roti", "2 × roti", "1.5 × cup". */
export function describeQuantity(quantity: number, unit: string): string {
  const q = formatQuantity(quantity);
  if (!unit.startsWith("1 ")) return `${q} ${unit}`;
  return quantity === 1 ? unit : `${q} × ${unit.slice(2)}`;
}

/** Nutrition for the amount a quick-add would log. */
export function quickAmount(food: FoodDTO) {
  const q = defaultQuantity(food);
  const quantity = parseQuantity(q.text) ?? 1;
  const r = food.per100 ? calculateNutrition({ ...food, per100: food.per100 }, quantity, q.unit) : null;
  const label = describeQuantity(quantity, q.unit);
  return { quantity, unit: q.unit, label, result: r };
}

export function FoodRow({
  food,
  onOpen,
  onQuickAdd,
  adding,
  trailing,
}: {
  food: FoodDTO;
  onOpen: () => void;
  onQuickAdd?: () => void;
  adding?: boolean;
  trailing?: React.ReactNode;
}) {
  const { label, result } = quickAmount(food);
  return (
    <li className="group flex items-center gap-2 border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text">
            {food.name}
            {food.isFavorite ? <Star className="ml-1.5 inline size-3 fill-current text-faint" aria-label="Favorite" /> : null}
          </p>
          <p className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted">
            <span className="truncate">
              {food.brand ? `${food.brand} · ` : ""}
              {label}
              {result ? ` · ${formatQuantity(result.grams)} g` : ""}
            </span>
            <SourceBadge source={food.source} confidence={food.confidence} className="shrink-0" />
            {food.addedBy && !food.isOwn ? <span className="min-w-0 truncate text-faint">by {food.addedBy}</span> : null}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {result ? (
            <>
              <p className="tabular text-sm text-text">
                {formatKcal(result.nutrients.calories)} <span className="text-xs text-faint">kcal</span>
              </p>
              <p className="tabular text-xs text-faint">{formatGrams(result.nutrients.protein)} g protein</p>
            </>
          ) : (
            <p className="text-xs text-faint">No nutrition data</p>
          )}
        </div>
      </button>
      {onQuickAdd && result ? (
        <button
          type="button"
          onClick={onQuickAdd}
          disabled={adding}
          aria-label={`Add ${label} of ${food.name}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pill text-text transition-colors hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
        >
          <Plus className="size-4" />
        </button>
      ) : null}
      {trailing}
    </li>
  );
}
