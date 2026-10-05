/**
 * Pure normalisers from provider payloads to Plate's per-100 shape. No I/O,
 * so they're unit-tested against fixtures. A product missing any core
 * nutrient (energy, protein, carbs, fat) gets `per100: null` and can't be
 * logged until someone fills it in from the label.
 */
import type { FoodDTO } from "@/lib/types";

const n = (v: unknown): number | null => {
  const x = typeof v === "string" ? Number(v) : v;
  return typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : null;
};
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

// ── Open Food Facts ─────────────────────────────────────────────────────────

export interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string;
  categories?: string;
  quantity?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  product_quantity_unit?: string;
  nutriments?: Record<string, number | string | undefined>;
}

export function normalizeOff(p: OffProduct): FoodDTO | null {
  const code = p.code?.trim();
  const name = (p.product_name || p.product_name_en || p.generic_name || "").trim();
  if (!code || !name) return null;
  const nm = p.nutriments ?? {};
  const kcal = n(nm["energy-kcal_100g"]) ?? (n(nm["energy_100g"]) != null ? n(nm["energy_100g"])! / 4.184 : null);
  const protein = n(nm["proteins_100g"]);
  const carbs = n(nm["carbohydrates_100g"]);
  const fat = n(nm["fat_100g"]);
  const fiber = n(nm["fiber_100g"]);
  const complete = kcal != null && protein != null && carbs != null && fat != null;
  const liquid = p.product_quantity_unit === "ml" || /\bml\b/i.test(p.quantity ?? "");
  const servingG = n(p.serving_quantity);
  const brand = p.brands?.split(",")[0]?.trim() || null;
  const notes = ["From Open Food Facts, a community database of product labels."];
  if (complete && fiber == null) notes.push("Fiber isn't listed, so it's counted as 0.");
  return {
    id: `ext:off:${code}`,
    name,
    brand,
    category: p.categories?.split(",").pop()?.trim() || null,
    kind: "BRANDED",
    basis: liquid ? "PER_100ML" : "PER_100G",
    densityGPerMl: liquid ? 1 : null,
    source: "OPEN_FOOD_FACTS",
    confidence: "MEDIUM",
    sourceNote: notes.join(" "),
    barcode: /^\d{6,14}$/.test(code) ? code : null,
    per100: complete
      ? { calories: round(kcal!, 1), protein: round(protein!), carbs: round(carbs!), fat: round(fat!), fiber: round(fiber ?? 0) }
      : null,
    servings:
      servingG && servingG > 0 && servingG < 5000
        ? [{ label: p.serving_size ? `1 serving (${p.serving_size})` : `1 serving (${servingG} g)`, unit: "serving", grams: servingG, isDefault: true }]
        : [],
  };
}

// ── USDA FoodData Central ───────────────────────────────────────────────────

/** Search results list nutrients flat; the detail endpoint nests them. Both are handled. */
export interface UsdaNutrient {
  nutrientId?: number;
  nutrientNumber?: string;
  unitName?: string;
  value?: number;
  amount?: number;
  nutrient?: { id?: number; number?: string; unitName?: string };
}

export interface UsdaFood {
  fdcId: number;
  description: string;
  dataType?: string;
  brandOwner?: string;
  brandName?: string;
  foodCategory?: string | { description?: string };
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  gtinUpc?: string;
  foodNutrients?: UsdaNutrient[];
}

const USDA_IDS = {
  // Energy (kcal), then Atwater general/specific energy used by Foundation foods.
  calories: [1008, 2047, 2048],
  protein: [1003],
  carbs: [1005],
  fat: [1004],
  fiber: [1079],
} as const;

function usdaValue(list: UsdaNutrient[], ids: readonly number[]): number | null {
  for (const id of ids) {
    const hit = list.find((x) => (x.nutrientId ?? x.nutrient?.id) === id);
    const unit = (hit?.unitName ?? hit?.nutrient?.unitName ?? "").toUpperCase();
    if (hit && unit !== "KJ") {
      const v = n(hit.value ?? hit.amount);
      if (v != null) return v;
    }
  }
  return null;
}

function titleCase(s: string) {
  // USDA descriptions are often UPPERCASE for branded items.
  return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s,(])\p{L}/gu, (m) => m.toUpperCase()) : s;
}

export function normalizeUsda(f: UsdaFood): FoodDTO {
  const list = f.foodNutrients ?? [];
  const kcal = usdaValue(list, USDA_IDS.calories);
  const protein = usdaValue(list, USDA_IDS.protein);
  const carbs = usdaValue(list, USDA_IDS.carbs);
  const fat = usdaValue(list, USDA_IDS.fat);
  const fiber = usdaValue(list, USDA_IDS.fiber);
  const complete = kcal != null && protein != null && carbs != null && fat != null;
  const branded = f.dataType === "Branded";
  const unit = f.servingSizeUnit?.toLowerCase();
  const servingG = f.servingSize && (unit === "g" || unit === "grm" || unit === "ml" || unit === "mlt") ? f.servingSize : null;
  const category = typeof f.foodCategory === "string" ? f.foodCategory : (f.foodCategory?.description ?? null);
  return {
    id: `ext:usda:${f.fdcId}`,
    name: titleCase(f.description),
    brand: branded ? titleCase(f.brandName || f.brandOwner || "") || null : null,
    category,
    kind: branded ? "BRANDED" : "GENERIC",
    basis: "PER_100G",
    densityGPerMl: null,
    source: "USDA",
    confidence: branded ? "MEDIUM" : "HIGH",
    sourceNote: `USDA FoodData Central (${f.dataType ?? "food"} #${f.fdcId}).${complete && fiber == null ? " Fiber isn't listed, so it's counted as 0." : ""}`,
    barcode: f.gtinUpc && /^\d{6,14}$/.test(f.gtinUpc) ? f.gtinUpc : null,
    per100: complete
      ? { calories: round(kcal!, 1), protein: round(protein!), carbs: round(carbs!), fat: round(fat!), fiber: round(fiber ?? 0) }
      : null,
    servings: servingG
      ? [
          {
            label: f.householdServingFullText ? `${f.householdServingFullText} (${servingG} g)` : `1 serving (${servingG} g)`,
            unit: "serving",
            grams: servingG,
            isDefault: true,
          },
        ]
      : [],
  };
}

/** "ext:off:8901063092471" → { provider: "off", externalId: "8901063092471" } */
export function parseExternalId(id: string): { provider: "off" | "usda"; externalId: string } | null {
  const m = id.match(/^ext:(off|usda):([\w-]{1,40})$/);
  return m ? { provider: m[1] as "off" | "usda", externalId: m[2] } : null;
}
