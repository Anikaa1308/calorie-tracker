import { cn } from "@/lib/cn";

/** Thin horizontal progress bar. Over-target shows a marker at 100 % instead of alarm colours. */
export function ProgressBar({
  value,
  max,
  color = "var(--accent)",
  label,
  valueText,
  className,
  height = 6,
}: {
  value: number;
  max: number;
  color?: string;
  label: string;
  valueText: string;
  className?: string;
  height?: number;
}) {
  const ratio = max > 0 ? value / max : 0;
  const over = ratio > 1.05;
  const width = Math.min(ratio, 1) * 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      aria-valuetext={valueText}
      className={cn("relative w-full overflow-hidden rounded-full bg-track", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${width}%`, background: over ? "var(--over)" : color }}
      />
    </div>
  );
}
