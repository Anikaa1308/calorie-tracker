import { searchLocalFoods } from "@/server/food-data/local";
import { handle } from "@/server/http";
import { requireUserId } from "@/server/session";

export const GET = handle(async (req: Request) => {
  const userId = await requireUserId();
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (!q) return { query: q, results: [] };
  const results = await searchLocalFoods(q, userId);
  return { query: q, results };
});
