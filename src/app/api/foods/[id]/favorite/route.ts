import { handle } from "@/server/http";
import { setFavorite } from "@/server/services/library";
import { requireUserId } from "@/server/session";

type Ctx = RouteContext<"/api/foods/[id]/favorite">;

export const PUT = handle(async (_req: Request, ctx: Ctx) =>
  setFavorite(await requireUserId(), (await ctx.params).id, true),
);
export const DELETE = handle(async (_req: Request, ctx: Ctx) =>
  setFavorite(await requireUserId(), (await ctx.params).id, false),
);
