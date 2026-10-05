import { dateKeySchema, saveGoalsSchema } from "@/lib/schemas";
import { handle, parseBody } from "@/server/http";
import { getGoalForDate } from "@/server/services/goals";
import { saveGoals } from "@/server/services/profile";
import { requireUserId } from "@/server/session";

export const GET = handle(async (req: Request) => {
  const userId = await requireUserId();
  const date = dateKeySchema.parse(new URL(req.url).searchParams.get("date"));
  return { goal: await getGoalForDate(userId, date) };
});

export const PUT = handle(async (req: Request) => {
  const userId = await requireUserId();
  const { today, targets } = await parseBody(req, saveGoalsSchema);
  return { goal: await saveGoals(userId, today, targets) };
});
