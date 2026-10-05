import "server-only";
import { rankFoods, tokenize, type HistoryInfo } from "@/lib/food-search";
import type { FoodDTO } from "@/lib/types";
import { db } from "../db";
import { foodInclude, toFoodDTO } from "./mappers";

/** Candidate ids from Postgres: every token matches, or the whole query is trigram-similar. */
async function candidateIds(query: string, userId: string, limit: number): Promise<string[]> {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const q = tokens.join(" ");
  const patterns = tokens.map((t) => `%${t}%`);
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Food"
    WHERE "archivedAt" IS NULL
      AND ("ownerId" IS NULL OR "ownerId" = ${userId})
      AND ("searchText" ILIKE ALL(${patterns}::text[]) OR word_similarity(${q}, "searchText") > 0.45)
    ORDER BY word_similarity(${q}, "searchText") DESC, popularity DESC
    LIMIT ${limit}`;
  return rows.map((r) => r.id);
}

export async function searchLocalFoods(query: string, userId: string, limit = 25): Promise<FoodDTO[]> {
  const ids = await candidateIds(query, userId, 80);
  if (!ids.length) return [];
  const [foods, favorites, history] = await Promise.all([
    db.food.findMany({ where: { id: { in: ids } }, include: foodInclude }),
    db.favoriteFood.findMany({ where: { userId, foodId: { in: ids } }, select: { foodId: true } }),
    db.foodHistory.findMany({ where: { userId, foodId: { in: ids } } }),
  ]);
  const historyMap = new Map<string, HistoryInfo>(
    history.map((h) => [h.foodId, { timesLogged: h.timesLogged, lastUsedAt: h.lastUsedAt }]),
  );
  const last = new Map(history.map((h) => [h.foodId, { quantity: h.lastQuantity, unit: h.lastUnit }]));
  const favSet = new Set(favorites.map((f) => f.foodId));

  const ranked = rankFoods(
    query,
    foods.map((f) => ({ ...f, brand: f.brand?.name ?? null })),
    historyMap,
  );
  const byId = new Map(foods.map((f) => [f.id, f]));
  return ranked.slice(0, limit).map((r) => toFoodDTO(byId.get(r.id)!, { userId, favorites: favSet, last }));
}

export async function getFood(id: string, userId: string): Promise<FoodDTO | null> {
  const f = await db.food.findFirst({
    where: { id, OR: [{ ownerId: null }, { ownerId: userId }] },
    include: foodInclude,
  });
  if (!f) return null;
  const [fav, h] = await Promise.all([
    db.favoriteFood.findUnique({ where: { userId_foodId: { userId, foodId: id } } }),
    db.foodHistory.findUnique({ where: { userId_foodId: { userId, foodId: id } } }),
  ]);
  return toFoodDTO(f, {
    userId,
    favorites: new Set(fav ? [id] : []),
    last: new Map(h ? [[id, { quantity: h.lastQuantity, unit: h.lastUnit }]] : []),
  });
}
