"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MACRO_COLOR } from "@/components/nutrition/macro-bar";
import { macroCalorieGap, rebalance, type TargetKey, type Targets } from "@/lib/goals";
import { formatKcal, NUTRIENT_LABEL } from "@/lib/format";
import { cn } from "@/lib/cn";

const KEYS: TargetKey[] = ["calories", "protein", "carbs", "fat", "fiber"];

interface Pending {
  key: TargetKey;
  value: number;
}

/**
 * Edit Goals: Recommended next to Your target. Changing calories or a macro
 * asks whether to rebalance the others or keep them. Nothing is overwritten silently.
 */
export function GoalEditor({
  current,
  recommended,
  onSave,
  saving,
}: {
  current: Targets;
  recommended: Targets | null;
  onSave: (t: Targets) => void;
  saving?: boolean;
}) {
  const [targets, setTargets] = useState<Targets>(current);
  const [texts, setTexts] = useState<Record<TargetKey, string>>(
    () => Object.fromEntries(KEYS.map((k) => [k, String(current[k])])) as Record<TargetKey, string>,
  );
  const [pending, setPending] = useState<Pending | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const syncTexts = (t: Targets) =>
    setTexts(Object.fromEntries(KEYS.map((k) => [k, String(t[k])])) as Record<TargetKey, string>);

  const commit = (key: TargetKey) => {
    const n = Math.round(Number(texts[key]));
    if (!Number.isFinite(n) || n < 0 || texts[key].trim() === "") {
      setTexts((t) => ({ ...t, [key]: String(targets[key]) }));
      return;
    }
    if (n === targets[key]) return;
    if (key === "fiber") {
      setTargets((t) => ({ ...t, fiber: n }));
      return;
    }
    setPending({ key, value: n });
  };

  const apply = (mode: "rebalance" | "keep") => {
    if (!pending) return;
    if (mode === "rebalance") {
      const r = rebalance(targets, pending.key, pending.value);
      setTargets(r.targets);
      syncTexts(r.targets);
      setWarning(r.warning ?? null);
    } else {
      const t = { ...targets, [pending.key]: pending.value };
      setTargets(t);
      syncTexts(t);
      setWarning(null);
    }
    setPending(null);
  };

  const cancelPending = () => {
    if (pending) setTexts((t) => ({ ...t, [pending.key]: String(targets[pending.key]) }));
    setPending(null);
  };

  const gap = macroCalorieGap(targets);
  const dirty = KEYS.some((k) => targets[k] !== current[k]);
  const differsFromRec = recommended && KEYS.some((k) => targets[k] !== recommended[k]);

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center text-[13px]">
        <span className="pb-1.5 text-xs text-faint">Target</span>
        <span className="w-24 pr-4 pb-1.5 text-right text-xs text-faint">Recommended</span>
        <span className="w-28 pb-1.5 text-xs text-faint">Your target</span>
        {KEYS.map((k) => {
          const unit = k === "calories" ? "kcal" : "g";
          const changed = recommended && targets[k] !== recommended[k];
          return (
            <div key={k} className="contents">
              <label htmlFor={`goal-${k}`} className="flex h-full items-center gap-2 border-t border-border py-2.5 text-text">
                {k !== "calories" ? (
                  <span className="size-2 rounded-full" style={{ background: MACRO_COLOR[k] }} aria-hidden />
                ) : null}
                {NUTRIENT_LABEL[k]}
              </label>
              <span className="tabular flex h-full w-24 items-center justify-end border-t border-border py-2.5 pr-4 text-muted">
                {recommended ? `${k === "calories" ? formatKcal(recommended[k]) : recommended[k]} ${unit}` : "—"}
              </span>
              <div className="relative w-28 border-t border-border py-1.5">
                <Input
                  id={`goal-${k}`}
                  inputMode="numeric"
                  value={texts[k]}
                  disabled={!!pending && pending.key !== k}
                  onChange={(e) => setTexts((t) => ({ ...t, [k]: e.target.value.replace(/[^\d]/g, "") }))}
                  onBlur={() => commit(k)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commit(k))}
                  className={cn("tabular h-9 pr-10", changed && "border-accent/50")}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">{unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {pending ? (
        <div role="alertdialog" aria-label="Adjust other targets?" className="mt-4 rounded-panel border border-accent/40 bg-accent-soft/60 p-4">
          <p className="text-[13px] font-medium">
            {NUTRIENT_LABEL[pending.key]} → {pending.value} {pending.key === "calories" ? "kcal" : "g"}. What about the others?
          </p>
          <p className="mt-1 text-xs text-muted">
            {pending.key === "calories"
              ? "Rebalancing keeps your protein and fat share, and moves carbs to match."
              : pending.key === "carbs"
                ? "Rebalancing keeps calories and protein, and adjusts fat."
                : "Rebalancing keeps calories and adjusts carbs."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => apply("rebalance")}>
              Automatically rebalance remaining macros
            </Button>
            <Button size="sm" variant="secondary" onClick={() => apply("keep")}>
              Keep my other targets unchanged
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-1 text-xs" aria-live="polite">
        {warning ? <p className="text-over">{warning}</p> : null}
        {Math.abs(gap) > 10 ? (
          <p className="text-over">
            Your macros add up to {formatKcal(targets.calories + gap)} kcal, {formatKcal(Math.abs(gap))} kcal{" "}
            {gap > 0 ? "more" : "less"} than your calorie target.
          </p>
        ) : (
          <p className="text-faint">Protein × 4 + carbs × 4 + fat × 9 matches your calorie target.</p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button onClick={() => onSave(targets)} disabled={!dirty || !!pending || saving}>
          {saving ? "Saving…" : "Save targets"}
        </Button>
        {recommended && differsFromRec ? (
          <Button
            variant="ghost"
            onClick={() => {
              setTargets(recommended);
              syncTexts(recommended);
              setWarning(null);
            }}
          >
            <RotateCcw />
            Use recommended
          </Button>
        ) : null}
      </div>
    </div>
  );
}
