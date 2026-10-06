/**
 * Foods people add (kind USER, including label photos) go into one shared
 * catalogue that every account can search and log. Only the person who added
 * a food can edit or delete it. Recipes stay private to their owner.
 */
export function visibleFoodWhere(userId: string) {
  return { OR: [{ ownerId: null }, { ownerId: userId }, { kind: "USER" as const }] };
}

/** "you", the adder's name, or a neutral fallback; null for foods nobody added by hand. */
export function addedByLabel(
  food: { kind: string; ownerId: string | null; owner?: { name: string | null } | null },
  viewerId?: string,
): string | null {
  if (food.kind !== "USER") return null;
  if (viewerId && food.ownerId === viewerId) return "you";
  return food.owner?.name?.trim() || "another member";
}
