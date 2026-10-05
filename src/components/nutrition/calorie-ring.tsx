import { formatKcal } from "@/lib/format";

/** The one prominent visual on Today: a thin ring with what's left in the middle. */
export function CalorieRing({
  consumed,
  target,
  size = 148,
  stroke = 9,
}: {
  consumed: number;
  target: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = target > 0 ? consumed / target : 0;
  const over = ratio > 1.05;
  const shown = Math.min(ratio, 1);
  const remaining = target - consumed;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "var(--over)" : "var(--accent)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
          style={{ transition: "stroke-dashoffset 400ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="tabular text-[28px] leading-none font-semibold tracking-tight">
          {formatKcal(Math.abs(remaining))}
        </span>
        <span className={`mt-1 text-xs ${target > 0 && remaining < 0 ? "text-over" : "text-muted"}`}>
          {target <= 0 ? "kcal eaten" : remaining < 0 ? "kcal over" : "kcal left"}
        </span>
      </div>
    </div>
  );
}
