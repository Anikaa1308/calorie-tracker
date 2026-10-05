"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Nutrients } from "@/lib/nutrition";
import { api } from "./fetcher";
import { qk } from "./keys";

export interface HistoryDay {
  date: string;
  totals: Nutrients;
  itemCount: number;
  goal: Nutrients | null;
}

export function useHistory(end: string | null, days: number) {
  return useQuery({
    queryKey: qk.history(days, end ?? ""),
    queryFn: () => api<{ days: HistoryDay[] }>(`/api/history?end=${end}&days=${days}`).then((r) => r.days),
    enabled: !!end,
    placeholderData: (prev) => prev,
  });
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  note: string | null;
}

export function useWeights() {
  return useQuery({
    queryKey: qk.weights,
    queryFn: () => api<{ entries: WeightEntry[] }>("/api/weights").then((r) => r.entries),
  });
}

export function useSaveWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; weightKg: number }) => api<WeightEntry>("/api/weights", { method: "POST", json: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.weights });
      qc.invalidateQueries({ queryKey: qk.profile });
      toast("Weight saved");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/weights/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.weights });
      qc.invalidateQueries({ queryKey: qk.profile });
    },
    onError: (e) => toast.error(e.message),
  });
}
