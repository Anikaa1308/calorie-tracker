import { dateKeySchema } from "@/lib/schemas";
import { handle } from "@/server/http";
import { getDay } from "@/server/services/diary";
import { requireUserId } from "@/server/session";

export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/day/[date]">) => {
  const userId = await requireUserId();
  const date = dateKeySchema.parse((await ctx.params).date);
  return getDay(userId, date);
});
