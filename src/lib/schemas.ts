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
