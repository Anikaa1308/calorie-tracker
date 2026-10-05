"use client";

import { DropdownMenu } from "radix-ui";
import { Copy, MoreHorizontal, Plus } from "lucide-react";
import { describeQuantity } from "@/components/food-search/food-row";
import { MacroLine } from "@/components/nutrition/macro-line";
import { Button } from "@/components/ui/button";
import { formatKcal, formatQuantity } from "@/lib/format";
import { sumNutrients } from "@/lib/nutrition";
import { MEAL_LABEL, type MealItemDTO, type MealTypeCode } from "@/lib/types";

const describeAmount = (i: MealItemDTO) => describeQuantity(i.quantity, i.unit);

export function MealItemRow({ item, onOpen, fresh }: { item: MealItemDTO; onOpen: () => void; fresh?: boolean }) {
  return (
    <li className={fresh ? "animate-row-added" : undefined}>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle/60"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text">{item.foodName}</p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {item.brandName ? `${item.brandName} · ` : ""}
            {describeAmount(item)}
            {item.unit !== "g" ? ` · ${formatQuantity(item.grams)} g` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="tabular text-sm">{formatKcal(item.nutrients.calories)}</p>
          <MacroLine n={item.nutrients} className="hidden sm:inline" />
        </div>
      </button>
    </li>
  );
}

export function MealSection({
  meal,
  items,
  onAdd,
  onOpenItem,
  onCopyFromYesterday,
  freshIds,
}: {
  meal: MealTypeCode;
  items: MealItemDTO[];
  onAdd: () => void;
  onOpenItem: (i: MealItemDTO) => void;
  onCopyFromYesterday: () => void;
  freshIds?: ReadonlySet<string>;
}) {
  const total = sumNutrients(items.map((i) => i.nutrients));
  return (
    <section aria-labelledby={`meal-${meal}`} className="rounded-panel border border-border bg-surface">
      <header className="flex items-center gap-2 py-2.5 pr-2 pl-4">
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <h2 id={`meal-${meal}`} className="text-sm font-semibold">
            {MEAL_LABEL[meal]}
          </h2>
          {items.length ? (
            <span className="tabular text-xs text-muted">{formatKcal(total.calories)} kcal</span>
          ) : null}
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`${MEAL_LABEL[meal]} options`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="animate-fade-in z-50 min-w-48 rounded-control border border-border bg-surface p-1 shadow-float"
            >
              <DropdownMenu.Item
                onSelect={onCopyFromYesterday}
                className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-2 text-[13px] outline-none data-[highlighted]:bg-subtle"
              >
                <Copy className="size-3.5 text-muted" />
                Copy from previous day
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <Button variant="ghost" size="sm" onClick={onAdd} aria-label={`Add food to ${MEAL_LABEL[meal]}`}>
          <Plus />
          Add
        </Button>
      </header>
      {items.length ? (
        <>
          <ul className="divide-y divide-border border-t border-border">
            {items.map((i) => (
              <MealItemRow key={i.id} item={i} onOpen={() => onOpenItem(i)} fresh={freshIds?.has(i.id)} />
            ))}
          </ul>
          {items.length > 1 ? (
            <div className="flex justify-end border-t border-border px-4 py-2">
              <MacroLine n={total} />
            </div>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="w-full border-t border-dashed border-border px-4 py-3 text-left text-[13px] text-faint transition-colors hover:text-muted"
        >
          Nothing logged yet
        </button>
      )}
    </section>
  );
}
