import "server-only";
import { dateKeyToDb, dbToDateKey, type DateKey } from "@/lib/dates";
import { calculateNutrition, roundForStorage, sumNutrients, ZERO, type Nutrients } from "@/lib/nutrition";
import { MEAL_TYPES, type DayDTO, type FoodDTO, type MealItemDTO, type MealTypeCode } from "@/lib/types";
import type { MealItem } from "@/generated/prisma/client";
import { db } from "../db";
import { badRequest, notFound } from "../http";
import { getFood } from "../food-data/local";
import { getGoalForDate } from "./goals";

function itemToDTO(i: MealItem): MealItemDTO {
  return {
    id: i.id,
    foodId: i.foodId,
    foodName: i.foodName,
    brandName: i.brandName,
    quantity: i.quantity,
    unit: i.unit,
    grams: i.grams,
    source: i.source,
    nutrients: { calories: i.calories, protein: i.protein, carbs: i.carbs, fat: i.fat, fiber: i.fiber },
    createdAt: i.createdAt.toISOString(),
  };
}

export async function getDay(userId: string, date: DateKey): Promise<DayDTO> {
  const [meals, goal] = await Promise.all([
    db.meal.findMany({
      where: { userId, date: dateKeyToDb(date) },
      include: { items: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } } },
    }),
    getGoalForDate(userId, date),
  ]);
  const byType = Object.fromEntries(MEAL_TYPES.map((t) => [t, [] as MealItemDTO[]])) as Record<
    MealTypeCode,
    MealItemDTO[]
  >;
  for (const m of meals) byType[m.type] = m.items.map(itemToDTO);
  const totals = sumNutrients(Object.values(byType).flat().map((i) => i.nutrients));
  return { date, meals: byType, totals, goal };
}

/** Server-side calculation with the shared engine; clients never send nutrient numbers. */
function computeSnapshot(food: FoodDTO, quantity: number, unit: string): { grams: number; nutrients: Nutrients } {
  if (!food.per100) throw badRequest("This food has no nutrition information yet.");
  const r = calculateNutrition({ ...food, per100: food.per100 }, quantity, unit);
  if (!r) throw badRequest(`"${unit}" can't be converted for ${food.name}.`);
  return { grams: Math.round(r.grams * 10) / 10, nutrients: roundForStorage(r.nutrients) };
}

async function recomputeDaily(userId: string, date: Date) {
  const items = await db.mealItem.findMany({
    where: { deletedAt: null, meal: { userId, date } },
    select: { calories: true, protein: true, carbs: true, fat: true, fiber: true },
  });
  const t = items.length ? roundForStorage(sumNutrients(items)) : ZERO;
  await db.dailyNutrition.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, ...t, itemCount: items.length },
    update: { ...t, itemCount: items.length },
  });
}

async function touchHistory(userId: string, foodId: string, quantity: number, unit: string, meal: MealTypeCode) {
  await db.foodHistory.upsert({
    where: { userId_foodId: { userId, foodId } },
    create: { userId, foodId, timesLogged: 1, lastUsedAt: new Date(), lastQuantity: quantity, lastUnit: unit, lastMeal: meal },
    update: { timesLogged: { increment: 1 }, lastUsedAt: new Date(), lastQuantity: quantity, lastUnit: unit, lastMeal: meal },
  });
}

export async function addItem(
  userId: string,
  input: { date: DateKey; meal: MealTypeCode; foodId: string; quantity: number; unit: string },
): Promise<MealItemDTO> {
  const food = await getFood(input.foodId, userId);
  if (!food) throw notFound("Food not found.");
  const { grams, nutrients } = computeSnapshot(food, input.quantity, input.unit);
  const date = dateKeyToDb(input.date);

  const meal = await db.meal.upsert({
    where: { userId_date_type: { userId, date, type: input.meal } },
    create: { userId, date, type: input.meal },
    update: {},
  });
  const item = await db.mealItem.create({
    data: {
      mealId: meal.id,
      foodId: food.id,
      quantity: input.quantity,
      unit: input.unit,
      grams,
      ...nutrients,
      foodName: food.name,
      brandName: food.brand,
      source: food.source,
    },
  });
  await Promise.all([recomputeDaily(userId, date), touchHistory(userId, food.id, input.quantity, input.unit, input.meal)]);
  return itemToDTO(item);
}

