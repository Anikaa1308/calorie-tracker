import { recipeSchema } from "@/lib/schemas";
import { handle, parseBody } from "@/server/http";
import { listRecipes, saveRecipe } from "@/server/services/recipes";
import { requireUserId } from "@/server/session";

export const GET = handle(async () => ({ recipes: await listRecipes(await requireUserId()) }));

export const POST = handle(async (req: Request) => {
  const userId = await requireUserId();
  return saveRecipe(userId, await parseBody(req, recipeSchema));
});
