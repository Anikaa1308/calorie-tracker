import { handle } from "@/server/http";
import { deleteWeight } from "@/server/services/history";
import { requireUserId } from "@/server/session";

export const DELETE = handle(async (_req: Request, ctx: RouteContext<"/api/weights/[id]">) =>
  deleteWeight(await requireUserId(), (await ctx.params).id),
);
