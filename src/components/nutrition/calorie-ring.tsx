import { Droplet, Drumstick, Leaf, Wheat, type LucideIcon } from "lucide-react";
import { formatKcal } from "@/lib/format";

export type RingMacro = "protein" | "carbs" | "fat" | "fiber";

const SEGMENTS: { key: RingMacro; color: string; icon: LucideIcon }[] = [
  { key: "protein", color: "var(--protein)", icon: Drumstick },
  { key: "carbs", color: "var(--carbs)", icon: Wheat },
  { key: "fat", color: "var(--fat)", icon: Droplet },
  { key: "fiber", color: "var(--fiber)", icon: Leaf },
];

/** Point on the circle, with angles measured clockwise from 12 o'clock. */
function point(c: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: c + r * Math.sin(rad), y: c - r * Math.cos(rad) };
}

/**
 * The one prominent visual on Today: what's left in big numbers, framed by four thick
 * pastel arcs, one per macro, each filling up as that macro's target is reached.
 */
export function CalorieRing({
  consumed,
  target,
  macros,
  size = 264,
  stroke = 30,
}: {
  consumed: number;
  target: number;
  macros?: Partial<Record<RingMacro, { consumed: number; target: number | null }>>;
  size?: number;
  stroke?: number;
}) {
  const badge = stroke + 6;
  const c = size / 2;
  const r = c - badge / 2 - 1;
  // Gap between arcs: room for both round caps plus some air.
  const gap = (((stroke + 14) / r) * 180) / Math.PI;
  const remaining = target - consumed;

  const arcs = SEGMENTS.map((s, i) => {
    const start = 45 + i * 90 - 90 + gap / 2;
    const end = 45 + i * 90 - gap / 2;
    const a = point(c, r, start);
    const b = point(c, r, end);
    const m = macros?.[s.key];
    const ratio = m && m.target ? m.consumed / m.target : 0;
    return { ...s, d: `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`, start: a, pct: Math.min(ratio, 1) * 100 };
  });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {arcs.map((a) => (
          <g key={a.key} fill="none" strokeWidth={stroke} strokeLinecap="round">
            <path d={a.d} stroke={a.color} style={{ opacity: "var(--ring-track-opacity)" }} />
            {a.pct > 0 ? (
              <path
                d={a.d}
                stroke={a.color}
                pathLength={100}
                strokeDasharray={`${a.pct} 100`}
                style={{ transition: "stroke-dasharray 500ms ease-out" }}
              />
            ) : null}
          </g>
        ))}
      </svg>
      {arcs.map(({ key, icon: Icon, color, start }) => (
        <span
          key={key}
          aria-hidden
          className="absolute flex items-center justify-center rounded-full text-on-pastel ring-4 ring-surface"
          style={{ width: badge, height: badge, left: start.x - badge / 2, top: start.y - badge / 2, background: color }}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="tabular text-[56px] leading-none font-bold tracking-[-0.04em]">
          {formatKcal(target > 0 ? Math.abs(remaining) : consumed)}
        </span>
        <span
          className={`mt-2 text-[13px] font-semibold ${target > 0 && remaining < 0 ? "text-over" : "text-muted"}`}
        >
          {target <= 0 ? "kcal eaten" : remaining < 0 ? "kcal over" : "kcal left"}
        </span>
      </div>
    </div>
  );
}
