import { searchFoods } from "@/server/food-data/search";
import { handle } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { requireUserId } from "@/server/session";

export const GET = handle(async (req: Request) => {
  const userId = await requireUserId();
  rateLimit(`search:${userId}`, 60, 60_000);
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim().slice(0, 100) ?? "";
  if (!q) return { query: q, results: [], external: [] };
  return { query: q, ...(await searchFoods(q, userId, { external: sp.get("external") !== "0" })) };
});
