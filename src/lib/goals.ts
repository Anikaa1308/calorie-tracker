/**
 * Daily target estimation. Mifflin–St Jeor BMR → TDEE → goal adjustment →
 * protein → fat → carbs from the remainder. Everything here is an estimate,
 * not medical advice, and the UI says so.
 */
import { caloriesFromMacros } from "./nutrition";

export type Sex = "MALE" | "FEMALE";
export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "VERY" | "EXTREME";
export type Goal = "LOSE" | "MAINTAIN" | "GAIN" | "BUILD_MUSCLE" | "RECOMP";
export type Rate = "SLOW" | "MODERATE" | "AGGRESSIVE";

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  VERY: 1.725,
  EXTREME: 1.9,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, { label: string; hint: string }> = {
  SEDENTARY: { label: "Sedentary", hint: "Desk job, little or no exercise" },
  LIGHT: { label: "Lightly active", hint: "Light exercise 1–3 days a week" },
  MODERATE: { label: "Moderately active", hint: "Exercise 3–5 days a week" },
  VERY: { label: "Very active", hint: "Hard exercise 6–7 days a week" },
  EXTREME: { label: "Extremely active", hint: "Physical job plus daily training" },
};

export const GOAL_LABEL: Record<Goal, { label: string; hint: string }> = {
  LOSE: { label: "Lose weight", hint: "A steady calorie deficit" },
  MAINTAIN: { label: "Maintain weight", hint: "Eat around what you burn" },
  GAIN: { label: "Gain weight", hint: "A modest calorie surplus" },
  BUILD_MUSCLE: { label: "Build muscle", hint: "Lean surplus with high protein" },
  RECOMP: { label: "Recomposition", hint: "Slight deficit, high protein" },
};

export const RATE_LABEL: Record<Rate, { label: string; hint: string }> = {
  SLOW: { label: "Slow", hint: "About 10% below maintenance" },
  MODERATE: { label: "Moderate", hint: "About 15% below maintenance" },
  AGGRESSIVE: { label: "Faster", hint: "About 20% below, capped at 750 kcal a day" },
};

const LOSS_FRACTION: Record<Rate, number> = { SLOW: 0.1, MODERATE: 0.15, AGGRESSIVE: 0.2 };
export const MAX_DEFICIT_KCAL = 750;
const GOAL_ADJUSTMENT: Record<Exclude<Goal, "LOSE">, number> = {
  MAINTAIN: 0,
  RECOMP: -0.05,
  GAIN: 0.1,
  BUILD_MUSCLE: 0.075,
};
export const MIN_CALORIES: Record<Sex, number> = { FEMALE: 1200, MALE: 1500 };

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  LOSE: 2.0,
  MAINTAIN: 1.6,
  RECOMP: 2.0,
  GAIN: 1.6,
  BUILD_MUSCLE: 2.0,
};
const PROTEIN_MAX_SHARE = 0.35;
const FAT_MIN_SHARE = 0.25;
const FAT_MIN_G_PER_KG = 0.6;
const CARBS_MIN_G = 50;
const FIBER_G_PER_1000_KCAL = 14;
const FIBER_MIN_G = 25;

export interface BodyInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  /** Only used for LOSE. */
  rate?: Rate;
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface GoalResult extends Targets {
  bmr: number;
  tdee: number;
  /** Calories before the safety floor was applied. */
  adjustedCalories: number;
  floorApplied: boolean;
  deficitCapped: boolean;
  referenceWeightKg: number;
  proteinPerKg: number;
}

export function bmrMifflinStJeor({ sex, age, heightCm, weightKg }: Pick<BodyInput, "sex" | "age" | "heightCm" | "weightKg">): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "MALE" ? base + 5 : base - 161;
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Body weight, or the weight at BMI 25 when BMI is above 30. */
export function referenceWeight(weightKg: number, heightCm: number): number {
  if (bmi(weightKg, heightCm) > 30) {
    const m = heightCm / 100;
    return 25 * m * m;
  }
  return weightKg;
}

const round10 = (n: number) => Math.round(n / 10) * 10;

