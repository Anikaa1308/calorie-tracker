import { z } from "zod";
import { handle } from "@/server/http";
import { getLibrary } from "@/server/services/library";
import { requireUserId } from "@/server/session";

const tabSchema = z.enum(["recent", "frequent", "favorites", "mine", "recipes"]);

export const GET = handle(async (req: Request) => {
  const userId = await requireUserId();
  const tab = tabSchema.parse(new URL(req.url).searchParams.get("tab") ?? "recent");
  return { tab, foods: await getLibrary(userId, tab) };
});