async function ownedItem(userId: string, id: string) {
  const item = await db.mealItem.findFirst({ where: { id, meal: { userId } }, include: { meal: true } });
  if (!item) throw notFound("Entry not found.");
  return item;
}

export async function updateItem(
  userId: string,
  id: string,
  input: { quantity?: number; unit?: string; meal?: MealTypeCode },
): Promise<MealItemDTO> {
  const item = await ownedItem(userId, id);
  const quantity = input.quantity ?? item.quantity;
  const unit = input.unit ?? item.unit;

  let snapshot: { grams: number; nutrients: Nutrients } | null = null;
  if (input.quantity !== undefined || input.unit !== undefined) {
    const food = item.foodId ? await getFood(item.foodId, userId) : null;
    if (food) {
      snapshot = computeSnapshot(food, quantity, unit);
    } else {
      // Food was deleted: scale the stored snapshot. Only same-unit changes are possible.
      if (unit !== item.unit) throw badRequest("The original food is gone, so only the amount can change.");
      const f = quantity / item.quantity;
      snapshot = {
        grams: item.grams * f,
        nutrients: roundForStorage({
          calories: item.calories * f,
          protein: item.protein * f,
          carbs: item.carbs * f,
          fat: item.fat * f,
          fiber: item.fiber * f,
        }),
      };
    }
  }

  let mealId = item.mealId;
  if (input.meal && input.meal !== item.meal.type) {
    const meal = await db.meal.upsert({
      where: { userId_date_type: { userId, date: item.meal.date, type: input.meal } },
      create: { userId, date: item.meal.date, type: input.meal },
      update: {},
    });
    mealId = meal.id;
  }

  const updated = await db.mealItem.update({
    where: { id },
    data: { mealId, quantity, unit, ...(snapshot ? { grams: snapshot.grams, ...snapshot.nutrients } : {}) },
  });
  await recomputeDaily(userId, item.meal.date);
  if (item.foodId) {
    await db.foodHistory.updateMany({
      where: { userId, foodId: item.foodId },
      data: { lastQuantity: quantity, lastUnit: unit },
    });
  }
  return itemToDTO(updated);
}

export async function deleteItem(userId: string, id: string) {
  const item = await ownedItem(userId, id);
  await db.mealItem.update({ where: { id }, data: { deletedAt: new Date() } });
  await recomputeDaily(userId, item.meal.date);
  return { id, date: dbToDateKey(item.meal.date) };
}

export async function restoreItem(userId: string, id: string) {
  const item = await ownedItem(userId, id);
  const restored = await db.mealItem.update({ where: { id }, data: { deletedAt: null } });
  await recomputeDaily(userId, item.meal.date);
  return itemToDTO(restored);
}

/** Copy every entry from one day's meal (or the whole day) to another date. */
export async function copyMeal(
  userId: string,
  input: { from: DateKey; to: DateKey; meal?: MealTypeCode },
): Promise<{ copied: number }> {
  const src = await db.meal.findMany({
    where: { userId, date: dateKeyToDb(input.from), ...(input.meal ? { type: input.meal } : {}) },
    include: { items: { where: { deletedAt: null } } },
  });
  const to = dateKeyToDb(input.to);
  let copied = 0;
  for (const m of src) {
    if (!m.items.length) continue;
    const dest = await db.meal.upsert({
      where: { userId_date_type: { userId, date: to, type: m.type } },
      create: { userId, date: to, type: m.type },
      update: {},
    });
    await db.mealItem.createMany({
      data: m.items.map((i) => ({
        mealId: dest.id,
        foodId: i.foodId,
        quantity: i.quantity,
        unit: i.unit,
        grams: i.grams,
        calories: i.calories,
        protein: i.protein,
        carbs: i.carbs,
        fat: i.fat,
        fiber: i.fiber,
        foodName: i.foodName,
        brandName: i.brandName,
        source: i.source,
      })),
    });
    copied += m.items.length;
  }
  await recomputeDaily(userId, to);
  return { copied };
}
