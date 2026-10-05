import { copyMealSchema } from "@/lib/schemas";
import { handle, parseBody } from "@/server/http";
import { copyMeal } from "@/server/services/diary";
import { requireUserId } from "@/server/session";

export const POST = handle(async (req: Request) => {
  const userId = await requireUserId();
  return copyMeal(userId, await parseBody(req, copyMealSchema));
});
