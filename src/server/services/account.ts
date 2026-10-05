import "server-only";
import { dbToDateKey } from "@/lib/dates";
import { db } from "../db";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  // Neutralise spreadsheet formula injection and quote when needed.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function exportDiaryCsv(userId: string): Promise<string> {
  const items = await db.mealItem.findMany({
    where: { deletedAt: null, meal: { userId } },
    include: { meal: true },
    orderBy: [{ meal: { date: "asc" } }, { createdAt: "asc" }],
  });
  const header = ["date", "meal", "food", "brand", "quantity", "unit", "grams", "calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "source"];
  const rows = items.map((i) =>
    [dbToDateKey(i.meal.date), i.meal.type.toLowerCase(), i.foodName, i.brandName, i.quantity, i.unit, i.grams, i.calories, i.protein, i.carbs, i.fat, i.fiber, i.source]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n") + "\n";
}

export async function exportAllJson(userId: string) {
  const [user, profile, goals, meals, weights, foods, recipes, favorites] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true, name: true, createdAt: true } }),
    db.profile.findUnique({ where: { userId } }),
    db.dailyGoal.findMany({ where: { userId }, orderBy: { effectiveFrom: "asc" } }),
    db.meal.findMany({ where: { userId }, include: { items: { where: { deletedAt: null } } }, orderBy: { date: "asc" } }),
    db.weightEntry.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    db.food.findMany({ where: { ownerId: userId }, include: { nutrition: true, servings: true } }),
    db.recipe.findMany({ where: { ownerId: userId }, include: { ingredients: true } }),
    db.favoriteFood.findMany({ where: { userId }, select: { foodId: true } }),
  ]);
  return { exportedAt: new Date().toISOString(), user, profile, goals, meals, weights, foods, recipes, favorites };
}

/** Deletes the user and everything they own (cascades in the schema). */
export async function deleteAccount(userId: string) {
  await db.user.delete({ where: { id: userId } });
}
