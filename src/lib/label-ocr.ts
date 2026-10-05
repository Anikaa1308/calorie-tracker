/**
 * Turns OCR text from a nutrition label into a draft. Pure and conservative:
 * a value is only filled when a number sits on the same line as its nutrient
 * name. The person always checks the draft before saving.
 */
import type { NutrientKey } from "./nutrition";

export interface LabelDraft {
  values: Partial<Record<NutrientKey, number>>;
  basis: { kind: "100g" | "100ml" | "serving"; grams?: number } | null;
  /** Lines that were matched, for showing what was read. */
  matched: Partial<Record<NutrientKey, string>>;
}

const NUM = /(\d+(?:[.,]\d+)?)/g;

function numbers(line: string): number[] {
  // Drop unit markers like "(g)", "(kcal)" and percentages of daily value.
  const cleaned = line.replace(/\((?:k?cal|g|mg|kj|ml)\)/gi, " ").replace(/\d+(?:[.,]\d+)?\s*%/g, " ");
  return [...cleaned.matchAll(NUM)].map((m) => Number(m[1].replace(",", "."))).filter((n) => Number.isFinite(n));
}

function energyKcal(line: string): number | null {
  const l = line.toLowerCase();
  const kcal = l.match(/(\d+(?:[.,]\d+)?)\s*k?cal/);
  if (kcal) return Number(kcal[1].replace(",", "."));
  if (/\(k?cal\)|kcal|calories/.test(l)) {
    const n = numbers(line);
    if (n.length) return n[0];
  }
  const kj = l.match(/(\d+(?:[.,]\d+)?)\s*kj/);
  if (kj) return Math.round(Number(kj[1].replace(",", ".")) / 4.184);
  return null;
}

const RULES: { key: NutrientKey; test: RegExp; exclude?: RegExp }[] = [
  { key: "protein", test: /\bprotein/i },
  { key: "carbs", test: /carbohydrate|\bcarbs?\b/i, exclude: /of which|sugar/i },
  { key: "fat", test: /\b(total\s+)?fat\b/i, exclude: /saturated|trans|mono|poly|unsaturated/i },
  { key: "fiber", test: /fib(re|er)/i },
];

export function parseNutritionLabel(text: string): LabelDraft {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const values: LabelDraft["values"] = {};
  const matched: LabelDraft["matched"] = {};

  for (const line of lines) {
    if (values.calories == null && /energy|calories|\bkcal\b/i.test(line)) {
      const v = energyKcal(line);
      if (v != null && v < 1000) {
        values.calories = v;
        matched.calories = line;
        continue;
      }
    }
    for (const r of RULES) {
      if (values[r.key] != null || !r.test.test(line) || r.exclude?.test(line)) continue;
      const n = numbers(line);
      if (n.length && n[0] <= 100) {
        values[r.key] = n[0];
        matched[r.key] = line;
      }
    }
  }

  const all = lines.join(" ").toLowerCase();
  let basis: LabelDraft["basis"] = null;
  if (/per\s*100\s*ml/.test(all)) basis = { kind: "100ml" };
  else if (/per\s*100\s*g/.test(all)) basis = { kind: "100g" };
  else {
    const s = all.match(/per\s*serv(?:ing|e)[^0-9]{0,20}(\d+(?:\.\d+)?)\s*g/);
    if (s) basis = { kind: "serving", grams: Number(s[1]) };
  }
  return { values, basis, matched };
}
