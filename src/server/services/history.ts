import "server-only";
import { addDays, dateKeyToDb, dateRange, dbToDateKey, type DateKey } from "@/lib/dates";
import type { Nutrients } from "@/lib/nutrition";
import { db } from "../db";

export interface HistoryDay {
  date: DateKey;
  totals: Nutrients;
  itemCount: number;
  goal: Nutrients | null;
}

export async function getHistory(userId: string, end: DateKey, days: number): Promise<HistoryDay[]> {
  const start = addDays(end, -(days - 1));
  const [rows, goals] = await Promise.all([
    db.dailyNutrition.findMany({
      where: { userId, date: { gte: dateKeyToDb(start), lte: dateKeyToDb(end) } },
    }),
    db.dailyGoal.findMany({ where: { userId }, orderBy: { effectiveFrom: "asc" } }),
  ]);
  const byDate = new Map(rows.map((r) => [dbToDateKey(r.date), r]));
  return dateRange(end, days).map((date) => {
    const r = byDate.get(date);
    // Goal in force that day; days before the first goal use the first goal.
    let g = goals[0] ?? null;
    for (const row of goals) if (dbToDateKey(row.effectiveFrom) <= date) g = row;
    return {
      date,
      totals: r
        ? { calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber }
        : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      itemCount: r?.itemCount ?? 0,
      goal: g ? { calories: g.calories, protein: g.protein, carbs: g.carbs, fat: g.fat, fiber: g.fiber } : null,
    };
  });
}

export async function listWeights(userId: string, days = 365) {
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await db.weightEntry.findMany({ where: { userId, date: { gte: since } }, orderBy: { date: "asc" } });
  return rows.map((r) => ({ id: r.id, date: dbToDateKey(r.date), weightKg: r.weightKg, note: r.note }));
}

async function syncProfileWeight(userId: string) {
  const latest = await db.weightEntry.findFirst({ where: { userId }, orderBy: { date: "desc" } });
  if (latest) await db.profile.updateMany({ where: { userId }, data: { weightKg: latest.weightKg } });
}

export async function saveWeight(userId: string, input: { date: DateKey; weightKg: number; note?: string | null }) {
  const date = dateKeyToDb(input.date);
  const row = await db.weightEntry.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, weightKg: input.weightKg, note: input.note ?? null },
    update: { weightKg: input.weightKg, note: input.note ?? null },
  });
  await syncProfileWeight(userId);
  return { id: row.id, date: input.date, weightKg: row.weightKg, note: row.note };
}

export async function deleteWeight(userId: string, id: string) {
  await db.weightEntry.deleteMany({ where: { id, userId } });
  await syncProfileWeight(userId);
  return { id };
}
