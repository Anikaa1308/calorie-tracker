import { z } from "zod";
import { isDateKey } from "./dates";

export const dateKeySchema = z.string().refine(isDateKey, "Use a YYYY-MM-DD date.");
export const mealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACKS"]);
export const quantitySchema = z.number().positive("Amount must be more than zero.").max(100_000);
export const unitSchema = z.string().trim().min(1).max(60);

export const addEntrySchema = z.object({
  date: dateKeySchema,
  meal: mealTypeSchema,
  foodId: z.string().min(1),
  quantity: quantitySchema,
  unit: unitSchema,
});

export const updateEntrySchema = z
  .object({ quantity: quantitySchema, unit: unitSchema, meal: mealTypeSchema })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update.");

export const copyMealSchema = z.object({
  from: dateKeySchema,
  to: dateKeySchema,
  meal: mealTypeSchema.optional(),
});

export const bodySchema = z.object({
  sex: z.enum(["MALE", "FEMALE"]),
  age: z.number().int().min(13, "Plate is for ages 13 and up.").max(100),
  heightCm: z.number().min(100, "Check your height.").max(250, "Check your height."),
  weightKg: z.number().min(30, "Check your weight.").max(300, "Check your weight."),
  goalWeightKg: z.number().min(30).max(300).nullable().optional(),
  activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "VERY", "EXTREME"]),
  goal: z.enum(["LOSE", "MAINTAIN", "GAIN", "BUILD_MUSCLE", "RECOMP"]),
  rate: z.enum(["SLOW", "MODERATE", "AGGRESSIVE"]).nullable().optional(),
  weightUnit: z.enum(["KG", "LB"]).optional(),
  heightUnit: z.enum(["CM", "FT_IN"]).optional(),
});

export const saveProfileSchema = bodySchema.extend({
  /** The person's local date, so goals take effect on their "today". */
  today: dateKeySchema,
  /** When false, keeps existing custom targets and only stores the new body data. */
  applyRecommendation: z.boolean().default(true),
});

export const targetsSchema = z.object({
  calories: z.number().int().min(800, "Calories below 800 aren't supported.").max(8000),
  protein: z.number().int().min(0).max(500),
  carbs: z.number().int().min(0).max(1200),
  fat: z.number().int().min(0).max(400),
  fiber: z.number().int().min(0).max(150),
});

export const saveGoalsSchema = z.object({ today: dateKeySchema, targets: targetsSchema });

export const preferencesSchema = z
  .object({
    weightUnit: z.enum(["KG", "LB"]),
    heightUnit: z.enum(["CM", "FT_IN"]),
    theme: z.enum(["system", "light", "dark"]),
    name: z.string().trim().max(80).nullable(),
  })
  .partial();

const nutrient = z.number().min(0).max(1000);
export const servingSchema = z.object({
  label: z.string().trim().min(1).max(60),
  grams: z.number().positive().max(10_000),
});

export const customFoodSchema = z.object({
  name: z.string().trim().min(1, "Give the food a name.").max(120),
  brand: z.string().trim().max(80).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  basis: z.enum(["PER_100G", "PER_100ML"]).default("PER_100G"),
  /** Values are per this many grams (or ml) as printed on the label; normalised to per 100 server-side. */
  valuesPer: z.number().positive().max(5000).default(100),
  nutrients: z.object({
    calories: z.number().min(0).max(1000 * 50),
    protein: nutrient.max(50_000),
    carbs: nutrient.max(50_000),
    fat: nutrient.max(50_000),
    fiber: nutrient.max(50_000),
  }),
  densityGPerMl: z.number().positive().max(3).nullable().optional(),
  servings: z.array(servingSchema).max(10).default([]),
  barcode: z.string().trim().regex(/^\d{6,14}$/, "Barcodes are 6 to 14 digits.").nullable().optional(),
  fromLabel: z.boolean().default(false),
});

export const recipeSchema = z.object({
  name: z.string().trim().min(1, "Give the recipe a name.").max(120),
  servings: z.number().positive().max(100),
  cookedWeightG: z.number().positive().max(50_000).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  ingredients: z
    .array(z.object({ foodId: z.string().min(1), quantity: quantitySchema, unit: unitSchema }))
    .min(1, "Add at least one ingredient.")
    .max(60),
});

export const weightSchema = z.object({
  date: dateKeySchema,
  weightKg: z.number().min(25).max(350),
  note: z.string().trim().max(200).nullable().optional(),
});
