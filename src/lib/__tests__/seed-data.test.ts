import { describe, expect, it } from "vitest";
import { SEED_FOODS } from "../../../prisma/seed-data";
import { caloriesFromMacros } from "../nutrition";

describe("seed data", () => {
  it("has the categories the plan calls for", () => {
    const count = (pred: (f: (typeof SEED_FOODS)[number]) => boolean) => SEED_FOODS.filter(pred).length;
    expect(count((f) => !f.brand && f.source === "ESTIMATED")).toBeGreaterThanOrEqual(30);
    expect(count((f) => !!f.brand)).toBeGreaterThanOrEqual(20);
    expect(count((f) => f.category === "Fruits")).toBeGreaterThanOrEqual(10);
    expect(count((f) => f.category === "Vegetables")).toBeGreaterThanOrEqual(10);
    expect(count((f) => f.category === "Protein")).toBeGreaterThanOrEqual(10);
  });

  it("has unique names per brand", () => {
    const keys = SEED_FOODS.map((f) => `${f.brand ?? ""}|${f.name}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has energy roughly consistent with macros", () => {
    for (const f of SEED_FOODS) {
      const [kcal, protein, carbs, fat, fiber] = f.n;
      // Atwater factors on total carbs overcount fibre, so allow fibre·2 of slack plus 12 %.
      const fromMacros = caloriesFromMacros({ protein, carbs, fat });
      const diff = Math.abs(fromMacros - kcal);
      expect(diff, `${f.name}: ${kcal} kcal vs ${fromMacros.toFixed(0)} from macros`).toBeLessThanOrEqual(
        kcal * 0.12 + fiber * 2 + 5,
      );
      expect(fiber).toBeLessThanOrEqual(carbs + 0.01);
    }
  });

  it("has positive serving weights", () => {
    for (const f of SEED_FOODS) for (const [, , g] of f.servings ?? []) expect(g).toBeGreaterThan(0);
  });
});
