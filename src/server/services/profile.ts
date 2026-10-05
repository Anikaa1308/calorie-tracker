import "server-only";
import type { z } from "zod";
import { ageOn, dateKeyToDb, parseDateKey, type DateKey } from "@/lib/dates";
import { calculateTargets, type BodyInput, type Targets } from "@/lib/goals";
import type { preferencesSchema, saveProfileSchema } from "@/lib/schemas";
import type { GoalDTO, ProfileDTO } from "@/lib/types";
import { db } from "../db";
import { badRequest } from "../http";
import { getGoalForDate } from "./goals";

export async function getProfile(userId: string): Promise<ProfileDTO> {
  const [user, p] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.profile.findUnique({ where: { userId } }),
  ]);
  return {
    sex: p?.sex ?? null,
    age: p?.birthDate ? ageOn(p.birthDate) : null,
    heightCm: p?.heightCm ?? null,
    weightKg: p?.weightKg ?? null,
    goalWeightKg: p?.goalWeightKg ?? null,
    activityLevel: p?.activityLevel ?? null,
    goal: p?.goal ?? null,
    rate: p?.rate ?? null,
    weightUnit: p?.weightUnit ?? "KG",
    heightUnit: p?.heightUnit ?? "CM",
    theme: p?.theme ?? "system",
    onboarded: !!p?.onboardedAt,
    name: user?.name ?? null,
    email: user?.email ?? null,
  };
}

export function bodyInputFromProfile(p: ProfileDTO): BodyInput | null {
  if (!p.sex || !p.age || !p.heightCm || !p.weightKg || !p.activityLevel || !p.goal) return null;
  return {
    sex: p.sex,
    age: p.age,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    activity: p.activityLevel,
    goal: p.goal,
    rate: p.rate ?? undefined,
  };
}

/** Birth date approximated from age so the age keeps counting up. */
function birthDateFromAge(age: number, today: DateKey): Date {
  const d = parseDateKey(today);
  return dateKeyToDb(`${d.getFullYear() - age}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
}

async function writeGoal(userId: string, today: DateKey, targets: Targets, rec: Targets | null, isCustom: boolean) {
  const effectiveFrom = dateKeyToDb(today);
  const data = {
    ...targets,
    isCustom,
    recCalories: rec?.calories ?? null,
    recProtein: rec?.protein ?? null,
    recCarbs: rec?.carbs ?? null,
    recFat: rec?.fat ?? null,
    recFiber: rec?.fiber ?? null,
  };
  await db.dailyGoal.upsert({
    where: { userId_effectiveFrom: { userId, effectiveFrom } },
    create: { userId, effectiveFrom, ...data },
    update: data,
  });
}

export async function saveProfile(userId: string, input: z.infer<typeof saveProfileSchema>) {
  const { today, applyRecommendation, ...body } = input;
  if (body.goal === "LOSE" && !body.rate) body.rate = "MODERATE";
  const rec = calculateTargets({
    sex: body.sex,
    age: body.age,
    heightCm: body.heightCm,
    weightKg: body.weightKg,
    activity: body.activityLevel,
    goal: body.goal,
    rate: body.rate ?? undefined,
  });
  const recTargets: Targets = { calories: rec.calories, protein: rec.protein, carbs: rec.carbs, fat: rec.fat, fiber: rec.fiber };

  const existing = await db.profile.findUnique({ where: { userId } });
  const profileData = {
    sex: body.sex,
    birthDate: birthDateFromAge(body.age, today),
    heightCm: body.heightCm,
    weightKg: body.weightKg,
    goalWeightKg: body.goalWeightKg ?? null,
    activityLevel: body.activityLevel,
    goal: body.goal,
    rate: body.goal === "LOSE" ? (body.rate ?? "MODERATE") : null,
    ...(body.weightUnit ? { weightUnit: body.weightUnit } : {}),
    ...(body.heightUnit ? { heightUnit: body.heightUnit } : {}),
    onboardedAt: existing?.onboardedAt ?? new Date(),
  };
  await db.profile.upsert({ where: { userId }, create: { userId, ...profileData }, update: profileData });

  // Keep the weight log in step with the profile's current weight.
  await db.weightEntry.upsert({
    where: { userId_date: { userId, date: dateKeyToDb(today) } },
    create: { userId, date: dateKeyToDb(today), weightKg: body.weightKg },
    update: { weightKg: body.weightKg },
  });

  const current = await getGoalForDate(userId, today);
  if (applyRecommendation || !current) {
    await writeGoal(userId, today, recTargets, recTargets, false);
  } else {
    // Keep the person's own targets; refresh the stored recommendation alongside them.
    await writeGoal(userId, today, current, recTargets, current.isCustom);
  }
  return { profile: await getProfile(userId), recommendation: rec, goal: await getGoalForDate(userId, today) };
}

export async function saveGoals(userId: string, today: DateKey, targets: Targets): Promise<GoalDTO | null> {
  const profile = await getProfile(userId);
  const body = bodyInputFromProfile(profile);
  const rec = body ? calculateTargets(body) : null;
  const recTargets = rec ? { calories: rec.calories, protein: rec.protein, carbs: rec.carbs, fat: rec.fat, fiber: rec.fiber } : null;
  const isCustom =
    !recTargets || (Object.keys(targets) as (keyof Targets)[]).some((k) => targets[k] !== recTargets[k]);
  if (targets.protein * 4 + targets.carbs * 4 + targets.fat * 9 > targets.calories * 1.5)
    throw badRequest("Your macros add up to far more than your calorie target.");
  await writeGoal(userId, today, targets, recTargets, isCustom);
  return getGoalForDate(userId, today);
}

export async function savePreferences(userId: string, input: z.infer<typeof preferencesSchema>) {
  const { name, ...prefs } = input;
  if (name !== undefined) await db.user.update({ where: { id: userId }, data: { name } });
  if (Object.keys(prefs).length) {
    await db.profile.upsert({ where: { userId }, create: { userId, ...prefs }, update: prefs });
  }
  return getProfile(userId);
}
