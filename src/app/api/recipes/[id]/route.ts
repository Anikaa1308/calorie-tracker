import { recipeSchema } from "@/lib/schemas";
import { handle, notFound, parseBody } from "@/server/http";
import { deleteRecipe, getRecipe, saveRecipe } from "@/server/services/recipes";
import { requireUserId } from "@/server/session";

type Ctx = RouteContext<"/api/recipes/[id]">;

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const r = await getRecipe(await requireUserId(), (await ctx.params).id);
  if (!r) throw notFound("Recipe not found.");
  return r;
});

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  const userId = await requireUserId();
  return saveRecipe(userId, await parseBody(req, recipeSchema), (await ctx.params).id);
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) =>
  deleteRecipe(await requireUserId(), (await ctx.params).id),
);
