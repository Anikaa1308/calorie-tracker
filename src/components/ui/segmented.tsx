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
      className={cn("inline-flex rounded-control border border-border bg-subtle p-0.5", className)}
    >
      {options.map((o) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          className={cn(
            "flex-1 whitespace-nowrap rounded-[6px] font-medium text-muted transition-colors data-[state=checked]:bg-surface data-[state=checked]:text-text data-[state=checked]:shadow-[0_1px_2px_rgb(0_0_0/0.06)]",
            size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
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
          className="group flex items-start gap-3 rounded-control border border-border bg-surface px-3.5 py-3 text-left transition-colors hover:border-border-strong data-[state=checked]:border-accent data-[state=checked]:bg-accent-soft/50"
        >
          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border-strong group-data-[state=checked]:border-accent">
            <RadioGroup.Indicator className="size-2 rounded-full bg-accent" />
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
