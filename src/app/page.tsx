import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { CalorieRing } from "@/components/nutrition/calorie-ring";

const SAMPLE = [
  { key: "protein", label: "Protein", value: 82, target: 100, color: "var(--protein)" },
  { key: "carbs", label: "Carbs", value: 143, target: 175, color: "var(--carbs)" },
  { key: "fat", label: "Fat", value: 42, target: 55, color: "var(--fat)" },
  { key: "fiber", label: "Fiber", value: 21, target: 28, color: "var(--fiber)" },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto grid max-w-5xl gap-12 px-4 pt-10 pb-20 sm:px-6 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-20">
        <section>
          <h1 className="text-[40px] leading-[1.1] font-bold tracking-tight text-text sm:text-[48px]">
            Know what you eat.
          </h1>
          <p className="mt-4 max-w-md text-base text-muted">
            Log roti, dal, paneer and poha as easily as oats and Greek yogurt. Plate shows where every number comes
            from and keeps the day in one calm view.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">Set up my targets</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/today">I have an account</Link>
            </Button>
          </div>
          <ul className="mt-10 grid max-w-md gap-3 text-[13px] text-muted">
            <li className="flex gap-2">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-butter" />
              Targets estimated with Mifflin–St Jeor, explained step by step and always yours to edit.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-butter" />
              Every food shows its source: USDA, Open Food Facts, the product label or your own entry.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-butter" />
              Servings that make sense: 1 roti, 1 katori dal, 1 scoop, 5/6 of a cup.
            </li>
          </ul>
        </section>

        <section aria-label="Example day" className="rounded-panel border border-border/70 bg-surface p-6">
          <p className="label-caps text-center">Tuesday, October 6</p>
          <div className="mt-5 flex justify-center">
            <CalorieRing
              consumed={1247}
              target={1600}
              macros={Object.fromEntries(SAMPLE.map((m) => [m.key, { consumed: m.value, target: m.target }]))}
              size={248}
            />
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-2">
            {SAMPLE.map((m) => (
              <div key={m.label} className="rounded-[18px] px-3.5 py-2.5 text-on-pastel" style={{ background: m.color }}>
                <dt className="text-xs font-medium opacity-75">{m.label}</dt>
                <dd className="tabular text-base font-bold">
                  {m.value}
                  <span className="font-medium opacity-60"> / {m.target} g</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-faint sm:px-6">
        Targets are estimates for general wellness, not medical advice.
      </footer>
    </div>
  );
}
