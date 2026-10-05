import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

const SAMPLE = [
  { label: "Protein", value: 82, target: 100, color: "var(--protein)" },
  { label: "Carbs", value: 143, target: 175, color: "var(--carbs)" },
  { label: "Fat", value: 42, target: 55, color: "var(--fat)" },
  { label: "Fiber", value: 21, target: 28, color: "var(--fiber)" },
];

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
          <h1 className="text-[40px] leading-[1.1] font-semibold tracking-tight text-text sm:text-[48px]">
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
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
              Targets estimated with Mifflin–St Jeor, explained step by step and always yours to edit.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
              Every food shows its source: USDA, Open Food Facts, the product label or your own entry.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
              Servings that make sense: 1 roti, 1 katori dal, 1 scoop, 5/6 of a cup.
            </li>
          </ul>
        </section>

        <section aria-label="Example day" className="rounded-panel border border-border bg-surface p-6">
          <p className="label-caps">Tuesday, October 6</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="tabular text-[40px] leading-none font-semibold tracking-tight">1,247</span>
            <span className="text-muted">/ 1,600 kcal</span>
          </div>
          <p className="mt-1 text-[13px] text-accent">353 kcal left</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-accent" style={{ width: "78%" }} />
          </div>
          <dl className="mt-6 grid gap-4">
            {SAMPLE.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-[13px]">
                  <dt className="text-muted">{m.label}</dt>
                  <dd className="tabular">
                    <span className="font-medium text-text">{m.value}</span>
                    <span className="text-faint"> / {m.target} g</span>
                  </dd>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(m.value / m.target) * 100}%`, background: m.color }}
                  />
                </div>
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
