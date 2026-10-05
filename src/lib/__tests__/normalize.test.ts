import { describe, expect, it } from "vitest";
import { normalizeOff, normalizeUsda, parseExternalId } from "../../server/food-data/normalize";

describe("normalizeOff", () => {
  it("maps a complete product label", () => {
    const f = normalizeOff({
      code: "8906078150214",
      product_name: "High Protein Chocolate Oats",
      brands: "Yoga Bar, Sproutlife",
      categories: "Breakfasts, Cereals, Oats",
      quantity: "400 g",
      serving_size: "40 g",
      serving_quantity: 40,
      nutriments: { "energy-kcal_100g": 350, proteins_100g: 26, carbohydrates_100g: 48, fat_100g: 6, fiber_100g: 9 },
    })!;
    expect(f.id).toBe("ext:off:8906078150214");
    expect(f.brand).toBe("Yoga Bar");
    expect(f.source).toBe("OPEN_FOOD_FACTS");
    expect(f.per100).toEqual({ calories: 350, protein: 26, carbs: 48, fat: 6, fiber: 9 });
    expect(f.servings[0]).toMatchObject({ grams: 40, label: "1 serving (40 g)" });
    expect(f.basis).toBe("PER_100G");
  });

  it("converts kJ when kcal is missing and treats ml products as liquids", () => {
    const f = normalizeOff({
      code: "123456789",
      product_name: "Toned milk",
      quantity: "500 ml",
      nutriments: { energy_100g: 243, proteins_100g: 3, carbohydrates_100g: 4.7, fat_100g: 3 },
    })!;
    expect(f.per100!.calories).toBeCloseTo(58.1, 1);
    expect(f.per100!.fiber).toBe(0);
    expect(f.sourceNote).toMatch(/Fiber isn't listed/);
    expect(f.basis).toBe("PER_100ML");
  });

  it("never invents numbers when core nutrients are missing", () => {
    const f = normalizeOff({ code: "99999999", product_name: "Mystery snack", nutriments: { "energy-kcal_100g": 500 } })!;
    expect(f.per100).toBeNull();
  });

  it("skips products without a name or code", () => {
    expect(normalizeOff({ code: "1", nutriments: {} })).toBeNull();
    expect(normalizeOff({ product_name: "x" })).toBeNull();
  });
});

describe("normalizeUsda", () => {
  it("maps search-shaped nutrients", () => {
    const f = normalizeUsda({
      fdcId: 173944,
      description: "Bananas, raw",
      dataType: "SR Legacy",
      foodNutrients: [
        { nutrientId: 1008, unitName: "KCAL", value: 89 },
        { nutrientId: 1003, unitName: "G", value: 1.09 },
        { nutrientId: 1005, unitName: "G", value: 22.84 },
        { nutrientId: 1004, unitName: "G", value: 0.33 },
        { nutrientId: 1079, unitName: "G", value: 2.6 },
      ],
    });
    expect(f.id).toBe("ext:usda:173944");
    expect(f.confidence).toBe("HIGH");
    expect(f.per100).toEqual({ calories: 89, protein: 1.09, carbs: 22.84, fat: 0.33, fiber: 2.6 });
  });

  it("maps detail-shaped nutrients, Atwater energy and branded servings", () => {
    const f = normalizeUsda({
      fdcId: 1,
      description: "GREEK YOGURT, PLAIN",
      dataType: "Branded",
      brandOwner: "ACME DAIRY",
      servingSize: 170,
      servingSizeUnit: "g",
      householdServingFullText: "1 container",
      foodNutrients: [
        { nutrient: { id: 1008, unitName: "kJ" }, amount: 250 },
        { nutrient: { id: 2047, unitName: "kcal" }, amount: 59 },
        { nutrient: { id: 1003, unitName: "g" }, amount: 10.2 },
        { nutrient: { id: 1005, unitName: "g" }, amount: 3.6 },
        { nutrient: { id: 1004, unitName: "g" }, amount: 0.4 },
      ],
    });
    expect(f.name).toBe("Greek Yogurt, Plain");
    expect(f.brand).toBe("Acme Dairy");
    expect(f.per100!.calories).toBe(59);
    expect(f.servings[0]).toMatchObject({ grams: 170, label: "1 container (170 g)" });
  });
});

describe("parseExternalId", () => {
  it("parses and rejects", () => {
    expect(parseExternalId("ext:off:8901063092471")).toEqual({ provider: "off", externalId: "8901063092471" });
    expect(parseExternalId("ext:usda:173944")).toEqual({ provider: "usda", externalId: "173944" });
    expect(parseExternalId("ext:evil:1")).toBeNull();
    expect(parseExternalId("abc")).toBeNull();
  });
});
