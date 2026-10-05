import { formatNutrient, NUTRIENT_LABEL, NUTRIENT_UNIT } from "@/lib/format";
import { NUTRIENT_KEYS, type Nutrients } from "@/lib/nutrition";

export function NutritionTable({
  columns,
}: {
  columns: { label: string; values: Nutrients }[];
}) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="text-left text-xs text-faint">
          <th className="py-1.5 font-normal">Nutrient</th>
          {columns.map((c) => (
            <th key={c.label} className="py-1.5 text-right font-normal">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="tabular">
        {NUTRIENT_KEYS.map((k) => (
          <tr key={k} className="border-t border-border">
            <td className="py-2 text-muted">{NUTRIENT_LABEL[k]}</td>
            {columns.map((c) => (
              <td key={c.label} className="py-2 text-right">
                {formatNutrient(k, c.values[k])} <span className="text-faint">{NUTRIENT_UNIT[k]}</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
