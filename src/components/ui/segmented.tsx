"use client";

import { RadioGroup } from "radix-ui";
import { cn } from "@/lib/cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

/** Compact inline choice (units, ranges). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  ariaLabel: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(v) => onChange(v as T)}
      aria-label={ariaLabel}
      orientation="horizontal"
      className={cn("inline-flex rounded-full bg-pill p-1", className)}
    >
      {options.map((o) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          className={cn(
            "flex-1 whitespace-nowrap rounded-full font-semibold text-muted transition-colors data-[state=checked]:bg-accent data-[state=checked]:text-accent-contrast",
            size === "sm" ? "h-7 px-3 text-xs" : "h-8 px-3.5 text-[13px]",
          )}
        >
          {o.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}

/** Larger stacked choice with a hint line (onboarding). */
export function ChoiceList<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  columns = 1,
}: {
  value: T | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  ariaLabel: string;
  columns?: 1 | 2;
}) {
  return (
    <RadioGroup.Root
      value={value ?? ""}
      onValueChange={(v) => onChange(v as T)}
      aria-label={ariaLabel}
      className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2")}
    >
      {options.map((o) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          className="group flex items-start gap-3 rounded-[20px] border-[1.5px] border-border bg-surface px-4 py-3.5 text-left transition-colors hover:border-border-strong data-[state=checked]:border-butter data-[state=checked]:bg-accent-soft/60"
        >
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-border-strong group-data-[state=checked]:border-solid group-data-[state=checked]:border-text">
            <RadioGroup.Indicator className="size-2.5 rounded-full bg-accent" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-medium text-text">{o.label}</span>
            {o.hint ? <span className="text-xs text-muted">{o.hint}</span> : null}
          </span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
