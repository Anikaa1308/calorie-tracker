import "server-only";
import type { z } from "zod";
import { roundForStorage } from "@/lib/nutrition";
import { computeRecipe } from "@/lib/recipes";
import type { recipeSchema } from "@/lib/schemas";
import type { FoodDTO } from "@/lib/types";
import { db } from "../db";
import { getFood } from "../food-data/local";
import { badRequest, notFound } from "../http";
import { buildSearchText } from "../search-text";

type Input = z.infer<typeof recipeSchema>;

export interface RecipeDTO {
  id: string;
  name: string;
  servings: number;
  cookedWeightG: number | null;
  notes: string | null;
  foodId: string;
  food: FoodDTO | null;
  ingredients: { foodId: string; quantity: number; unit: string; grams: number; food: FoodDTO | null }[];
  updatedAt: string;
}

async function resolve(userId: string, input: Input) {
  const foods = await Promise.all(input.ingredients.map((i) => getFood(i.foodId, userId)));
  foods.forEach((f, i) => {
    if (!f) throw badRequest(`Ingredient ${i + 1} wasn't found.`);
    if (!f.per100) throw badRequest(`${f.name} has no nutrition data.`);
  });
  const totals = computeRecipe(
    input.ingredients.map((ing, i) => ({ food: { ...foods[i]!, per100: foods[i]!.per100! }, quantity: ing.quantity, unit: ing.unit })),
    input.servings,
    input.cookedWeightG,
  );
  if (totals.invalid.length) throw badRequest(`"${input.ingredients[totals.invalid[0]].unit}" can't be used for ${foods[totals.invalid[0]]!.name}.`);
  return { foods, totals };
}

export async function saveRecipe(userId: string, input: Input, id?: string): Promise<RecipeDTO> {
  const { totals } = await resolve(userId, input);
  const per100 = roundForStorage(totals.per100g);
  const foodFields = {
    name: input.name,
    kind: "RECIPE" as const,
    basis: "PER_100G" as const,
    source: "USER" as const,
    confidence: "HIGH" as const,
    sourceNote: `Calculated from ${input.ingredients.length} ingredient${input.ingredients.length === 1 ? "" : "s"}, ${input.servings} serving${input.servings === 1 ? "" : "s"}.`,
    category: "Recipes",
    ownerId: userId,
    searchText: buildSearchText(input.name, null, ["recipe"]),
  };
  const ingredientRows = input.ingredients.map((ing, i) => ({
    foodId: ing.foodId,
    quantity: ing.quantity,
    unit: ing.unit,
    grams: Math.round(totals.ingredientGrams[i] * 10) / 10,
    position: i,
  }));
  const serving = { label: "1 serving", unit: "serving", grams: Math.round(totals.servingGrams * 10) / 10, isDefault: true, position: 0 };

  let recipeId: string;
  if (id) {
    const existing = await db.recipe.findFirst({ where: { id, ownerId: userId } });
    if (!existing) throw notFound("Recipe not found.");
    await db.$transaction([
      db.food.update({ where: { id: existing.foodId }, data: { ...foodFields, archivedAt: null } }),
      db.foodNutrition.upsert({ where: { foodId: existing.foodId }, create: { foodId: existing.foodId, ...per100 }, update: per100 }),
      db.foodServing.deleteMany({ where: { foodId: existing.foodId } }),
      db.foodServing.create({ data: { foodId: existing.foodId, ...serving } }),
      db.recipeIngredient.deleteMany({ where: { recipeId: id } }),
      db.recipe.update({
        where: { id },
        data: {
          name: input.name,
          servings: input.servings,
          totalWeightG: input.cookedWeightG ?? null,
          notes: input.notes ?? null,
          ingredients: { create: ingredientRows },
        },
      }),
    ]);
    recipeId = id;
  } else {
    const food = await db.food.create({
      data: { ...foodFields, nutrition: { create: per100 }, servings: { create: serving } },
    });
    const recipe = await db.recipe.create({
      data: {
        ownerId: userId,
        name: input.name,
        servings: input.servings,
        totalWeightG: input.cookedWeightG ?? null,
        notes: input.notes ?? null,
        foodId: food.id,
        ingredients: { create: ingredientRows },
      },
    });
    recipeId = recipe.id;
  }
  return (await getRecipe(userId, recipeId))!;
}

export async function getRecipe(userId: string, id: string): Promise<RecipeDTO | null> {
  const r = await db.recipe.findFirst({
    where: { id, ownerId: userId },
    include: { ingredients: { orderBy: { position: "asc" } } },
  });
  if (!r) return null;
  const [food, ...ingFoods] = await Promise.all([getFood(r.foodId, userId), ...r.ingredients.map((i) => getFood(i.foodId, userId))]);
  return {
    id: r.id,
    name: r.name,
    servings: r.servings,
    cookedWeightG: r.totalWeightG,
    notes: r.notes,
    foodId: r.foodId,
    food,
    ingredients: r.ingredients.map((i, idx) => ({ foodId: i.foodId, quantity: i.quantity, unit: i.unit, grams: i.grams, food: ingFoods[idx] })),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listRecipes(userId: string) {
  const rows = await db.recipe.findMany({
    where: { ownerId: userId, food: { archivedAt: null } },
    orderBy: { updatedAt: "desc" },
    include: { food: { include: { nutrition: true, servings: true } }, _count: { select: { ingredients: true } } },
  });
  return rows.map((r) => {
    const s = r.food.servings[0];
    const n = r.food.nutrition;
    const f = s && n ? s.grams / 100 : 0;
    return {
      id: r.id,
      name: r.name,
      servings: r.servings,
      ingredientCount: r._count.ingredients,
      perServing: n ? { calories: n.calories * f, protein: n.protein * f, carbs: n.carbs * f, fat: n.fat * f, fiber: n.fiber * f } : null,
      updatedAt: r.updatedAt.toISOString(),
    };
  });
}

export async function deleteRecipe(userId: string, id: string) {
  const r = await db.recipe.findFirst({ where: { id, ownerId: userId } });
  if (!r) throw notFound("Recipe not found.");
  // Archive the generated food so diary entries that reference it keep working.
  await db.food.update({ where: { id: r.foodId }, data: { archivedAt: new Date() } });
  return { id };
}
