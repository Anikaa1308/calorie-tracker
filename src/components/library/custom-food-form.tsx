"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Panel, SectionLabel } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/segmented";
import { formatKcal } from "@/lib/format";
import { caloriesFromMacros, NUTRIENT_KEYS, type NutrientKey } from "@/lib/nutrition";
import type { CustomFoodInput } from "@/lib/queries/library";
import type { FoodDTO } from "@/lib/types";

type BasisMode = "100g" | "100ml" | "serving";

const LABEL: Record<NutrientKey, string> = {
  calories: "Calories (kcal)",
  protein: "Protein (g)",
  carbs: "Carbohydrates (g)",
  fat: "Fat (g)",
  fiber: "Fiber (g)",
};

const num = (s: string) => {
  const n = Number(s.replace(",", "."));
  return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};
const str = (n: number) => String(Math.round(n * 100) / 100);

export interface CustomFoodDefaults {
  name?: string;
  brand?: string;
  barcode?: string;
}

export function CustomFoodForm({
  food,
  defaults,
  onSubmit,
  submitting,
  onDelete,
}: {
  food?: FoodDTO | null;
  defaults?: CustomFoodDefaults;
  onSubmit: (input: CustomFoodInput) => void;
  submitting?: boolean;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(food?.name ?? defaults?.name ?? "");
  const [brand, setBrand] = useState(food?.brand ?? defaults?.brand ?? "");
  const [barcode, setBarcode] = useState(food?.barcode ?? defaults?.barcode ?? "");
  const [mode, setMode] = useState<BasisMode>(food?.basis === "PER_100ML" ? "100ml" : "100g");
  const [servingLabel, setServingLabel] = useState("1 serving");
  const [servingGrams, setServingGrams] = useState("");
  const [values, setValues] = useState<Record<NutrientKey, string>>(() =>
    Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, food?.per100 ? str(food.per100[k]) : ""])) as Record<NutrientKey, string>,
  );
  const [servings, setServings] = useState<{ label: string; grams: string }[]>(
    () => food?.servings.map((s) => ({ label: s.label, grams: str(s.grams) })) ?? [],
  );
  const [fromLabel, setFromLabel] = useState(food ? food.source === "PRODUCT_LABEL" : true);
  const [showErrors, setShowErrors] = useState(false);

  const parsed = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, num(values[k])])) as Record<NutrientKey, number | null>;
  const valuesPer = mode === "serving" ? num(servingGrams) : 100;
  const missing = NUTRIENT_KEYS.filter((k) => parsed[k] === null);
  const errors = {
    name: !name.trim() ? "Give the food a name." : undefined,
    nutrients: missing.length ? "Fill in every value. Use 0 if the label says 0." : undefined,
    serving: mode === "serving" && !valuesPer ? "Enter the serving size in grams." : undefined,
  };
  const valid = !errors.name && !errors.nutrients && !errors.serving;

  const fromMacros =
    parsed.protein != null && parsed.carbs != null && parsed.fat != null ? caloriesFromMacros(parsed as { protein: number; carbs: number; fat: number }) : null;
  const energyOff =
    parsed.calories != null && fromMacros != null && Math.abs(fromMacros - parsed.calories) > Math.max(20, parsed.calories * 0.15);
  const fiberOff = parsed.fiber != null && parsed.carbs != null && parsed.fiber > parsed.carbs + 0.01 && parsed.carbs > 0;

  const submit = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    const extra = servings
      .map((s) => ({ label: s.label.trim(), grams: num(s.grams) }))
      .filter((s): s is { label: string; grams: number } => !!s.label && !!s.grams && s.grams > 0);
    const allServings =
      mode === "serving" && valuesPer
        ? [{ label: servingLabel.trim() || "1 serving", grams: valuesPer }, ...extra.filter((s) => s.label !== servingLabel.trim())]
        : extra;
    onSubmit({
      name: name.trim(),
      brand: brand.trim() || null,
      basis: mode === "100ml" ? "PER_100ML" : "PER_100G",
      valuesPer: valuesPer!,
      nutrients: parsed as Record<NutrientKey, number>,
      densityGPerMl: mode === "100ml" ? 1 : null,
      servings: allServings,
      barcode: barcode.trim() || null,
      fromLabel,
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid gap-8"
    >
      <section>
        <SectionLabel>Food</SectionLabel>
        <Panel className="mt-3 grid gap-5 p-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={showErrors ? errors.name : undefined} className="sm:col-span-2">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Protein oats" aria-invalid={showErrors && !!errors.name} />
          </Field>
          <Field label="Brand (optional)" htmlFor="brand">
            <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Yoga Bar" />
          </Field>
          <Field label="Barcode (optional)" htmlFor="barcode">
            <Input id="barcode" inputMode="numeric" value={barcode} onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ""))} />
          </Field>
        </Panel>
      </section>

      <section>
        <SectionLabel>Nutrition</SectionLabel>
        <Panel className="mt-3 p-5">
          <p className="text-[13px] text-text">The label&apos;s values are per</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Segmented
              ariaLabel="Values are per"
              value={mode}
              onChange={setMode}
              options={[
                { value: "100g", label: "100 g" },
                { value: "100ml", label: "100 ml" },
                { value: "serving", label: "Serving" },
              ]}
            />
            {mode === "serving" ? (
              <div className="flex items-center gap-2">
                <Input aria-label="Serving name" value={servingLabel} onChange={(e) => setServingLabel(e.target.value)} className="w-32" />
                <span className="text-xs text-muted">of</span>
                <div className="relative w-24">
                  <Input aria-label="Serving size in grams" inputMode="decimal" value={servingGrams} onChange={(e) => setServingGrams(e.target.value)} className="pr-7" aria-invalid={showErrors && !!errors.serving} />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">g</span>
                </div>
              </div>
            ) : null}
          </div>
          {showErrors && errors.serving ? <p className="mt-1.5 text-xs text-danger">{errors.serving}</p> : null}

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {NUTRIENT_KEYS.map((k) => (
              <Field key={k} label={LABEL[k]} htmlFor={`n-${k}`}>
                <Input
                  id={`n-${k}`}
                  inputMode="decimal"
                  value={values[k]}
                  onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                  className="tabular"
                  aria-invalid={showErrors && parsed[k] === null}
                />
              </Field>
            ))}
          </div>
          <div className="mt-3 space-y-1 text-xs" aria-live="polite">
            {showErrors && errors.nutrients ? <p className="text-danger">{errors.nutrients}</p> : null}
            {energyOff && fromMacros != null ? (
              <p className="text-over">
                Check the numbers: these macros add up to about {formatKcal(fromMacros)} kcal, not {formatKcal(parsed.calories!)}.
              </p>
            ) : null}
            {fiberOff ? <p className="text-over">Fiber is usually part of total carbohydrates, so it can&apos;t be higher.</p> : null}
          </div>
          <label className="mt-5 flex items-start gap-2.5 text-[13px]">
            <input type="checkbox" checked={fromLabel} onChange={(e) => setFromLabel(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
            <span>
              Copied from the product&apos;s nutrition label
              <span className="block text-xs text-muted">Shown as “Product label” instead of “User added”.</span>
            </span>
          </label>
        </Panel>
      </section>

      <section>
        <SectionLabel>Servings</SectionLabel>
        <Panel className="mt-3 p-5">
          <p className="text-xs text-muted">Add the portions you usually eat, like “1 bowl” or “1 bar”, so logging takes one tap.</p>
          <ul className="mt-3 grid gap-2">
            {servings.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                <Input aria-label="Serving name" value={s.label} onChange={(e) => setServings((list) => list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="1 bowl" className="flex-1" />
                <div className="relative w-24">
                  <Input aria-label="Grams" inputMode="decimal" value={s.grams} onChange={(e) => setServings((list) => list.map((x, j) => (j === i ? { ...x, grams: e.target.value } : x)))} className="pr-7" />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">g</span>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Remove serving" onClick={() => setServings((list) => list.filter((_, j) => j !== i))}>
                  <X />
                </Button>
              </li>
            ))}
          </ul>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setServings((l) => [...l, { label: "", grams: "" }])}>
            <Plus />
            Add a serving
          </Button>
        </Panel>
      </section>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : food ? "Save changes" : "Add food"}
        </Button>
        {onDelete ? (
          <Button variant="danger" className="ml-auto" onClick={onDelete}>
            Delete food
          </Button>
        ) : null}
      </div>
    </form>
  );
}
