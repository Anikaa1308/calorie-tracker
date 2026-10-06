import { cn } from "@/lib/cn";
import type { ConfidenceCode, FoodSourceCode } from "@/lib/types";

export const SOURCE_LABEL: Record<FoodSourceCode, string> = {
  USDA: "USDA",
  OPEN_FOOD_FACTS: "Open Food Facts",
  IFCT: "IFCT 2017",
  PRODUCT_LABEL: "Product label",
  USER: "User added",
  ESTIMATED: "Estimate",
  SAMPLE: "Sample data",
};

const SOURCE_HINT: Record<FoodSourceCode, string> = {
  USDA: "USDA FoodData Central reference values.",
  OPEN_FOOD_FACTS: "From Open Food Facts, a community database of product labels. Check the pack if it matters.",
  IFCT: "Indian Food Composition Tables (NIN, 2017).",
  PRODUCT_LABEL: "Taken from the product's nutrition label.",
  USER: "Entered by someone using Plate.",
  ESTIMATED: "Typical values for a home-style recipe. Your version may differ.",
  SAMPLE: "Sample values that haven't been checked against the pack. Use the label for accuracy.",
};

export function sourceHint(source: FoodSourceCode) {
  return SOURCE_HINT[source];
}

/** Small, quiet provenance label. Uncertain sources get a dotted underline and amber tint. */
export function SourceBadge({
  source,
  confidence,
  className,
  withPrefix,
}: {
  source: FoodSourceCode;
  confidence?: ConfidenceCode;
  className?: string;
  withPrefix?: boolean;
}) {
  const uncertain = source === "SAMPLE" || source === "ESTIMATED" || confidence === "LOW";
  return (
    <span
      title={SOURCE_HINT[source]}
      className={cn(
        "inline-flex items-center gap-1 text-[11px] leading-none whitespace-nowrap",
        uncertain ? "text-over" : "text-faint",
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", uncertain ? "bg-over" : "bg-accent")}
        aria-hidden
      />
      {withPrefix ? "Nutrition data: " : ""}
      {SOURCE_LABEL[source]}
    </span>
  );
}
