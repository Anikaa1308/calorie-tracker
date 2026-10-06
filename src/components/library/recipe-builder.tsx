"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { SearchPanel } from "@/components/food-search/search-panel";
import { defaultQuantity } from "@/components/food-search/quantity-picker";
import { MacroLine } from "@/components/nutrition/macro-line";
import { MACRO_COLOR } from "@/components/nutrition/macro-bar";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { EmptyState, Panel, SectionLabel } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { formatGrams, formatKcal, formatQuantity } from "@/lib/format";
import { calculateNutrition } from "@/lib/nutrition";
import type { RecipeDetail, RecipeInput } from "@/lib/queries/library";
import { computeRecipe } from "@/lib/recipes";
import type { FoodDTO } from "@/lib/types";
import { parseQuantity, unitOptions } from "@/lib/units";

interface Row {
  key: string;
  food: FoodDTO;
  text: string;
  unit: string;
}

let seq = 0;
const nextKey = () => `r${++seq}`;

export function RecipeBuilder({
  recipe,
  onSubmit,
  submitting,
  onDelete,
  onLog,
}: {
  recipe?: RecipeDetail | null;
  onSubmit: (input: RecipeInput) => void;
  submitting?: boolean;
  onDelete?: () => void;
  onLog?: () => void;
}) {
  const [name, setName] = useState(recipe?.name ?? "");
  const [servings, setServings] = useState(recipe ? formatQuantity(recipe.servings) : "4");
  const [cooked, setCooked] = useState(recipe?.cookedWeightG ? String(recipe.cookedWeightG) : "");
  const [notes, setNotes] = useState(recipe?.notes ?? "");
  const [rows, setRows] = useState<Row[]>(
    () =>
      recipe?.ingredients
        .filter((i) => i.food)
        .map((i) => ({ key: nextKey(), food: i.food!, text: formatQuantity(i.quantity), unit: i.unit })) ?? [],
  );
  const [picking, setPicking] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const servingsN = parseQuantity(servings);
  const cookedN = cooked.trim() ? parseQuantity(cooked) : null;
  const usable = rows
    .map((r) => ({ r, q: parseQuantity(r.text) }))
    .filter((x): x is { r: Row; q: number } => !!x.q && !!x.r.food.per100);
  const totals = computeRecipe(
    usable.map(({ r, q }) => ({ food: { ...r.food, per100: r.food.per100! }, quantity: q, unit: r.unit })),
    servingsN ?? 1,
    cookedN,
  );

  const errors = {
    name: !name.trim() ? "Give the recipe a name." : undefined,
    servings: !servingsN ? "Enter how many servings it makes." : undefined,
    rows: !rows.length ? "Add at least one ingredient." : usable.length !== rows.length ? "Check the amounts." : undefined,
  };
  const valid = !errors.name && !errors.servings && !errors.rows;

  const submit = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    onSubmit({
      name: name.trim(),
      servings: servingsN!,
      cookedWeightG: cookedN,
      notes: notes.trim() || null,
      ingredients: usable.map(({ r, q }) => ({ foodId: r.food.id, quantity: q, unit: r.unit })),
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
        <Panel className="grid gap-5 p-5 sm:grid-cols-[1fr_auto_auto]">
          <Field label="Recipe name" htmlFor="rname" error={showErrors ? errors.name : undefined}>
            <Input id="rname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mom's rajma" />
          </Field>
          <Field label="Servings" htmlFor="rserv" error={showErrors ? errors.servings : undefined}>
            <Input id="rserv" inputMode="decimal" value={servings} onChange={(e) => setServings(e.target.value)} className="w-24" />
          </Field>
          <Field label="Cooked weight" htmlFor="rcook" hint="Optional">
            <div className="relative w-28">
              <Input id="rcook" inputMode="decimal" value={cooked} onChange={(e) => setCooked(e.target.value)} className="pr-7" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">g</span>
            </div>
          </Field>
        </Panel>
        <p className="mt-2 text-xs text-muted">
          Weigh the finished dish to log it by the gram later. Water lost or added while cooking changes weight, not calories.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <SectionLabel>Ingredients</SectionLabel>
          <Button variant="ghost" size="sm" onClick={() => setPicking(true)}>
            <Plus />
            Add ingredient
          </Button>
        </div>
        <Panel className="mt-3">
          {rows.length ? (
            <ul className="divide-y divide-border">
              {rows.map((row) => {
                const q = parseQuantity(row.text);
                const r = q && row.food.per100 ? calculateNutrition({ ...row.food, per100: row.food.per100 }, q, row.unit) : null;
                return (
                  <li key={row.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[1fr_auto_auto_auto]">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{row.food.name}</p>
                      <p className="truncate text-xs text-muted">{row.food.brand ?? row.food.category}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${row.food.name}`}
                      onClick={() => setRows((l) => l.filter((x) => x.key !== row.key))}
                      className="sm:order-last"
                    >
                      <X />
                    </Button>
                    <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                      <Input
                        aria-label={`Amount of ${row.food.name}`}
                        inputMode="decimal"
                        value={row.text}
                        onChange={(e) => setRows((l) => l.map((x) => (x.key === row.key ? { ...x, text: e.target.value } : x)))}
                        className="tabular h-9 w-20"
                        aria-invalid={!q}
                      />
                      <NativeSelect
                        aria-label={`Unit for ${row.food.name}`}
                        value={row.unit}
                        onChange={(e) => setRows((l) => l.map((x) => (x.key === row.key ? { ...x, unit: e.target.value } : x)))}
                        className="h-9 w-40"
                      >
                        {unitOptions(row.food).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                    <p className="tabular col-span-2 text-xs text-muted sm:col-span-1 sm:w-20 sm:text-right sm:text-sm sm:text-text">
                      {r ? `${formatKcal(r.nutrients.calories)} kcal` : "—"}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title="No ingredients yet"
              body="Add everything that goes in, including oil, ghee and sugar. They add up."
              action={
                <Button variant="secondary" size="sm" onClick={() => setPicking(true)}>
                  Add ingredient
                </Button>
              }
            />
          )}
        </Panel>
        {showErrors && errors.rows ? <p className="mt-2 text-xs text-danger">{errors.rows}</p> : null}
      </section>

      <section>
        <SectionLabel>Per serving</SectionLabel>
        <Panel className="mt-3 p-5" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p>
              <span className="tabular text-[28px] font-bold tracking-tight">{formatKcal(totals.perServing.calories)}</span>{" "}
              <span className="text-muted">kcal</span>
            </p>
            <p className="tabular text-xs text-muted">
              {Math.round(totals.servingGrams)} g per serving · {formatKcal(totals.total.calories)} kcal in total
            </p>
          </div>
          <dl className="mt-4 grid grid-cols-4 gap-2">
            {(["protein", "carbs", "fat", "fiber"] as const).map((k) => (
              <div key={k}>
                <dt className="flex items-center gap-1 text-xs text-muted">
                  <span className="size-1.5 rounded-full" style={{ background: MACRO_COLOR[k] }} />
                  {k[0].toUpperCase() + k.slice(1)}
                </dt>
                <dd className="tabular mt-0.5 text-sm font-medium">{formatGrams(totals.perServing[k])} g</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-faint">
            Per 100 g: {formatKcal(totals.per100g.calories)} kcal · <MacroLine n={totals.per100g} />
          </p>
        </Panel>
      </section>

      <Field label="Notes (optional)" htmlFor="rnotes">
        <Textarea id="rnotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : recipe ? "Save recipe" : "Create recipe"}
        </Button>
        {onLog ? (
          <Button variant="secondary" onClick={onLog}>
            Log a serving
          </Button>
        ) : null}
        {onDelete ? (
          <Button variant="danger" className="ml-auto" onClick={onDelete}>
            Delete
          </Button>
        ) : null}
      </div>

      <Sheet open={picking} onOpenChange={setPicking} title="Add ingredient">
        <SearchPanel
          onPick={(food) => {
            if (food.id.startsWith("ext:")) return;
            const q = defaultQuantity({ ...food, last: null });
            setRows((l) => [...l, { key: nextKey(), food, text: q.text, unit: q.unit }]);
            setPicking(false);
          }}
        />
      </Sheet>
    </form>
  );
}
