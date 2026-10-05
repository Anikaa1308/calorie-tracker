"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { GoalResult, Targets } from "@/lib/goals";
import type { GoalDTO, ProfileDTO } from "@/lib/types";
import { todayKey } from "@/lib/dates";
import { api } from "./fetcher";
import { qk } from "./keys";

export function useProfile() {
  return useQuery({ queryKey: qk.profile, queryFn: () => api<ProfileDTO>("/api/profile") });
}

export function useCurrentGoal() {
  return useQuery({
    queryKey: [...qk.goals, "current"],
    queryFn: () => api<{ goal: GoalDTO | null }>(`/api/goals?date=${todayKey()}`).then((r) => r.goal),
  });
}

export interface SaveProfileInput {
  sex: "MALE" | "FEMALE";
  age: number;
  heightCm: number;
  weightKg: number;
  goalWeightKg?: number | null;
  activityLevel: NonNullable<ProfileDTO["activityLevel"]>;
  goal: NonNullable<ProfileDTO["goal"]>;
  rate?: ProfileDTO["rate"];
  weightUnit?: ProfileDTO["weightUnit"];
  heightUnit?: ProfileDTO["heightUnit"];
  applyRecommendation?: boolean;
}

function invalidateGoals(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.profile });
  qc.invalidateQueries({ queryKey: qk.goals });
  qc.invalidateQueries({ queryKey: ["day"] });
  qc.invalidateQueries({ queryKey: ["history"] });
  qc.invalidateQueries({ queryKey: qk.weights });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveProfileInput) =>
      api<{ profile: ProfileDTO; recommendation: GoalResult; goal: GoalDTO | null }>("/api/profile", {
        method: "PUT",
        json: { ...input, today: todayKey() },
      }),
    onSuccess: () => invalidateGoals(qc),
    onError: (e) => toast.error(e.message),
  });
}

export function useSaveGoals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targets: Targets) =>
      api<{ goal: GoalDTO | null }>("/api/goals", { method: "PUT", json: { today: todayKey(), targets } }),
    onSuccess: () => {
      invalidateGoals(qc);
      toast("Targets saved");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useSavePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Pick<ProfileDTO, "weightUnit" | "heightUnit" | "theme" | "name">>) =>
      api<ProfileDTO>("/api/preferences", { method: "PATCH", json: input }),
    onSuccess: (p) => qc.setQueryData(qk.profile, p),
    onError: (e) => toast.error(e.message),
  });
}