export function calculateTargets(input: BodyInput): GoalResult {
  const bmr = bmrMifflinStJeor(input);
  const tdee = bmr * ACTIVITY_FACTOR[input.activity];

  let adjusted: number;
  let deficitCapped = false;
  if (input.goal === "LOSE") {
    const wanted = tdee * LOSS_FRACTION[input.rate ?? "MODERATE"];
    const deficit = Math.min(wanted, MAX_DEFICIT_KCAL);
    deficitCapped = wanted > MAX_DEFICIT_KCAL;
    adjusted = tdee - deficit;
  } else {
    adjusted = tdee * (1 + GOAL_ADJUSTMENT[input.goal]);
  }

  // Never below BMR or the sex-specific minimum, but a floor never pushes a
  // deficit goal above maintenance.
  const floor = Math.min(Math.max(bmr, MIN_CALORIES[input.sex]), tdee);
  const floorApplied = adjusted < floor;
  const calories = round10(Math.max(adjusted, floor));

  const refKg = referenceWeight(input.weightKg, input.heightCm);
  const highActivity = input.activity === "VERY" || input.activity === "EXTREME";
  const proteinPerKg = PROTEIN_G_PER_KG[input.goal] + (highActivity ? 0.2 : 0);

  const macros = splitMacros(calories, refKg, proteinPerKg);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    adjustedCalories: Math.round(adjusted),
    floorApplied,
    deficitCapped,
    referenceWeightKg: Math.round(refKg * 10) / 10,
    proteinPerKg,
    ...macros,
  };
}

/** Protein first, then fat, carbs take the remainder. Internally consistent to ±10 kcal. */
export function splitMacros(calories: number, refKg: number, proteinPerKg: number): Targets {
  const protein = Math.round(Math.min(refKg * proteinPerKg, (calories * PROTEIN_MAX_SHARE) / 4));
  const fatFloor = refKg * FAT_MIN_G_PER_KG;
  let fat = Math.max((calories * FAT_MIN_SHARE) / 9, fatFloor);
  let carbs = (calories - protein * 4 - fat * 9) / 4;
  if (carbs < CARBS_MIN_G) {
    fat = Math.max(fatFloor, (calories - protein * 4 - CARBS_MIN_G * 4) / 9);
    carbs = (calories - protein * 4 - fat * 9) / 4;
  }
  fat = Math.round(fat);
  carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat, fiber: fiberTarget(calories) };
}

export function fiberTarget(calories: number): number {
  return Math.max(FIBER_MIN_G, Math.round((calories / 1000) * FIBER_G_PER_1000_KCAL));
}

// ── Manual edits ─────────────────────────────────────────────────────────────

export type TargetKey = keyof Targets;

export interface RebalanceResult {
  targets: Targets;
  /** Set when the rebalance could not fully satisfy the calorie target. */
  warning?: string;
}

/**
 * Apply one manual change and rebalance the others so the macros still add up
 * to the calorie target. Protein is never changed by a rebalance.
 */
export function rebalance(current: Targets, key: TargetKey, value: number): RebalanceResult {
  const t: Targets = { ...current, [key]: value };
  let warning: string | undefined;

  switch (key) {
    case "calories": {
      // Keep protein grams and fat's share of calories; carbs take the rest.
      const fatShare = current.calories > 0 ? (current.fat * 9) / current.calories : FAT_MIN_SHARE;
      t.fat = Math.round((value * fatShare) / 9);
      t.carbs = Math.round((value - t.protein * 4 - t.fat * 9) / 4);
      t.fiber = fiberTarget(value);
      break;
    }
    case "protein":
    case "fat": {
      t.carbs = Math.round((t.calories - t.protein * 4 - t.fat * 9) / 4);
      break;
    }
    case "carbs": {
      t.fat = Math.round((t.calories - t.protein * 4 - t.carbs * 4) / 9);
      break;
    }
    case "fiber":
      break;
  }

  if (t.carbs < 0 || t.fat < 0) {
    t.carbs = Math.max(0, t.carbs);
    t.fat = Math.max(0, t.fat);
    warning = "These targets add up to more than your calorie goal.";
  }
  return { targets: t, warning };
}

/** Difference between calories implied by the macros and the calorie target. */
export function macroCalorieGap(t: Targets): number {
  return Math.round(caloriesFromMacros(t) - t.calories);
}
