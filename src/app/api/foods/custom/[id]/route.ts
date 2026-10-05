import { customFoodSchema } from "@/lib/schemas";
import { handle, parseBody } from "@/server/http";
import { archiveCustomFood, updateCustomFood } from "@/server/services/custom-foods";
import { requireUserId } from "@/server/session";

type Ctx = RouteContext<"/api/foods/custom/[id]">;

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  const userId = await requireUserId();
  return updateCustomFood(userId, (await ctx.params).id, await parseBody(req, customFoodSchema));
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) =>
  archiveCustomFood(await requireUserId(), (await ctx.params).id),
);
