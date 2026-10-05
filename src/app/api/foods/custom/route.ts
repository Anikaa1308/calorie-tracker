import { customFoodSchema } from "@/lib/schemas";
import { handle, parseBody } from "@/server/http";
import { createCustomFood } from "@/server/services/custom-foods";
import { requireUserId } from "@/server/session";

export const POST = handle(async (req: Request) => {
  const userId = await requireUserId();
  return createCustomFood(userId, await parseBody(req, customFoodSchema));
});
