import "server-only";
import type { z } from "zod";
import { roundForStorage } from "@/lib/nutrition";
import { toPer100 } from "@/lib/recipes";
import type { customFoodSchema } from "@/lib/schemas";
import { db } from "../db";
import { getFood } from "../food-data/local";
import { notFound } from "../http";
import { buildSearchText, slugify } from "../search-text";

type Input = z.infer<typeof customFoodSchema>;

async function brandId(name?: string | null) {
  if (!name) return null;
  const b = await db.brand.upsert({
    where: { slug: slugify(name) },
    create: { name, slug: slugify(name) },
    update: {},
  });
  return b.id;
}

function foodData(input: Input, bId: string | null) {
  return {
    name: input.name,
    brandId: bId,
    category: input.category ?? null,
    kind: "USER" as const,
    basis: input.basis,
    densityGPerMl: input.densityGPerMl ?? null,
    source: input.fromLabel ? ("PRODUCT_LABEL" as const) : ("USER" as const),
    confidence: "HIGH" as const,
    barcode: input.barcode ?? null,
    searchText: buildSearchText(input.name, input.brand),
  };
}

export async function createCustomFood(userId: string, input: Input) {
  const per100 = roundForStorage(toPer100(input.nutrients, input.valuesPer));
  const food = await db.food.create({
    data: {
      ...foodData(input, await brandId(input.brand)),
      ownerId: userId,
      nutrition: { create: per100 },
      servings: {
        create: input.servings.map((s, i) => ({ label: s.label, unit: "serving", grams: s.grams, isDefault: i === 0, position: i })),
      },
    },
  });
  return getFood(food.id, userId);
}

async function owned(userId: string, id: string) {
  const f = await db.food.findFirst({ where: { id, ownerId: userId, kind: "USER", archivedAt: null } });
  if (!f) throw notFound("Food not found.");
  return f;
}

/** Editing a food never changes what was already logged: diary entries keep their snapshot. */
export async function updateCustomFood(userId: string, id: string, input: Input) {
  await owned(userId, id);
  const per100 = roundForStorage(toPer100(input.nutrients, input.valuesPer));
  await db.$transaction([
    db.food.update({ where: { id }, data: foodData(input, await brandId(input.brand)) }),
    db.foodNutrition.upsert({ where: { foodId: id }, create: { foodId: id, ...per100 }, update: per100 }),
    db.foodServing.deleteMany({ where: { foodId: id } }),
    db.foodServing.createMany({
      data: input.servings.map((s, i) => ({ foodId: id, label: s.label, unit: "serving", grams: s.grams, isDefault: i === 0, position: i })),
    }),
  ]);
  return getFood(id, userId);
}

export async function archiveCustomFood(userId: string, id: string) {
  await owned(userId, id);
  await db.food.update({ where: { id }, data: { archivedAt: new Date() } });
  return { id };
}
