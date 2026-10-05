import { calculateNutrition, scaleNutrients, sumNutrients, type NutritionFood, type Nutrients } from "./nutrition";

export interface RecipeIngredientInput {
  food: NutritionFood & { name: string };
  quantity: number;
  unit: string;
}

export interface RecipeTotals {
  total: Nutrients;
  perServing: Nutrients;
  per100g: Nutrients;
  /** Weight the per-100 g values are based on: cooked weight if given, else the raw ingredients. */
  totalWeightG: number;
  servingGrams: number;
  ingredientGrams: number[];
  /** Ingredients whose unit couldn't be converted. */
  invalid: number[];
}

/**
 * Recipe nutrition from its ingredients with the shared engine. Oil and ghee
 * are ingredients like any other, so the fat they add is counted.
 */
export function computeRecipe(
  ingredients: RecipeIngredientInput[],
  servings: number,
  cookedWeightG?: number | null,
): RecipeTotals {
  const results = ingredients.map((i) => calculateNutrition(i.food, i.quantity, i.unit));
  const invalid = results.flatMap((r, idx) => (r ? [] : [idx]));
  const ok = results.filter((r): r is NonNullable<typeof r> => !!r);
  const total = sumNutrients(ok.map((r) => r.nutrients));
  const rawWeight = ok.reduce((s, r) => s + r.grams, 0);
  const totalWeightG = cookedWeightG && cookedWeightG > 0 ? cookedWeightG : rawWeight;
  const safeServings = servings > 0 ? servings : 1;
  return {
    total,
    perServing: scaleNutrients(total, 1 / safeServings),
    per100g: totalWeightG > 0 ? scaleNutrients(total, 100 / totalWeightG) : scaleNutrients(total, 0),
    totalWeightG,
    servingGrams: totalWeightG / safeServings,
    ingredientGrams: results.map((r) => r?.grams ?? 0),
    invalid,
  };
}

/** Normalise label values entered "per serving of N g" (or per 100) to per 100 g. */
export function toPer100(values: Nutrients, basisGrams: number): Nutrients {
  return scaleNutrients(values, basisGrams > 0 ? 100 / basisGrams : 0);
}
