import { saveProfileSchema } from "@/lib/schemas";
import { handle, parseBody } from "@/server/http";
import { getProfile, saveProfile } from "@/server/services/profile";
import { requireUserId } from "@/server/session";

export const GET = handle(async () => getProfile(await requireUserId()));

export const PUT = handle(async (req: Request) => {
  const userId = await requireUserId();
  return saveProfile(userId, await parseBody(req, saveProfileSchema));
});
