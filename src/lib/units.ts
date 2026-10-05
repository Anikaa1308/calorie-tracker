/**
 * Units & quantities. Every conversion from "what the user typed" to the
 * amount the nutrition basis is expressed in goes through this module.
 */

export type MassUnit = "g" | "kg" | "oz" | "lb";
export type VolumeUnit = "ml" | "l" | "cup" | "tbsp" | "tsp";
/** Count units only resolve through a food's own servings. */
export type CountUnit = "piece" | "serving" | "slice" | "bowl" | "scoop" | "katori" | "glass" | "plate";
export type Unit = MassUnit | VolumeUnit | CountUnit;

export type Basis = "PER_100G" | "PER_100ML";

export const MASS_TO_G: Record<MassUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

export const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
  cup: 240,
  tbsp: 15,
  tsp: 5,
};

export const COUNT_UNITS: readonly CountUnit[] = [
  "piece",
  "serving",
  "slice",
  "bowl",
  "scoop",
  "katori",
  "glass",
  "plate",
];

export function isMassUnit(u: string): u is MassUnit {
  return u in MASS_TO_G;
}
export function isVolumeUnit(u: string): u is VolumeUnit {
  return u in VOLUME_TO_ML;
}
export function isCountUnit(u: string): u is CountUnit {
  return (COUNT_UNITS as readonly string[]).includes(u);
}

export interface ServingLike {
  /** Human label, e.g. "1 roti" or "1 scoop (30 g)". */
  label: string;
  unit: string;
  grams: number;
  isDefault?: boolean;
}

export interface UnitFood {
  basis: Basis;
  /** g per ml. Liquids default to 1 when unknown. */
  densityGPerMl?: number | null;
  servings?: ServingLike[];
}

/**
 * Parse a quantity typed by a person: "2", "1.5", "1,5", "5/6", "1 1/2", "½".
 * Returns null for anything that is not a positive finite number.
 */
export function parseQuantity(input: string | number): number | null {
  if (typeof input === "number") {
    return Number.isFinite(input) && input > 0 ? input : null;
  }
  const vulgar: Record<string, string> = {
    "¼": " 1/4",
    "½": " 1/2",
    "¾": " 3/4",
    "⅓": " 1/3",
    "⅔": " 2/3",
    "⅛": " 1/8",
  };
  let s = input.trim().replace(/[¼½¾⅓⅔⅛]/g, (c) => vulgar[c]).replace(",", ".").trim();
  if (!s) return null;
  s = s.replace(/\s+/g, " ");

  let value: number;
  const mixed = s.match(/^(\d+(?:\.\d+)?) (\d+)\/(\d+)$/);
  const frac = s.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (mixed) {
    const den = Number(mixed[3]);
    if (den === 0) return null;
    value = Number(mixed[1]) + Number(mixed[2]) / den;
  } else if (frac) {
    const den = Number(frac[2]);
    if (den === 0) return null;
    value = Number(frac[1]) / den;
  } else if (/^\d*\.?\d+$/.test(s)) {
    value = Number(s);
  } else {
    return null;
  }
  return Number.isFinite(value) && value > 0 ? value : null;
}

function density(food: UnitFood): number {
  return food.densityGPerMl && food.densityGPerMl > 0 ? food.densityGPerMl : 1;
}

/** Find the serving row that backs a count unit (or a serving label). */
export function findServing(food: UnitFood, unit: string): ServingLike | undefined {
  const servings = food.servings ?? [];
  return (
    servings.find((s) => s.label === unit) ??
    servings.find((s) => s.unit === unit && s.isDefault) ??
    servings.find((s) => s.unit === unit)
  );
}

/**
 * Convert a quantity of a unit into grams for this food.
 * Returns null when the conversion is not known (e.g. "piece" with no serving row).
 */
export function toGrams(food: UnitFood, quantity: number, unit: string): number | null {
  if (!(quantity > 0)) return null;
  if (isMassUnit(unit)) return quantity * MASS_TO_G[unit];
  if (isVolumeUnit(unit)) return quantity * VOLUME_TO_ML[unit] * density(food);
  const serving = findServing(food, unit);
  if (serving) return quantity * serving.grams;
  return null;
}

/** Amount expressed in the food's basis unit (g for PER_100G, ml for PER_100ML). */
export function toBasisAmount(food: UnitFood, quantity: number, unit: string): number | null {
  if (food.basis === "PER_100ML") {
    if (isVolumeUnit(unit)) return quantity * VOLUME_TO_ML[unit];
    const grams = toGrams(food, quantity, unit);
    return grams === null ? null : grams / density(food);
  }
  return toGrams(food, quantity, unit);
}

export interface UnitOption {
  /** Value stored with the log entry (a unit code or a serving label). */
  value: string;
  label: string;
  /** Grams in one of this unit, for display. */
  grams: number;
}

/** Units a person can pick for this food. Count units only appear when a serving backs them. */
export function unitOptions(food: UnitFood): UnitOption[] {
  const opts: UnitOption[] = [];
  for (const s of food.servings ?? []) {
    opts.push({ value: s.label, label: s.label, grams: s.grams });
  }
  opts.push({ value: "g", label: "g", grams: 1 });
  if (food.basis === "PER_100ML" || food.densityGPerMl) {
    const d = density(food);
    opts.push({ value: "ml", label: "ml", grams: d });
    opts.push({ value: "cup", label: "cup (240 ml)", grams: 240 * d });
    opts.push({ value: "tbsp", label: "tbsp", grams: 15 * d });
    opts.push({ value: "tsp", label: "tsp", grams: 5 * d });
  }
  opts.push({ value: "oz", label: "oz", grams: MASS_TO_G.oz });
  return opts;
}

// ── Body measurements ────────────────────────────────────────────────────────

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const ftInToCm = (ft: number, inches: number) => (ft * 12 + inches) * CM_PER_IN;
export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalIn = Math.round(cm / CM_PER_IN);
  return { ft: Math.floor(totalIn / 12), in: totalIn % 12 };
}
