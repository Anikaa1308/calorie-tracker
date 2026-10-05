import { updateEntrySchema } from "@/lib/schemas";
import { handle, parseBody } from "@/server/http";
import { deleteItem, updateItem } from "@/server/services/diary";
import { requireUserId } from "@/server/session";

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/entries/[id]">) => {
  const userId = await requireUserId();
  const { id } = await ctx.params;
  return updateItem(userId, id, await parseBody(req, updateEntrySchema));
});

export const DELETE = handle(async (_req: Request, ctx: RouteContext<"/api/entries/[id]">) => {
  const userId = await requireUserId();
  return deleteItem(userId, (await ctx.params).id);
});
