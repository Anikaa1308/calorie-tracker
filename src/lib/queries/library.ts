"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Nutrients } from "@/lib/nutrition";
import type { FoodDTO } from "@/lib/types";
import { api } from "./fetcher";
import { qk } from "./keys";

export interface CustomFoodInput {
  name: string;
  brand?: string | null;
  basis: "PER_100G" | "PER_100ML";
  valuesPer: number;
  nutrients: Nutrients;
  densityGPerMl?: number | null;
  servings: { label: string; grams: number }[];
  barcode?: string | null;
  fromLabel: boolean;
}

function invalidateFoods(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["library"] });
  qc.invalidateQueries({ queryKey: ["food-search"] });
  qc.invalidateQueries({ queryKey: ["food"] });
  qc.invalidateQueries({ queryKey: qk.recipes });
}

export function useFood(id: string | null) {
  return useQuery({ queryKey: qk.food(id ?? ""), queryFn: () => api<FoodDTO>(`/api/foods/${id}`), enabled: !!id });
}

export function useSaveCustomFood(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomFoodInput) =>
      api<FoodDTO>(id ? `/api/foods/custom/${id}` : "/api/foods/custom", { method: id ? "PUT" : "POST", json: input }),
    onSuccess: (f) => {
      invalidateFoods(qc);
      toast(id ? `Saved ${f.name}` : `Added ${f.name} to your foods`);
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteCustomFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/foods/custom/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateFoods(qc);
      toast("Food removed. Past diary entries keep their values.");
    },
    onError: (e) => toast.error(e.message),
  });
}

export interface RecipeSummary {
  id: string;
  name: string;
  servings: number;
  ingredientCount: number;
  perServing: Nutrients | null;
  updatedAt: string;
}

export interface RecipeDetail {
  id: string;
  name: string;
  servings: number;
  cookedWeightG: number | null;
  notes: string | null;
  foodId: string;
  food: FoodDTO | null;
  ingredients: { foodId: string; quantity: number; unit: string; grams: number; food: FoodDTO | null }[];
}

export interface RecipeInput {
  name: string;
  servings: number;
  cookedWeightG?: number | null;
  notes?: string | null;
  ingredients: { foodId: string; quantity: number; unit: string }[];
}

export function useRecipes() {
  return useQuery({
    queryKey: qk.recipes,
    queryFn: () => api<{ recipes: RecipeSummary[] }>("/api/recipes").then((r) => r.recipes),
  });
}

export function useRecipe(id: string | null) {
  return useQuery({ queryKey: qk.recipe(id ?? ""), queryFn: () => api<RecipeDetail>(`/api/recipes/${id}`), enabled: !!id });
}

export function useSaveRecipe(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecipeInput) =>
      api<RecipeDetail>(id ? `/api/recipes/${id}` : "/api/recipes", { method: id ? "PUT" : "POST", json: input }),
    onSuccess: (r) => {
      invalidateFoods(qc);
      qc.setQueryData(qk.recipe(r.id), r);
      toast(`Saved ${r.name}`);
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/recipes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateFoods(qc);
      toast("Recipe deleted. Past diary entries keep their values.");
    },
    onError: (e) => toast.error(e.message),
  });
}
