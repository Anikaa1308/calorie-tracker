import { z } from "zod";
import { dateKeySchema } from "@/lib/schemas";
import { handle } from "@/server/http";
import { getHistory } from "@/server/services/history";
import { requireUserId } from "@/server/session";

const query = z.object({ end: dateKeySchema, days: z.coerce.number().int().min(1).max(366) });

export const GET = handle(async (req: Request) => {
  const userId = await requireUserId();
  const sp = new URL(req.url).searchParams;
  const { end, days } = query.parse({ end: sp.get("end"), days: sp.get("days") ?? 7 });
  return { days: await getHistory(userId, end, days) };
});
