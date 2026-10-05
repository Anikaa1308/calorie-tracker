"use client";

import Link from "next/link";
import { useState } from "react";
import { BodyFields, draftFromProfile, parseBody, type BodyDraft } from "@/components/goals/body-fields";
import { GoalEditor } from "@/components/goals/goal-editor";
import { TargetsExplainer } from "@/components/goals/targets-explainer";
import { PageColumn, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect } from "@/components/ui/input";
import { EmptyState, Panel, SectionLabel, Skeleton } from "@/components/ui/misc";
import { ACTIVITY_LABEL, calculateTargets, GOAL_LABEL, RATE_LABEL, type ActivityLevel, type Goal, type Rate } from "@/lib/goals";
import { kgToLb } from "@/lib/units";
import { useCurrentGoal, useProfile, useSaveGoals, useSaveProfile } from "@/lib/queries/profile";
import type { ProfileDTO } from "@/lib/types";

function fmtWeight(kg: number | null, unit: "KG" | "LB") {
  if (kg == null) return "—";
  return unit === "LB" ? `${Math.round(kgToLb(kg))} lb` : `${Math.round(kg * 10) / 10} kg`;
}
function fmtHeight(cm: number | null, unit: "CM" | "FT_IN") {
  if (cm == null) return "—";
  if (unit === "CM") return `${Math.round(cm)} cm`;
  const total = Math.round(cm / 2.54);
  return `${Math.floor(total / 12)}′ ${total % 12}″`;
}

export function ProfileView() {
  const { data: profile, isLoading } = useProfile();
  const { data: goal } = useCurrentGoal();
  const saveGoals = useSaveGoals();

  if (isLoading || !profile) {
    return (
      <PageColumn>
        <PageHeader title="Profile" />
        <Skeleton className="h-64 w-full rounded-panel" />
      </PageColumn>
    );
  }

  if (!profile.onboarded) {
    return (
      <PageColumn>
        <PageHeader title="Profile" />
        <Panel>
          <EmptyState
            title="Set up your targets"
            body="Answer four quick questions and Plate will estimate your daily calories and macros."
            action={
              <Button asChild>
                <Link href="/onboarding">Get started</Link>
              </Button>
            }
          />
        </Panel>
      </PageColumn>
    );
  }

  const body = {
    sex: profile.sex!,
    age: profile.age!,
    heightCm: profile.heightCm!,
    weightKg: profile.weightKg!,
    activity: profile.activityLevel!,
    goal: profile.goal!,
    rate: profile.rate ?? undefined,
  };
  const rec = calculateTargets(body);
  const recommended = { calories: rec.calories, protein: rec.protein, carbs: rec.carbs, fat: rec.fat, fiber: rec.fiber };

  return (
    <PageColumn>
      <PageHeader title="Profile" description={profile.email && profile.email !== "demo@plate.local" ? profile.email : undefined} />
      <div className="grid gap-8">
        <section>
          <SectionLabel>Daily targets</SectionLabel>
          <Panel className="mt-3 p-5">
            {goal ? (
              <GoalEditor
                key={`${goal.effectiveFrom}-${goal.calories}-${goal.protein}-${goal.carbs}-${goal.fat}-${goal.fiber}`}
                current={goal}
                recommended={recommended}
                saving={saveGoals.isPending}
                onSave={(t) => saveGoals.mutate(t)}
              />
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
            {goal?.isCustom ? (
              <p className="mt-4 text-xs text-muted">You&apos;re using your own targets. Recommendations are shown for reference.</p>
            ) : null}
          </Panel>
        </section>

        <BodySection profile={profile} customTargets={!!goal?.isCustom} />

        <section>
          <SectionLabel>How your targets are calculated</SectionLabel>
          <Panel className="mt-3 px-5 py-3">
            <TargetsExplainer input={body} result={rec} />
          </Panel>
          <p className="mt-3 text-xs text-muted">
            Estimates for general wellness, not medical advice. Bodies differ: if your weight trend over 2 to 3 weeks
            doesn&apos;t match your goal, adjust calories by 100 to 200 kcal.
          </p>
        </section>
      </div>
    </PageColumn>
  );
}

function BodySection({ profile, customTargets }: { profile: ProfileDTO; customTargets: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BodyDraft>(() => draftFromProfile(profile));
  const [activity, setActivity] = useState<ActivityLevel>(profile.activityLevel!);
  const [goal, setGoal] = useState<Goal>(profile.goal!);
  const [rate, setRate] = useState<Rate>(profile.rate ?? "MODERATE");
  const [confirm, setConfirm] = useState(false);
  const save = useSaveProfile();
  const parsed = parseBody(draft);

  const submit = (applyRecommendation: boolean) => {
    save.mutate(
      { ...parsed.value, activityLevel: activity, goal, rate: goal === "LOSE" ? rate : null, applyRecommendation },
      {
        onSuccess: () => {
          setEditing(false);
          setConfirm(false);
        },
      },
    );
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <SectionLabel>Body &amp; goal</SectionLabel>
        {!editing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft(draftFromProfile(profile));
              setEditing(true);
            }}
          >
            Edit
          </Button>
        ) : null}
      </div>
      <Panel className="mt-3 p-5">
        {!editing ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px] sm:grid-cols-3">
            {[
              ["Sex", profile.sex === "MALE" ? "Male" : "Female"],
              ["Age", `${profile.age}`],
              ["Height", fmtHeight(profile.heightCm, profile.heightUnit)],
              ["Weight", fmtWeight(profile.weightKg, profile.weightUnit)],
              ["Activity", ACTIVITY_LABEL[profile.activityLevel!].label],
              [
                "Goal",
                `${GOAL_LABEL[profile.goal!].label}${profile.goal === "LOSE" && profile.rate ? ` · ${RATE_LABEL[profile.rate].label.toLowerCase()}` : ""}`,
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-0.5 text-text">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!parsed.valid) return;
              if (customTargets) setConfirm(true);
              else submit(true);
            }}
          >
            <BodyFields draft={draft} onChange={setDraft} showErrors />
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Activity" htmlFor="activity">
                <NativeSelect id="activity" value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)}>
                  {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((k) => (
                    <option key={k} value={k}>
                      {ACTIVITY_LABEL[k].label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Goal" htmlFor="goal">
                <NativeSelect id="goal" value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
                  {(Object.keys(GOAL_LABEL) as Goal[]).map((k) => (
                    <option key={k} value={k}>
                      {GOAL_LABEL[k].label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              {goal === "LOSE" ? (
                <Field label="Pace" htmlFor="rate">
                  <NativeSelect id="rate" value={rate} onChange={(e) => setRate(e.target.value as Rate)}>
                    {(Object.keys(RATE_LABEL) as Rate[]).map((k) => (
                      <option key={k} value={k}>
                        {RATE_LABEL[k].label} · {RATE_LABEL[k].hint}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              ) : null}
            </div>
            {confirm ? (
              <div className="mt-5 rounded-panel border border-accent/40 bg-accent-soft/60 p-4">
                <p className="text-[13px] font-medium">You have custom targets. Update them to the new recommendation?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => submit(true)} disabled={save.isPending}>
                    Use new recommendation
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => submit(false)} disabled={save.isPending}>
                    Keep my targets
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex gap-2">
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save"}
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </form>
        )}
      </Panel>
    </section>
  );
}
