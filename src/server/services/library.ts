import "server-only";
import { visibleFoodWhere } from "@/lib/food-sharing";
import type { FoodDTO } from "@/lib/types";
import { db } from "../db";
import { foodInclude, toFoodDTO } from "../food-data/mappers";

export type LibraryTab = "recent" | "frequent" | "favorites" | "mine" | "recipes";

export async function getLibrary(userId: string, tab: LibraryTab, limit = 40): Promise<FoodDTO[]> {
  const [favorites, history] = await Promise.all([
    db.favoriteFood.findMany({ where: { userId }, select: { foodId: true } }),
    db.foodHistory.findMany({ where: { userId } }),
  ]);
  const favSet = new Set(favorites.map((f) => f.foodId));
  const last = new Map(history.map((h) => [h.foodId, { quantity: h.lastQuantity, unit: h.lastUnit }]));
  const ctx = { userId, favorites: favSet, last };
  const visible = { archivedAt: null, ...visibleFoodWhere(userId) };

  if (tab === "recent" || tab === "frequent") {
    const rows = await db.foodHistory.findMany({
      where: { userId, food: visible },
      orderBy: tab === "recent" ? { lastUsedAt: "desc" } : [{ timesLogged: "desc" }, { lastUsedAt: "desc" }],
      take: limit,
      include: { food: { include: foodInclude } },
    });
    return rows.map((r) => toFoodDTO(r.food, ctx));
  }
  if (tab === "favorites") {
    const rows = await db.favoriteFood.findMany({
      where: { userId, food: visible },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { food: { include: foodInclude } },
    });
    return rows.map((r) => toFoodDTO(r.food, ctx));
  }
  const foods = await db.food.findMany({
    where: { ownerId: userId, archivedAt: null, kind: tab === "recipes" ? "RECIPE" : "USER" },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: foodInclude,
  });
  return foods.map((f) => toFoodDTO(f, ctx));
}

export async function setFavorite(userId: string, foodId: string, favorite: boolean) {
  if (favorite) {
    await db.favoriteFood.upsert({
      where: { userId_foodId: { userId, foodId } },
      create: { userId, foodId },
      update: {},
    });
  } else {
    await db.favoriteFood.deleteMany({ where: { userId, foodId } });
  }
  return { foodId, favorite };
}
