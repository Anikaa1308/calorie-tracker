import { z } from "zod";
import { handle, parseBody } from "@/server/http";
import { deleteAccount } from "@/server/services/account";
import { requireUserId } from "@/server/session";

export const DELETE = handle(async (req: Request) => {
  const userId = await requireUserId();
  await parseBody(req, z.object({ confirm: z.literal("delete", { message: 'Type "delete" to confirm.' }) }));
  await deleteAccount(userId);
  return { ok: true };
});
