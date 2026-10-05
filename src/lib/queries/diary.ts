"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { markFresh } from "@/lib/fresh";
import { sumNutrients } from "@/lib/nutrition";
import { MEAL_LABEL, type DayDTO, type MealItemDTO, type MealTypeCode } from "@/lib/types";
import { api } from "./fetcher";
import { qk } from "./keys";

export function useDay(date: string | null) {
  return useQuery({
    queryKey: qk.day(date ?? ""),
    queryFn: () => api<DayDTO>(`/api/day/${date}`),
    enabled: !!date,
    placeholderData: (prev) => prev,
  });
}

function withTotals(day: DayDTO): DayDTO {
  return { ...day, totals: sumNutrients(Object.values(day.meals).flat().map((i) => i.nutrients)) };
}

function invalidateAfterLog(qc: ReturnType<typeof useQueryClient>, date: string) {
  qc.invalidateQueries({ queryKey: qk.day(date) });
  qc.invalidateQueries({ queryKey: ["library"] });
  qc.invalidateQueries({ queryKey: ["history"] });
}

export interface AddEntryInput {
  date: string;
  meal: MealTypeCode;
  foodId: string;
  quantity: number;
  unit: string;
  /** For the toast. */
  foodName?: string;
}

export function useAddEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddEntryInput) =>
      api<MealItemDTO>("/api/entries", {
        method: "POST",
        json: { date: input.date, meal: input.meal, foodId: input.foodId, quantity: input.quantity, unit: input.unit },
      }),
    onSuccess: (item, input) => {
      markFresh(item.id);
      qc.setQueryData<DayDTO>(qk.day(input.date), (day) =>
        day ? withTotals({ ...day, meals: { ...day.meals, [input.meal]: [...day.meals[input.meal], item] } }) : day,
      );
      invalidateAfterLog(qc, input.date);
      toast(`Added ${input.foodName ?? item.foodName} to ${MEAL_LABEL[input.meal].toLowerCase()}`, {
        action: {
          label: "Undo",
          onClick: () =>
            api(`/api/entries/${item.id}`, { method: "DELETE" }).then(() => invalidateAfterLog(qc, input.date)),
        },
      });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateEntry(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; quantity?: number; unit?: string; meal?: MealTypeCode }) =>
      api<MealItemDTO>(`/api/entries/${id}`, { method: "PATCH", json: patch }),
    onSuccess: () => invalidateAfterLog(qc, date),
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteEntry(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: MealItemDTO) => api(`/api/entries/${item.id}`, { method: "DELETE" }),
    // Remove immediately; the toast offers undo instead of a confirm dialog.
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: qk.day(date) });
      const prev = qc.getQueryData<DayDTO>(qk.day(date));
      if (prev) {
        const meals = Object.fromEntries(
          Object.entries(prev.meals).map(([k, list]) => [k, list.filter((i) => i.id !== item.id)]),
        ) as DayDTO["meals"];
        qc.setQueryData(qk.day(date), withTotals({ ...prev, meals }));
      }
      return { prev };
    },
    onError: (e, _item, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.day(date), ctx.prev);
      toast.error(e.message);
    },
    onSuccess: (_r, item) => {
      invalidateAfterLog(qc, date);
      toast(`Removed ${item.foodName}`, {
        action: {
          label: "Undo",
          onClick: () =>
            api(`/api/entries/${item.id}/restore`, { method: "POST" }).then(() => invalidateAfterLog(qc, date)),
        },
      });
    },
  });
}

export function useCopyMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { from: string; to: string; meal?: MealTypeCode }) =>
      api<{ copied: number }>("/api/entries/copy", { method: "POST", json: input }),
    onSuccess: (r, input) => {
      invalidateAfterLog(qc, input.to);
      toast(r.copied ? `Copied ${r.copied} item${r.copied === 1 ? "" : "s"}` : "Nothing to copy from that day");
    },
    onError: (e) => toast.error(e.message),
  });
}
