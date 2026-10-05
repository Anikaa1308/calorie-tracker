import type { FoodDTO } from "@/lib/types";
import type { Prisma } from "@/generated/prisma/client";

export const foodInclude = {
  brand: true,
  nutrition: true,
  servings: { orderBy: { position: "asc" } },
} satisfies Prisma.FoodInclude;

export type FoodWithRelations = Prisma.FoodGetPayload<{ include: typeof foodInclude }>;

export function toFoodDTO(
  f: FoodWithRelations,
  ctx: { userId?: string; favorites?: Set<string>; last?: Map<string, { quantity: number; unit: string }> } = {},
): FoodDTO {
  const n = f.nutrition;
  return {
    id: f.id,
    name: f.name,
    brand: f.brand?.name ?? null,
    category: f.category,
    kind: f.kind,
    basis: f.basis,
    densityGPerMl: f.densityGPerMl,
    source: f.source,
    confidence: f.confidence,
    sourceNote: f.sourceNote,
    barcode: f.barcode,
    per100: n ? { calories: n.calories, protein: n.protein, carbs: n.carbs, fat: n.fat, fiber: n.fiber } : null,
    servings: f.servings.map((s) => ({ label: s.label, unit: s.unit, grams: s.grams, isDefault: s.isDefault })),
    isOwn: !!ctx.userId && f.ownerId === ctx.userId,
    isFavorite: ctx.favorites?.has(f.id) ?? false,
    last: ctx.last?.get(f.id) ?? null,
  };
}
