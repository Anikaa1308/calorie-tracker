import { addEntrySchema } from "@/lib/schemas";
import { handle, parseBody } from "@/server/http";
import { addItem } from "@/server/services/diary";
import { requireUserId } from "@/server/session";

export const POST = handle(async (req: Request) => {
  const userId = await requireUserId();
  return addItem(userId, await parseBody(req, addEntrySchema));
});
