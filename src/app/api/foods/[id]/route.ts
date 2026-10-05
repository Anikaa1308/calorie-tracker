import { getFood } from "@/server/food-data/local";
import { handle, notFound } from "@/server/http";
import { requireUserId } from "@/server/session";

export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/foods/[id]">) => {
  const userId = await requireUserId();
  const food = await getFood((await ctx.params).id, userId);
  if (!food) throw notFound("Food not found.");
  return food;
});
