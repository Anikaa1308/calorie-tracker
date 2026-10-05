/**
 * The one nutrition calculation engine. Every nutrition number in the UI and
 * every snapshot written to the database is produced here. Pure, no I/O.
 */
import { toBasisAmount, toGrams, type UnitFood } from "./units";

export const NUTRIENT_KEYS = ["calories", "protein", "carbs", "fat", "fiber"] as const;
export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type Nutrients = Record<NutrientKey, number>;

export const ZERO: Nutrients = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export interface NutritionFood extends UnitFood {
  /** Nutrients per 100 g (PER_100G) or per 100 ml (PER_100ML). */
  per100: Nutrients;
}

export interface CalculatedNutrition {
  nutrients: Nutrients;
  grams: number;
}

/**
 * Nutrition for a quantity of a food, in a unit.
 * Returns null when the unit cannot be converted for this food.
 */
export function calculateNutrition(
  food: NutritionFood,
  quantity: number,
  unit: string,
): CalculatedNutrition | null {
  const amount = toBasisAmount(food, quantity, unit);
  const grams = toGrams(food, quantity, unit);
  if (amount === null || grams === null) return null;
  return { nutrients: scaleNutrients(food.per100, amount / 100), grams };
}

export function scaleNutrients(n: Nutrients, factor: number): Nutrients {
  return {
    calories: n.calories * factor,
    protein: n.protein * factor,
    carbs: n.carbs * factor,
    fat: n.fat * factor,
    fiber: n.fiber * factor,
  };
}

export function sumNutrients(list: readonly Partial<Nutrients>[]): Nutrients {
  const total = { ...ZERO };
  for (const n of list) {
    for (const k of NUTRIENT_KEYS) total[k] += n[k] ?? 0;
  }
  return total;
}

/** Storage rounding: kcal to 0.1, macros to 0.01, so sums stay accurate. */
export function roundForStorage(n: Nutrients): Nutrients {
  return {
    calories: Math.round(n.calories * 10) / 10,
    protein: Math.round(n.protein * 100) / 100,
    carbs: Math.round(n.carbs * 100) / 100,
    fat: Math.round(n.fat * 100) / 100,
    fiber: Math.round(n.fiber * 100) / 100,
  };
}

/** Energy from macros: protein·4 + carbs·4 + fat·9. */
export function caloriesFromMacros(n: Pick<Nutrients, "protein" | "carbs" | "fat">): number {
  return n.protein * 4 + n.carbs * 4 + n.fat * 9;
}

// ── Progress against a target ────────────────────────────────────────────────

export type ProgressStatus = "under" | "on" | "over";

export interface Progress {
  consumed: number;
  target: number;
  remaining: number;
  /** 0..1+ fraction of target. */
  ratio: number;
  status: ProgressStatus;
}

/** ±5 % of the target counts as on target. */
export const ON_TARGET_BAND = 0.05;

export function progress(consumed: number, target: number): Progress {
  const ratio = target > 0 ? consumed / target : 0;
  let status: ProgressStatus = "under";
  if (target > 0) {
    if (ratio > 1 + ON_TARGET_BAND) status = "over";
    else if (ratio >= 1 - ON_TARGET_BAND) status = "on";
  }
  return { consumed, target, remaining: target - consumed, ratio, status };
}
