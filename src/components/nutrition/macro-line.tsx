import { formatGrams } from "@/lib/format";
import type { Nutrients } from "@/lib/nutrition";
import { cn } from "@/lib/cn";

/** "P 8 · C 43 · F 1.5" compact line for rows. */
export function MacroLine({ n, className }: { n: Nutrients; className?: string }) {
  return (
    <span className={cn("tabular text-xs text-faint", className)}>
      <abbr title="Protein" className="no-underline">P</abbr> {formatGrams(n.protein)}
      <span className="mx-1">·</span>
      <abbr title="Carbohydrates" className="no-underline">C</abbr> {formatGrams(n.carbs)}
      <span className="mx-1">·</span>
      <abbr title="Fat" className="no-underline">F</abbr> {formatGrams(n.fat)}
    </span>
  );
}
