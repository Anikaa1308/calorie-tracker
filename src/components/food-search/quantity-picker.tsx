"use client";

import { useId } from "react";
import { Input, NativeSelect } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { formatQuantity } from "@/lib/format";
import { parseQuantity, unitOptions, type UnitFood } from "@/lib/units";

export interface QuantityState {
  text: string;
  unit: string;
}

export function defaultQuantity(food: UnitFood & { last?: { quantity: number; unit: string } | null }): QuantityState {
  const opts = unitOptions(food);
  if (food.last && opts.some((o) => o.value === food.last!.unit)) {
    return { text: formatQuantity(food.last.quantity), unit: food.last.unit };
  }
  const serving = food.servings?.find((s) => s.isDefault) ?? food.servings?.[0];
  if (serving) return { text: "1", unit: serving.label };
  return { text: "100", unit: "g" };
}

const QUICK = ["½", "1", "1½", "2"];

export function QuantityPicker({
  food,
  value,
  onChange,
  autoFocus,
}: {
  food: UnitFood;
  value: QuantityState;
  onChange: (v: QuantityState) => void;
  autoFocus?: boolean;
}) {
  const id = useId();
  const opts = unitOptions(food);
  const parsed = parseQuantity(value.text);
  const invalid = value.text.trim() !== "" && parsed === null;
  const isCount = !["g", "kg", "oz", "lb", "ml", "l"].includes(value.unit);

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-2">
        <div>
          <label htmlFor={`${id}-q`} className="mb-1.5 block text-xs text-muted">
            Amount
          </label>
          <Input
            id={`${id}-q`}
            inputMode="decimal"
            autoComplete="off"
            autoFocus={autoFocus}
            value={value.text}
            aria-invalid={invalid}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            onFocus={(e) => e.currentTarget.select()}
            className="tabular text-base"
            placeholder="1"
          />
        </div>
        <div>
          <label htmlFor={`${id}-u`} className="mb-1.5 block text-xs text-muted">
            Unit
          </label>
          <NativeSelect
            id={`${id}-u`}
            value={value.unit}
            onChange={(e) => onChange({ ...value, unit: e.target.value })}
            className="text-base sm:text-sm"
          >
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
                {o.value !== "g" && o.grams > 0 && !o.label.includes(" g)") ? ` · ${formatQuantity(o.grams)} g` : ""}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      {invalid ? (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          Enter a number like 2, 1.5 or 1/2.
        </p>
      ) : null}
      {isCount ? (
        <div className="mt-2 flex gap-1.5" role="group" aria-label="Quick amounts">
          {QUICK.map((q) => {
            const active = parseQuantity(q) === parsed;
            return (
              <button
                key={q}
                type="button"
                onClick={() => onChange({ ...value, text: q })}
                className={cn(
                  "tabular h-7 min-w-10 rounded-full border px-2.5 text-xs transition-colors",
                  active
                    ? "border-accent bg-accent-soft text-text"
                    : "border-border text-muted hover:border-border-strong hover:text-text",
                )}
              >
                {q}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
