import "server-only";
import { visibleFoodWhere } from "@/lib/food-sharing";
import type { FoodDTO } from "@/lib/types";
import { db } from "../db";
import { badRequest, notFound } from "../http";
import { buildSearchText, slugify } from "../search-text";
import { getFood } from "./local";
import { parseExternalId } from "./normalize";
import { getOpenFoodFactsProduct } from "./openfoodfacts";
import { getUsdaFood } from "./usda";

const SOURCE = { off: "OPEN_FOOD_FACTS", usda: "USDA" } as const;

/**
 * Import-on-use: an external result is written to the database only when
 * someone logs it, so search stays fast and the local catalogue grows with
 * real usage. Idempotent per (source, externalId).
 */
export async function importExternalFood(id: string, userId: string): Promise<FoodDTO> {
  const ext = parseExternalId(id);
  if (!ext) throw notFound("Food not found.");
  const source = SOURCE[ext.provider];

  const existing = await db.food.findUnique({ where: { source_externalId: { source, externalId: ext.externalId } } });
  if (existing) return (await getFood(existing.id, userId))!;

  const food = ext.provider === "off" ? await getOpenFoodFactsProduct(ext.externalId) : await getUsdaFood(ext.externalId);
  if (!food) throw notFound("That product isn't available any more.");
  if (!food.per100) throw badRequest("This product has no nutrition information. Add it from the label instead.");

  const brand = food.brand
    ? await db.brand.upsert({ where: { slug: slugify(food.brand) }, create: { name: food.brand, slug: slugify(food.brand) }, update: {} })
    : null;
  const created = await db.food.upsert({
    where: { source_externalId: { source, externalId: ext.externalId } },
    update: {},
    create: {
      name: food.name,
      brandId: brand?.id ?? null,
      category: food.category,
      kind: food.kind,
      basis: food.basis,
      densityGPerMl: food.densityGPerMl,
      source,
      confidence: food.confidence,
      sourceNote: food.sourceNote,
      externalId: ext.externalId,
      barcode: food.barcode ?? null,
      searchText: buildSearchText(food.name, food.brand),
      nutrition: { create: food.per100 },
      servings: { create: food.servings.map((s, i) => ({ label: s.label, unit: s.unit, grams: s.grams, isDefault: i === 0, position: i })) },
    },
  });
  return (await getFood(created.id, userId))!;
}

/** Local food (by id), or an external one imported on the spot. */
export async function resolveFood(id: string, userId: string): Promise<FoodDTO | null> {
  if (id.startsWith("ext:")) return importExternalFood(id, userId);
  return getFood(id, userId);
}

export async function lookupBarcode(code: string, userId: string): Promise<FoodDTO | null> {
  // Your own entry first, then anything someone else added, then the catalogue.
  const matches = await db.food.findMany({
    where: { barcode: code, archivedAt: null, ...visibleFoodWhere(userId) },
    select: { id: true, ownerId: true },
    orderBy: { updatedAt: "desc" },
  });
  const local = matches.find((f) => f.ownerId === userId) ?? matches.find((f) => f.ownerId) ?? matches[0];
  if (local) return getFood(local.id, userId);
  return getOpenFoodFactsProduct(code);
}
