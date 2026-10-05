import { describe, expect, it } from "vitest";
import {
  bmrMifflinStJeor,
  calculateTargets,
  macroCalorieGap,
  rebalance,
  referenceWeight,
  type ActivityLevel,
  type BodyInput,
  type Goal,
  type Rate,
} from "../goals";

const base: BodyInput = {
  sex: "FEMALE",
  age: 28,
  heightCm: 162,
  weightKg: 62,
  activity: "LIGHT",
  goal: "MAINTAIN",
};

describe("BMR", () => {
  it("matches Mifflin–St Jeor", () => {
    expect(bmrMifflinStJeor({ sex: "MALE", age: 30, heightCm: 180, weightKg: 80 })).toBe(1780);
    expect(bmrMifflinStJeor({ sex: "FEMALE", age: 30, heightCm: 165, weightKg: 60 })).toBeCloseTo(1320.25);
  });
});

describe("calculateTargets", () => {
  it("maintenance equals TDEE rounded to 10", () => {
    const r = calculateTargets(base);
    expect(r.calories).toBe(Math.round(r.tdee / 10) * 10);
    expect(r.floorApplied).toBe(false);
  });

  it("applies loss rates and caps the deficit at 750", () => {
    const slow = calculateTargets({ ...base, goal: "LOSE", rate: "SLOW" });
    const fast = calculateTargets({ ...base, goal: "LOSE", rate: "AGGRESSIVE" });
    expect(slow.calories).toBeGreaterThan(fast.calories);

    const big = calculateTargets({
      sex: "MALE",
      age: 25,
      heightCm: 190,
      weightKg: 110,
      activity: "EXTREME",
      goal: "LOSE",
      rate: "AGGRESSIVE",
    });
    expect(big.deficitCapped).toBe(true);
    expect(big.tdee - big.calories).toBeLessThanOrEqual(755);
  });

  it("never goes below the safety floor", () => {
    const r = calculateTargets({
      sex: "FEMALE",
      age: 60,
      heightCm: 150,
      weightKg: 48,
      activity: "SEDENTARY",
      goal: "LOSE",
      rate: "AGGRESSIVE",
    });
    expect(r.calories).toBeGreaterThanOrEqual(Math.min(1200, r.tdee) - 5);
    expect(r.calories).toBeGreaterThanOrEqual(r.bmr - 5);
    expect(r.floorApplied).toBe(true);
  });

  it("uses BMI-25 reference weight above BMI 30", () => {
    expect(referenceWeight(120, 170)).toBeCloseTo(72.25);
    expect(referenceWeight(70, 170)).toBe(70);
  });

  it("is internally consistent across a grid of inputs", () => {
    const goals: Goal[] = ["LOSE", "MAINTAIN", "GAIN", "BUILD_MUSCLE", "RECOMP"];
    const acts: ActivityLevel[] = ["SEDENTARY", "LIGHT", "MODERATE", "VERY", "EXTREME"];
    const rates: Rate[] = ["SLOW", "MODERATE", "AGGRESSIVE"];
    for (const sex of ["MALE", "FEMALE"] as const)
      for (const weightKg of [45, 60, 80, 110, 150])
        for (const heightCm of [150, 165, 185])
          for (const age of [18, 35, 70])
            for (const goal of goals)
              for (const activity of acts)
                for (const rate of rates) {
                  const r = calculateTargets({ sex, weightKg, heightCm, age, goal, activity, rate });
                  expect(Math.abs(macroCalorieGap(r))).toBeLessThanOrEqual(10);
                  expect(r.protein * 4).toBeLessThanOrEqual(r.calories * 0.35 + 2);
                  expect(r.fat * 9).toBeGreaterThanOrEqual(r.calories * 0.25 - 5);
                  expect(r.carbs).toBeGreaterThanOrEqual(50);
                  expect(r.fiber).toBeGreaterThanOrEqual(25);
                  expect(r.calories % 10).toBe(0);
                }
  });

  it("gives more protein for muscle goals and very active people", () => {
    const m = calculateTargets({ ...base, goal: "MAINTAIN" });
    const b = calculateTargets({ ...base, goal: "BUILD_MUSCLE" });
    const bv = calculateTargets({ ...base, goal: "BUILD_MUSCLE", activity: "VERY" });
    expect(b.protein).toBeGreaterThan(m.protein);
    expect(bv.proteinPerKg).toBeCloseTo(2.2);
  });
});

describe("rebalance", () => {
  const t = { calories: 1800, protein: 110, carbs: 205, fat: 60, fiber: 25 };

  it("keeps protein when calories change", () => {
    const { targets } = rebalance(t, "calories", 1600);
    expect(targets.protein).toBe(110);
    expect(Math.abs(macroCalorieGap(targets))).toBeLessThanOrEqual(10);
  });
  it("moves carbs when protein changes", () => {
    const { targets } = rebalance(t, "protein", 130);
    expect(targets.fat).toBe(60);
    expect(targets.carbs).toBe(185);
  });
  it("moves fat when carbs change", () => {
    const { targets } = rebalance(t, "carbs", 150);
    expect(Math.abs(macroCalorieGap(targets))).toBeLessThanOrEqual(10);
    expect(targets.protein).toBe(110);
  });
  it("warns instead of going negative", () => {
    const r = rebalance(t, "protein", 500);
    expect(r.targets.carbs).toBe(0);
    expect(r.warning).toBeDefined();
  });
});
