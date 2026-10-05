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
