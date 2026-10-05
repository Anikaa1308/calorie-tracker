import { handle } from "@/server/http";
import { restoreItem } from "@/server/services/diary";
import { requireUserId } from "@/server/session";

export const POST = handle(async (_req: Request, ctx: RouteContext<"/api/entries/[id]/restore">) => {
  const userId = await requireUserId();
  return restoreItem(userId, (await ctx.params).id);
});
