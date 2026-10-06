import { describe, expect, it } from "vitest";
import { addedByLabel, visibleFoodWhere } from "../food-sharing";

describe("visibleFoodWhere", () => {
  it("shows catalogue foods, your own foods and recipes, and everyone's added foods", () => {
    expect(visibleFoodWhere("u1")).toEqual({ OR: [{ ownerId: null }, { ownerId: "u1" }, { kind: "USER" }] });
  });
});

describe("addedByLabel", () => {
  it("is null for catalogue foods and recipes", () => {
    expect(addedByLabel({ kind: "GENERIC", ownerId: null }, "u1")).toBeNull();
    expect(addedByLabel({ kind: "RECIPE", ownerId: "u1" }, "u1")).toBeNull();
  });

  it("says you for your own foods", () => {
    expect(addedByLabel({ kind: "USER", ownerId: "u1", owner: { name: "Anika" } }, "u1")).toBe("you");
  });

  it("names whoever added it, or falls back when they have no name", () => {
    expect(addedByLabel({ kind: "USER", ownerId: "u2", owner: { name: " Priya " } }, "u1")).toBe("Priya");
    expect(addedByLabel({ kind: "USER", ownerId: "u2", owner: { name: null } }, "u1")).toBe("another member");
    expect(addedByLabel({ kind: "USER", ownerId: null, owner: null }, "u1")).toBe("another member");
  });
});
