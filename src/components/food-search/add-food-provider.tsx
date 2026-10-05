"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { todayKey } from "@/lib/dates";
import { useAddEntry } from "@/lib/queries/diary";
import { MEAL_LABEL, type FoodDTO, type MealTypeCode } from "@/lib/types";
import { FoodDetail } from "./food-detail";
import { quickAmount } from "./food-row";
import { SearchPanel } from "./search-panel";

/** A sensible default meal for the time of day. */
export function mealForNow(d = new Date()): MealTypeCode {
  const h = d.getHours();
  if (h < 11) return "BREAKFAST";
  if (h < 16) return "LUNCH";
  if (h >= 18 && h < 23) return "DINNER";
  return "SNACKS";
}

interface AddFoodContextValue {
  /** Open the add-food sheet. Optionally jump straight to a food. */
  openAddFood: (opts?: { meal?: MealTypeCode; date?: string; food?: FoodDTO }) => void;
  activeDate: string | null;
  setActiveDate: (d: string) => void;
}

const AddFoodContext = createContext<AddFoodContextValue | null>(null);

export function useAddFood() {
  const ctx = useContext(AddFoodContext);
  if (!ctx) throw new Error("useAddFood must be used inside AddFoodProvider");
  return ctx;
}

export function AddFoodProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [meal, setMeal] = useState<MealTypeCode>("BREAKFAST");
  const [date, setDate] = useState<string>("");
  const [selected, setSelected] = useState<FoodDTO | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const add = useAddEntry();

  const openAddFood = useCallback<AddFoodContextValue["openAddFood"]>(
    (opts) => {
      setMeal(opts?.meal ?? mealForNow());
      setDate(opts?.date ?? activeDate ?? todayKey());
      setSelected(opts?.food ?? null);
      setOpen(true);
    },
    [activeDate],
  );

  const value = useMemo(() => ({ openAddFood, activeDate, setActiveDate }), [openAddFood, activeDate]);

  const quickAdd = (food: FoodDTO) => {
    const { quantity, unit } = quickAmount(food);
    setAddingId(food.id);
    add.mutate(
      { date, meal, foodId: food.id, quantity, unit, foodName: food.name },
      { onSettled: () => setAddingId(null) },
    );
  };

  const dateLabel = date && date !== todayKey() ? ` · ${new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "";

  return (
    <AddFoodContext.Provider value={value}>
      {children}
      <Sheet
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSelected(null);
        }}
        title={selected ? selected.name : `Add to ${MEAL_LABEL[meal].toLowerCase()}${dateLabel}`}
        hideTitle={!!selected}
      >
        {selected ? (
          <FoodDetail
            key={selected.id}
            food={selected}
            meal={meal}
            onBack={() => setSelected(null)}
            submitting={add.isPending}
            onSubmit={(v) => {
              add.mutate(
                { date, meal: v.meal, foodId: selected.id, quantity: v.quantity, unit: v.unit, foodName: selected.name },
                {
                  onSuccess: () => {
                    setMeal(v.meal);
                    setSelected(null);
                  },
                },
              );
            }}
          />
        ) : (
          <SearchPanel onPick={setSelected} onQuickAdd={quickAdd} addingId={addingId} />
        )}
      </Sheet>
    </AddFoodContext.Provider>
  );
}
