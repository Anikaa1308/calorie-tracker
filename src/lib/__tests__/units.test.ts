import { describe, expect, it } from "vitest";
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, parseQuantity, toBasisAmount, toGrams, unitOptions } from "../units";

describe("parseQuantity", () => {
  it.each([
    ["2", 2],
    ["1.5", 1.5],
    ["1,5", 1.5],
    [".5", 0.5],
    ["5/6", 5 / 6],
    ["1 1/2", 1.5],
    ["½", 0.5],
    ["1½", 1.5],
    ["  3  ", 3],
  ])("parses %s", (input, expected) => {
    expect(parseQuantity(input)).toBeCloseTo(expected, 6);
  });

  it.each(["", "abc", "0", "-1", "1/0", "1 2", "2..5"])("rejects %s", (input) => {
    expect(parseQuantity(input)).toBeNull();
  });
});

const roti = {
  basis: "PER_100G" as const,
  servings: [{ label: "1 roti", unit: "piece", grams: 40, isDefault: true }],
};
const milk = { basis: "PER_100ML" as const, densityGPerMl: 1.03 };
const ghee = { basis: "PER_100G" as const, densityGPerMl: 0.91 };

describe("toGrams", () => {
  it("handles mass units", () => {
    expect(toGrams(roti, 150, "g")).toBe(150);
    expect(toGrams(roti, 0.2, "kg")).toBe(200);
  });
  it("resolves count units only through servings", () => {
    expect(toGrams(roti, 2, "1 roti")).toBe(80);
    expect(toGrams(roti, 2, "piece")).toBe(80);
    expect(toGrams(roti, 1, "scoop")).toBeNull();
  });
  it("converts volume through density", () => {
    expect(toGrams(ghee, 1, "tbsp")).toBeCloseTo(13.65);
    expect(toGrams(milk, 1, "cup")).toBeCloseTo(247.2);
  });
  it("rejects non-positive quantity", () => {
    expect(toGrams(roti, 0, "g")).toBeNull();
  });
});

describe("toBasisAmount", () => {
  it("returns ml for per-100ml foods", () => {
    expect(toBasisAmount(milk, 1, "cup")).toBe(240);
    expect(toBasisAmount(milk, 103, "g")).toBeCloseTo(100);
  });
});

describe("unitOptions", () => {
  it("offers servings first and volume only when density or ml basis is known", () => {
    const opts = unitOptions(roti).map((o) => o.value);
    expect(opts[0]).toBe("1 roti");
    expect(opts).toContain("g");
    expect(opts).not.toContain("cup");
    expect(unitOptions(milk).map((o) => o.value)).toContain("cup");
  });
});

describe("body units", () => {
  it("round-trips kg/lb and cm/ft-in", () => {
    expect(kgToLb(lbToKg(150))).toBeCloseTo(150);
    expect(ftInToCm(5, 6)).toBeCloseTo(167.64);
    expect(cmToFtIn(167.64)).toEqual({ ft: 5, in: 6 });
  });
});
