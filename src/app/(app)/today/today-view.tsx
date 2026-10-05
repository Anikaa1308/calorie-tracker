"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useAddFood } from "@/components/food-search/add-food-provider";
import { DaySummary } from "@/components/meals/day-summary";
import { DayNavigator } from "@/components/meals/day-navigator";
import { EditEntrySheet } from "@/components/meals/edit-entry-sheet";
import { MealSection } from "@/components/meals/meal-section";
import { Skeleton } from "@/components/ui/misc";
import { addDays, isDateKey, todayKey } from "@/lib/dates";
import { useFreshIds } from "@/lib/fresh";
import { useCopyMeal, useDay } from "@/lib/queries/diary";
import { MEAL_TYPES, type MealItemDTO, type MealTypeCode } from "@/lib/types";

const subscribe = () => () => {};

/** Today's date is only known in the browser (the person's time zone). */
function useClientToday() {
  return useSyncExternalStore(subscribe, () => todayKey(), () => null);
}

export function TodayView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const today = useClientToday();
  const param = params.get("date");
  const date = param && isDateKey(param) ? param : today;

  const { openAddFood, setActiveDate } = useAddFood();
  const { data: day, isLoading } = useDay(date);
  const copy = useCopyMeal();
  const [editing, setEditing] = useState<{ item: MealItemDTO; meal: MealTypeCode } | null>(null);

  useEffect(() => {
    if (date) setActiveDate(date);
  }, [date, setActiveDate]);

  const freshIds = useFreshIds();

  const setDate = (d: string) => {
    const q = new URLSearchParams(params);
    if (d === todayKey()) q.delete("date");
    else q.set("date", d);
    router.replace(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false });
  };

  if (!date) return null;

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 sm:px-6 xl:max-w-[1120px]">
      <div className="pt-6 pb-5 lg:pt-10">
        <DayNavigator date={date} onChange={setDate} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="xl:order-2 xl:sticky xl:top-10">
          {day ? (
            <DaySummary totals={day.totals} goal={day.goal} compact />
          ) : (
            <Skeleton className="h-[300px] w-full rounded-panel" />
          )}
        </div>
        <div className="flex flex-col gap-3 xl:order-1">
          {isLoading && !day
            ? MEAL_TYPES.map((m) => <Skeleton key={m} className="h-24 w-full rounded-panel" />)
            : MEAL_TYPES.map((m) => (
                <MealSection
                  key={m}
                  meal={m}
                  items={day?.meals[m] ?? []}
                  freshIds={freshIds}
                  onAdd={() => openAddFood({ meal: m, date })}
                  onOpenItem={(item) => setEditing({ item, meal: m })}
                  onCopyFromYesterday={() => copy.mutate({ from: addDays(date, -1), to: date, meal: m })}
                />
              ))}
          <p className="mt-2 text-center text-xs text-faint">
            Targets are estimates, not medical advice.
          </p>
        </div>
      </div>
      <EditEntrySheet
        item={editing?.item ?? null}
        meal={editing?.meal ?? "BREAKFAST"}
        date={date}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
