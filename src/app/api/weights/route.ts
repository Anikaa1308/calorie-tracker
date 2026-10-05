import { weightSchema } from "@/lib/schemas";
import { handle, parseBody } from "@/server/http";
import { listWeights, saveWeight } from "@/server/services/history";
import { requireUserId } from "@/server/session";

export const GET = handle(async () => ({ entries: await listWeights(await requireUserId()) }));

export const POST = handle(async (req: Request) => {
  const userId = await requireUserId();
  return saveWeight(userId, await parseBody(req, weightSchema));
});
