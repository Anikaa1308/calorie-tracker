import type { Nutrients } from "./nutrition";
import type { Basis, ServingLike } from "./units";

export type FoodSourceCode =
  | "USDA"
  | "OPEN_FOOD_FACTS"
  | "IFCT"
  | "PRODUCT_LABEL"
  | "USER"
  | "ESTIMATED"
  | "SAMPLE";
export type ConfidenceCode = "VERIFIED" | "HIGH" | "MEDIUM" | "LOW";
export type FoodKindCode = "GENERIC" | "BRANDED" | "USER" | "RECIPE";
export type MealTypeCode = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS";

export const MEAL_TYPES: MealTypeCode[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"];
export const MEAL_LABEL: Record<MealTypeCode, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACKS: "Snacks",
};

/** A food as the client sees it. `id` is a database id, or "ext:<provider>:<id>" for an external result not yet imported. */
export interface FoodDTO {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  kind: FoodKindCode;
  basis: Basis;
  densityGPerMl: number | null;
  source: FoodSourceCode;
  confidence: ConfidenceCode;
  sourceNote: string | null;
  barcode?: string | null;
  /** null when the provider has no complete nutrition data; such foods cannot be logged as-is. */
  per100: Nutrients | null;
  servings: ServingLike[];
  isOwn?: boolean;
  isFavorite?: boolean;
  last?: { quantity: number; unit: string } | null;
}

export interface MealItemDTO {
  id: string;
  foodId: string | null;
  foodName: string;
  brandName: string | null;
  quantity: number;
  unit: string;
  grams: number;
  source: FoodSourceCode;
  nutrients: Nutrients;
  createdAt: string;
}

export interface DayDTO {
  date: string;
  meals: Record<MealTypeCode, MealItemDTO[]>;
  totals: Nutrients;
  goal: GoalDTO | null;
}

export interface GoalDTO {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isCustom: boolean;
  effectiveFrom: string;
  recommended: Nutrients | null;
}
