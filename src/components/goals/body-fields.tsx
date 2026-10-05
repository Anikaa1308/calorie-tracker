"use client";

import { Field, Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from "@/lib/units";

export interface BodyDraft {
  sex?: "MALE" | "FEMALE";
  age: string;
  heightUnit: "CM" | "FT_IN";
  heightCm: string;
  heightFt: string;
  heightIn: string;
  weightUnit: "KG" | "LB";
  weight: string;
  goalWeight: string;
}

const num = (s: string) => {
  const n = Number(s.replace(",", "."));
  return s.trim() && Number.isFinite(n) ? n : null;
};

export function draftFromProfile(p?: {
  sex: "MALE" | "FEMALE" | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goalWeightKg: number | null;
  weightUnit: "KG" | "LB";
  heightUnit: "CM" | "FT_IN";
}): BodyDraft {
  const ftIn = p?.heightCm ? cmToFtIn(p.heightCm) : null;
  const toUnit = (kg: number | null) =>
    kg == null ? "" : String(Math.round((p?.weightUnit === "LB" ? kgToLb(kg) : kg) * 10) / 10);
  return {
    sex: p?.sex ?? undefined,
    age: p?.age ? String(p.age) : "",
    heightUnit: p?.heightUnit ?? "CM",
    heightCm: p?.heightCm ? String(Math.round(p.heightCm)) : "",
    heightFt: ftIn ? String(ftIn.ft) : "",
    heightIn: ftIn ? String(ftIn.in) : "",
    weightUnit: p?.weightUnit ?? "KG",
    weight: toUnit(p?.weightKg ?? null),
    goalWeight: toUnit(p?.goalWeightKg ?? null),
  };
}

export function parseBody(d: BodyDraft) {
  const age = num(d.age);
  const heightCm =
    d.heightUnit === "CM"
      ? num(d.heightCm)
      : num(d.heightFt) != null
        ? ftInToCm(num(d.heightFt)!, num(d.heightIn) ?? 0)
        : null;
  const w = num(d.weight);
  const gw = num(d.goalWeight);
  const weightKg = w == null ? null : d.weightUnit === "LB" ? lbToKg(w) : w;
  const goalWeightKg = gw == null ? null : d.weightUnit === "LB" ? lbToKg(gw) : gw;
  const errors: Partial<Record<"sex" | "age" | "height" | "weight", string>> = {};
  if (!d.sex) errors.sex = "Choose one.";
  if (age == null || age < 13 || age > 100 || !Number.isInteger(age)) errors.age = "Enter an age from 13 to 100.";
  if (heightCm == null || heightCm < 100 || heightCm > 250) errors.height = "Enter a height between 100 and 250 cm (3′4″–8′2″).";
  if (weightKg == null || weightKg < 30 || weightKg > 300) errors.weight = "Enter a weight between 30 and 300 kg (66–660 lb).";
  return {
    errors,
    valid: Object.keys(errors).length === 0,
    value: {
      sex: d.sex!,
      age: age!,
      heightCm: heightCm ? Math.round(heightCm * 10) / 10 : 0,
      weightKg: weightKg ? Math.round(weightKg * 10) / 10 : 0,
      goalWeightKg: goalWeightKg ? Math.round(goalWeightKg * 10) / 10 : null,
      weightUnit: d.weightUnit,
      heightUnit: d.heightUnit,
    },
  };
}

export function BodyFields({
  draft,
  onChange,
  showErrors,
  showGoalWeight,
}: {
  draft: BodyDraft;
  onChange: (d: BodyDraft) => void;
  showErrors?: boolean;
  showGoalWeight?: boolean;
}) {
  const { errors } = parseBody(draft);
  const set = (patch: Partial<BodyDraft>) => onChange({ ...draft, ...patch });
  const err = (k: keyof typeof errors) => (showErrors ? errors[k] : undefined);

  const switchWeightUnit = (u: "KG" | "LB") => {
    if (u === draft.weightUnit) return;
    const conv = (s: string) => {
      const n = num(s);
      if (n == null) return s;
      return String(Math.round((u === "LB" ? kgToLb(n) : lbToKg(n)) * 10) / 10);
    };
    set({ weightUnit: u, weight: conv(draft.weight), goalWeight: conv(draft.goalWeight) });
  };
  const switchHeightUnit = (u: "CM" | "FT_IN") => {
    if (u === draft.heightUnit) return;
    if (u === "FT_IN") {
      const cm = num(draft.heightCm);
      const f = cm ? cmToFtIn(cm) : null;
      set({ heightUnit: u, heightFt: f ? String(f.ft) : "", heightIn: f ? String(f.in) : "" });
    } else {
      const ft = num(draft.heightFt);
      set({ heightUnit: u, heightCm: ft != null ? String(Math.round(ftInToCm(ft, num(draft.heightIn) ?? 0))) : "" });
    }
  };

  return (
    <div className="grid gap-5">
      <Field label="Sex" error={err("sex")} hint="Used by the BMR equation, which differs for male and female bodies.">
        <Segmented
          ariaLabel="Sex"
          value={draft.sex ?? ("" as "MALE")}
          onChange={(v) => set({ sex: v })}
          options={[
            { value: "FEMALE", label: "Female" },
            { value: "MALE", label: "Male" },
          ]}
          className="w-full sm:w-64"
        />
      </Field>
      <Field label="Age" htmlFor="age" error={err("age")}>
        <Input
          id="age"
          inputMode="numeric"
          value={draft.age}
          onChange={(e) => set({ age: e.target.value.replace(/\D/g, "") })}
          className="w-28"
          placeholder="28"
          aria-invalid={!!err("age")}
        />
      </Field>
      <Field label="Height" htmlFor="height" error={err("height")}>
        <div className="flex flex-wrap items-center gap-2">
          {draft.heightUnit === "CM" ? (
            <div className="relative w-28">
              <Input
                id="height"
                inputMode="decimal"
                value={draft.heightCm}
                onChange={(e) => set({ heightCm: e.target.value })}
                placeholder="165"
                className="pr-9"
                aria-invalid={!!err("height")}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">cm</span>
            </div>
          ) : (
            <>
              <div className="relative w-20">
                <Input id="height" inputMode="numeric" value={draft.heightFt} onChange={(e) => set({ heightFt: e.target.value })} placeholder="5" className="pr-7" aria-label="Feet" aria-invalid={!!err("height")} />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">ft</span>
              </div>
              <div className="relative w-20">
                <Input inputMode="numeric" value={draft.heightIn} onChange={(e) => set({ heightIn: e.target.value })} placeholder="5" className="pr-7" aria-label="Inches" />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">in</span>
              </div>
            </>
          )}
          <Segmented
            size="sm"
            ariaLabel="Height unit"
            value={draft.heightUnit}
            onChange={switchHeightUnit}
            options={[
              { value: "CM", label: "cm" },
              { value: "FT_IN", label: "ft / in" },
            ]}
          />
        </div>
      </Field>
      <Field label="Weight" htmlFor="weight" error={err("weight")}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-28">
            <Input id="weight" inputMode="decimal" value={draft.weight} onChange={(e) => set({ weight: e.target.value })} placeholder={draft.weightUnit === "KG" ? "62" : "137"} className="pr-9" aria-invalid={!!err("weight")} />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">{draft.weightUnit === "KG" ? "kg" : "lb"}</span>
          </div>
          <Segmented
            size="sm"
            ariaLabel="Weight unit"
            value={draft.weightUnit}
            onChange={switchWeightUnit}
            options={[
              { value: "KG", label: "kg" },
              { value: "LB", label: "lb" },
            ]}
          />
        </div>
      </Field>
      {showGoalWeight ? (
        <Field label="Goal weight (optional)" htmlFor="goal-weight">
          <div className="relative w-28">
            <Input id="goal-weight" inputMode="decimal" value={draft.goalWeight} onChange={(e) => set({ goalWeight: e.target.value })} className="pr-9" />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">{draft.weightUnit === "KG" ? "kg" : "lb"}</span>
          </div>
        </Field>
      ) : null}
    </div>
  );
}
