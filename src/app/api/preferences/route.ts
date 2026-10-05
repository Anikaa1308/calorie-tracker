import { preferencesSchema } from "@/lib/schemas";
import { handle, parseBody } from "@/server/http";
import { savePreferences } from "@/server/services/profile";
import { requireUserId } from "@/server/session";

export const PATCH = handle(async (req: Request) => {
  const userId = await requireUserId();
  return savePreferences(userId, await parseBody(req, preferencesSchema));
});
