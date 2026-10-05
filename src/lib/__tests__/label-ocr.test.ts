import { describe, expect, it } from "vitest";
import { parseNutritionLabel } from "../label-ocr";

describe("parseNutritionLabel", () => {
  it("reads a typical Indian label per 100 g", () => {
    const d = parseNutritionLabel(`NUTRITIONAL INFORMATION
Approx. values per 100g
Energy (kcal) 389
Protein (g) 13.2
Carbohydrate (g) 67.8
of which Total Sugars (g) 1.2
Added Sugars (g) 0
Total Fat (g) 6.5
Saturated Fat (g) 1.1
Trans Fat (g) 0
Dietary Fibre (g) 10.1
Sodium (mg) 6`);
    expect(d.values).toEqual({ calories: 389, protein: 13.2, carbs: 67.8, fat: 6.5, fiber: 10.1 });
    expect(d.basis).toEqual({ kind: "100g" });
  });

  it("prefers kcal over kJ and handles per serving", () => {
    const d = parseNutritionLabel(`Nutrition per serving (40 g)
Energy 586 kJ / 140 kcal
Protein 10.4 g
Carbohydrates 19,2 g
Fat 2.4 g 4%`);
    expect(d.values.calories).toBe(140);
    expect(d.values.carbs).toBe(19.2);
    expect(d.values.fat).toBe(2.4);
    expect(d.values.fiber).toBeUndefined();
    expect(d.basis).toEqual({ kind: "serving", grams: 40 });
  });

  it("converts kJ-only energy and leaves unreadable values empty", () => {
    const d = parseNutritionLabel(`Per 100 ml
Energy 243 kJ
Protein ~ g`);
    expect(d.values.calories).toBe(58);
    expect(d.values.protein).toBeUndefined();
    expect(d.basis).toEqual({ kind: "100ml" });
  });
});
