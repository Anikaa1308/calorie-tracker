import { describe, expect, it } from "vitest";
import { computeRecipe, toPer100 } from "../recipes";

const g = (name: string, per100: [number, number, number, number, number], extra = {}) => ({
  name,
  basis: "PER_100G" as const,
  per100: { calories: per100[0], protein: per100[1], carbs: per100[2], fat: per100[3], fiber: per100[4] },
  ...extra,
});

const dal = g("Toor dal, dry", [343, 22, 63, 1.5, 15]);
const ghee = g("Ghee", [876, 0.3, 0, 99.5, 0], { densityGPerMl: 0.91 });
const onion = g("Onion", [40, 1.1, 9.3, 0.1, 1.7], { servings: [{ label: "1 medium", unit: "piece", grams: 110 }] });

describe("computeRecipe", () => {
  it("sums ingredients including oil/ghee and splits per serving", () => {
    const r = computeRecipe(
      [
        { food: dal, quantity: 200, unit: "g" },
        { food: ghee, quantity: 1, unit: "tbsp" },
        { food: onion, quantity: 1, unit: "1 medium" },
      ],
      4,
    );
    const gheeKcal = 876 * 0.1365;
    expect(r.total.calories).toBeCloseTo(686 + gheeKcal + 44, 1);
    expect(r.perServing.calories).toBeCloseTo(r.total.calories / 4, 5);
    expect(r.total.fat).toBeCloseTo(3 + 99.5 * 0.1365 + 0.11, 2);
    expect(r.totalWeightG).toBeCloseTo(200 + 13.65 + 110, 2);
    expect(r.invalid).toEqual([]);
  });

  it("uses cooked weight for per-100 g when given", () => {
    const r = computeRecipe([{ food: dal, quantity: 200, unit: "g" }], 4, 1000);
    expect(r.per100g.calories).toBeCloseTo(68.6);
    expect(r.servingGrams).toBe(250);
  });

  it("flags ingredients with unknown units", () => {
    const r = computeRecipe([{ food: dal, quantity: 1, unit: "scoop" }], 2);
    expect(r.invalid).toEqual([0]);
    expect(r.total.calories).toBe(0);
  });
});

describe("toPer100", () => {
  it("normalises label values", () => {
    expect(toPer100({ calories: 140, protein: 10.4, carbs: 19.2, fat: 2.4, fiber: 3.6 }, 40).calories).toBeCloseTo(350);
  });
});
