"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BodyFields, draftFromProfile, parseBody, type BodyDraft } from "@/components/goals/body-fields";
import { TargetsExplainer } from "@/components/goals/targets-explainer";
import { Logo } from "@/components/layout/logo";
import { MACRO_COLOR } from "@/components/nutrition/macro-bar";
import { Button } from "@/components/ui/button";
import { ChoiceList } from "@/components/ui/segmented";
import {
  ACTIVITY_LABEL,
  calculateTargets,
  GOAL_LABEL,
  RATE_LABEL,
  type ActivityLevel,
  type Goal,
  type Rate,
} from "@/lib/goals";
import { formatKcal } from "@/lib/format";
import { useProfile, useSaveProfile } from "@/lib/queries/profile";

const STEPS = ["About you", "Activity", "Goal", "Your targets"] as const;

export function OnboardingFlow() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  if (isLoading) return null;
  return <Flow key={profile?.onboarded ? "edit" : "new"} profile={profile} onDone={() => router.push("/today")} />;
}

function Flow({ profile, onDone }: { profile: ReturnType<typeof useProfile>["data"]; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [body, setBody] = useState<BodyDraft>(() => draftFromProfile(profile));
  const [activity, setActivity] = useState<ActivityLevel | undefined>(profile?.activityLevel ?? undefined);
  const [goal, setGoal] = useState<Goal | undefined>(profile?.goal ?? undefined);
  const [rate, setRate] = useState<Rate>(profile?.rate ?? "MODERATE");
  const [showErrors, setShowErrors] = useState(false);
  const save = useSaveProfile();

  const parsed = parseBody(body);
  const input =
    parsed.valid && activity && goal
      ? {
          sex: parsed.value.sex,
          age: parsed.value.age,
          heightCm: parsed.value.heightCm,
          weightKg: parsed.value.weightKg,
          activity,
          goal,
          rate: goal === "LOSE" ? rate : undefined,
        }
      : null;
  const result = input ? calculateTargets(input) : null;

  const canNext = step === 0 ? parsed.valid : step === 1 ? !!activity : step === 2 ? !!goal : true;
  const next = () => {
    if (!canNext) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const finish = () => {
    if (!input) return;
    save.mutate(
      {
        ...parsed.value,
        activityLevel: input.activity,
        goal: input.goal,
        rate: input.rate ?? null,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo href="/today" />
        <span className="tabular text-xs text-muted">
          Step {step + 1} of {STEPS.length}
        </span>
      </header>
      <div className="mx-auto max-w-xl px-4 pb-16 sm:px-6">
        <div className="flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-track"}`} />
          ))}
        </div>

        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (step < STEPS.length - 1) next();
            else finish();
          }}
        >
          {step === 0 ? (
            <section>
              <h1 className="text-[24px] font-bold tracking-tight">About you</h1>
              <p className="mt-1 text-[13px] text-muted">These four numbers estimate how much energy your body uses.</p>
              <div className="mt-6">
                <BodyFields draft={body} onChange={setBody} showErrors={showErrors} />
              </div>
            </section>
          ) : step === 1 ? (
            <section>
              <h1 className="text-[24px] font-bold tracking-tight">How active are you?</h1>
              <p className="mt-1 text-[13px] text-muted">Think of a typical week, including work and exercise.</p>
              <div className="mt-6">
                <ChoiceList
                  ariaLabel="Activity level"
                  value={activity}
                  onChange={setActivity}
                  options={(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((k) => ({ value: k, ...ACTIVITY_LABEL[k] }))}
                />
                {showErrors && !activity ? <p className="mt-2 text-xs text-danger">Choose one.</p> : null}
              </div>
            </section>
          ) : step === 2 ? (
            <section>
              <h1 className="text-[24px] font-bold tracking-tight">What&apos;s your goal?</h1>
              <div className="mt-6">
                <ChoiceList
                  ariaLabel="Goal"
                  value={goal}
                  onChange={setGoal}
                  columns={2}
                  options={(Object.keys(GOAL_LABEL) as Goal[]).map((k) => ({ value: k, ...GOAL_LABEL[k] }))}
                />
                {showErrors && !goal ? <p className="mt-2 text-xs text-danger">Choose one.</p> : null}
              </div>
              {goal === "LOSE" ? (
                <div className="mt-8">
                  <h2 className="text-sm font-semibold">How quickly?</h2>
                  <p className="mt-0.5 text-xs text-muted">Slower is easier to sustain and protects muscle.</p>
                  <div className="mt-3">
                    <ChoiceList
                      ariaLabel="Rate"
                      value={rate}
                      onChange={setRate}
                      options={(Object.keys(RATE_LABEL) as Rate[]).map((k) => ({ value: k, ...RATE_LABEL[k] }))}
                    />
                  </div>
                </div>
              ) : null}
            </section>
          ) : input && result ? (
            <section>
              <h1 className="text-[24px] font-bold tracking-tight">Your daily targets</h1>
              <p className="mt-1 text-[13px] text-muted">
                An estimate to start from. You can change any of these later.
              </p>
              <div className="mt-6 rounded-panel border border-border bg-surface p-5">
                <p className="tabular text-[40px] leading-none font-bold tracking-tight">
                  {formatKcal(result.calories)} <span className="text-base font-normal text-muted">kcal a day</span>
                </p>
                <dl className="mt-5 grid grid-cols-4 gap-2">
                  {(["protein", "carbs", "fat", "fiber"] as const).map((k) => (
                    <div key={k} className="rounded-[18px] px-2.5 py-2.5 text-on-pastel" style={{ background: MACRO_COLOR[k] }}>
                      <dt className="text-xs font-medium opacity-75">{k[0].toUpperCase() + k.slice(1)}</dt>
                      <dd className="tabular mt-0.5 text-lg font-bold">{result[k]} g</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <details className="group mt-4 rounded-panel border border-border bg-surface" open>
                <summary className="cursor-pointer list-none px-5 py-3.5 text-[13px] font-medium">How we got here</summary>
                <div className="px-5 pb-4">
                  <TargetsExplainer input={input} result={result} />
                </div>
              </details>
              <p className="mt-4 text-xs text-muted">
                These are estimates for general wellness, not a medical prescription. If you&apos;re pregnant, managing a
                health condition, or have a history of disordered eating, check with a doctor or dietitian.
              </p>
            </section>
          ) : null}

          <div className="mt-10 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="dashed" size="icon" onClick={() => setStep((s) => s - 1)} aria-label="Back">
                <ArrowLeft />
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" size="lg" disabled={save.isPending}>
              {step < STEPS.length - 1 ? "Continue" : save.isPending ? "Saving…" : "Use these targets"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
