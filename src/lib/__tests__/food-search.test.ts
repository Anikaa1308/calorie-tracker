import { describe, expect, it } from "vitest";
import { looksBranded, rankFoods } from "../food-search";

const foods = [
  { id: "1", name: "Paneer", category: "Dairy", popularity: 80 },
  { id: "2", name: "Paneer tikka", category: "Indian dishes", popularity: 40 },
  { id: "3", name: "Malai Paneer", brand: "Amul", category: "Dairy", popularity: 50 },
  { id: "4", name: "High Protein Chocolate Oats", brand: "Yoga Bar", category: "Cereals", popularity: 30 },
  { id: "5", name: "Rolled oats", category: "Cereals", popularity: 70 },
  { id: "6", name: "Roti", aliases: ["chapati", "phulka"], category: "Breads", popularity: 90 },
  { id: "7", name: "Banana chips", category: "Snacks", popularity: 10 },
  { id: "8", name: "Banana", category: "Fruits", popularity: 60 },
];
const ids = (q: string, h?: Map<string, { timesLogged: number; lastUsedAt: Date }>) =>
  rankFoods(q, foods, h).map((f) => f.id);

describe("rankFoods", () => {
  it("puts the exact name first", () => {
    expect(ids("paneer")[0]).toBe("1");
    expect(ids("banana")[0]).toBe("8");
  });
  it("matches brand + product", () => {
    expect(ids("amul paneer")[0]).toBe("3");
    expect(ids("yoga bar protein oats")[0]).toBe("4");
  });
  it("matches aliases", () => {
    expect(ids("chapati")[0]).toBe("6");
  });
  it("is case and accent insensitive", () => {
    expect(ids("PANEER")[0]).toBe("1");
  });
  it("drops non-matches", () => {
    expect(ids("tofu")).toEqual([]);
  });
  it("boosts the person's frequent foods within the same tier", () => {
    const now = new Date();
    const h = new Map([["5", { timesLogged: 20, lastUsedAt: now }]]);
    expect(ids("oats", h)[0]).toBe("5");
  });
});

describe("looksBranded", () => {
  it("detects brands and pack sizes", () => {
    expect(looksBranded("amul taaza 500ml", [])).toBe(true);
    expect(looksBranded("yoga bar oats", ["Yoga Bar"])).toBe(true);
    expect(looksBranded("banana", ["Amul"])).toBe(false);
  });
});
