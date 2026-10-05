import "server-only";
import { dateKeyToDb, dbToDateKey, type DateKey } from "@/lib/dates";
import type { GoalDTO } from "@/lib/types";
import type { DailyGoal } from "@/generated/prisma/client";
import { db } from "../db";

export function goalToDTO(g: DailyGoal): GoalDTO {
  return {
    calories: g.calories,
    protein: g.protein,
    carbs: g.carbs,
    fat: g.fat,
    fiber: g.fiber,
    isCustom: g.isCustom,
    effectiveFrom: dbToDateKey(g.effectiveFrom),
    recommended:
      g.recCalories != null
        ? {
            calories: g.recCalories,
            protein: g.recProtein ?? 0,
            carbs: g.recCarbs ?? 0,
            fat: g.recFat ?? 0,
            fiber: g.recFiber ?? 0,
          }
        : null,
  };
}

/** The goal that applied on a date: the latest row effective on or before it. */
export async function getGoalForDate(userId: string, date: DateKey): Promise<GoalDTO | null> {
  const g =
    (await db.dailyGoal.findFirst({
      where: { userId, effectiveFrom: { lte: dateKeyToDb(date) } },
      orderBy: { effectiveFrom: "desc" },
    })) ??
    // Days before the first goal was set compare against the first goal.
    (await db.dailyGoal.findFirst({ where: { userId }, orderBy: { effectiveFrom: "asc" } }));
  return g ? goalToDTO(g) : null;
}
