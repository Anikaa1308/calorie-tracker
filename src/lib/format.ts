import type { NutrientKey } from "./nutrition";

/** Display rounding: kcal whole numbers, macros one decimal with a trailing ".0" hidden. */
export function formatNutrient(key: NutrientKey, value: number): string {
  if (key === "calories") return formatKcal(value);
  return formatGrams(value);
}

export function formatKcal(value: number): string {
  return Math.round(value).toLocaleString("en-IN");
}

export function formatGrams(value: number): string {
  const r = Math.round(value * 10) / 10;
  return (Object.is(r, -0) ? 0 : r).toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

export function formatQuantity(value: number): string {
  const r = Math.round(value * 100) / 100;
  return r.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export const NUTRIENT_LABEL: Record<NutrientKey, string> = {
  calories: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
  fiber: "Fiber",
};

export const NUTRIENT_UNIT: Record<NutrientKey, string> = {
  calories: "kcal",
  protein: "g",
  carbs: "g",
  fat: "g",
  fiber: "g",
};

/** "353 kcal left" / "12 g over" / "On target". */
export function describeRemaining(key: NutrientKey, remaining: number, target: number): string {
  const unit = NUTRIENT_UNIT[key];
  if (target > 0 && Math.abs(remaining) < 0.5) return "On target";
  if (remaining >= 0) return `${formatNutrient(key, remaining)} ${unit} left`;
  return `${formatNutrient(key, -remaining)} ${unit} over`;
}
