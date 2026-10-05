import { describe, expect, it } from "vitest";
import { calculateNutrition, caloriesFromMacros, progress, roundForStorage, sumNutrients } from "../nutrition";
import { describeRemaining, formatGrams, formatKcal } from "../format";

const paneer = {
  basis: "PER_100G" as const,
  per100: { calories: 265, protein: 18.3, carbs: 1.2, fat: 20.8, fiber: 0 },
  servings: [{ label: "1 cube", unit: "piece", grams: 25 }],
};
const milk = {
  basis: "PER_100ML" as const,
  densityGPerMl: 1.03,
  per100: { calories: 62, protein: 3.2, carbs: 4.8, fat: 3.4, fiber: 0 },
};

describe("calculateNutrition", () => {
  it("scales per 100 g", () => {
    const r = calculateNutrition(paneer, 150, "g")!;
    expect(r.grams).toBe(150);
    expect(r.nutrients.calories).toBeCloseTo(397.5);
    expect(r.nutrients.protein).toBeCloseTo(27.45);
  });
  it("uses servings", () => {
    const r = calculateNutrition(paneer, 4, "1 cube")!;
    expect(r.grams).toBe(100);
    expect(r.nutrients.calories).toBeCloseTo(265);
  });
  it("handles fractional quantities", () => {
    const r = calculateNutrition(paneer, 5 / 6, "1 cube")!;
    expect(r.nutrients.calories).toBeCloseTo((265 * 25 * 5) / 6 / 100);
  });
  it("handles per-100ml foods", () => {
    const r = calculateNutrition(milk, 1, "cup")!;
    expect(r.nutrients.calories).toBeCloseTo(148.8);
    expect(r.grams).toBeCloseTo(247.2);
  });
  it("returns null for unknown units", () => {
    expect(calculateNutrition(paneer, 1, "scoop")).toBeNull();
  });
});

describe("totals", () => {
  it("sums and rounds", () => {
    const t = sumNutrients([
      { calories: 100.04, protein: 1.111 },
      { calories: 50, fat: 2 },
    ]);
    expect(roundForStorage(t)).toEqual({ calories: 150, protein: 1.11, carbs: 0, fat: 2, fiber: 0 });
    expect(caloriesFromMacros({ protein: 10, carbs: 10, fat: 10 })).toBe(170);
  });
});

describe("progress", () => {
  it("classifies under / on / over with a ±5% band", () => {
    expect(progress(1247, 1600).status).toBe("under");
    expect(progress(1247, 1600).remaining).toBe(353);
    expect(progress(1560, 1600).status).toBe("on");
    expect(progress(1670, 1600).status).toBe("on");
    expect(progress(1700, 1600).status).toBe("over");
    expect(progress(10, 0).status).toBe("under");
  });
});

describe("format", () => {
  it("rounds for display", () => {
    expect(formatKcal(1247.6)).toBe("1,248");
    expect(formatGrams(10.0)).toBe("10");
    expect(formatGrams(10.44)).toBe("10.4");
    expect(formatGrams(-0.01)).toBe("0");
    expect(describeRemaining("calories", 353, 1600)).toBe("353 kcal left");
    expect(describeRemaining("protein", -12, 100)).toBe("12 g over");
  });
});
