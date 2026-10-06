"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { PageColumn, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, SectionLabel, Skeleton } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/segmented";
import { Modal } from "@/components/ui/sheet";
import { api } from "@/lib/queries/fetcher";
import { useProfile, useSavePreferences } from "@/lib/queries/profile";
import { applyTheme, type ThemeChoice } from "@/lib/theme";
import { signOutAction } from "./actions";

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-text">{label}</p>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const { data: profile, isLoading } = useProfile();
  const prefs = useSavePreferences();
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (isLoading || !profile) {
    return (
      <PageColumn>
        <PageHeader title="Settings" />
        <Skeleton className="h-80 w-full rounded-panel" />
      </PageColumn>
    );
  }

  return (
    <PageColumn>
      <PageHeader title="Settings" />
      <div className="grid gap-8">
        <section>
          <SectionLabel>Account</SectionLabel>
          <Panel className="mt-3 p-5">
            <Row label={profile.name || "Your account"} hint={profile.email ?? undefined}>
              <form action={signOutAction}>
                <Button type="submit" variant="secondary" size="sm">
                  Sign out
                </Button>
              </form>
            </Row>
          </Panel>
        </section>

        <section>
          <SectionLabel>Units &amp; appearance</SectionLabel>
          <Panel className="mt-3 p-5">
            <Row label="Weight">
              <Segmented
                ariaLabel="Weight unit"
                value={profile.weightUnit}
                onChange={(v) => prefs.mutate({ weightUnit: v })}
                options={[
                  { value: "KG", label: "kg" },
                  { value: "LB", label: "lb" },
                ]}
              />
            </Row>
            <Row label="Height">
              <Segmented
                ariaLabel="Height unit"
                value={profile.heightUnit}
                onChange={(v) => prefs.mutate({ heightUnit: v })}
                options={[
                  { value: "CM", label: "cm" },
                  { value: "FT_IN", label: "ft / in" },
                ]}
              />
            </Row>
            <Row label="Theme" hint="System follows your device's light or dark setting.">
              <Segmented<ThemeChoice>
                ariaLabel="Theme"
                value={(profile.theme as ThemeChoice) ?? "system"}
                onChange={(v) => {
                  applyTheme(v);
                  prefs.mutate({ theme: v });
                }}
                options={[
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            </Row>
          </Panel>
        </section>

        <section>
          <SectionLabel>Your data</SectionLabel>
          <Panel className="mt-3 p-5">
            <Row label="Export diary" hint="Every logged item as a spreadsheet (CSV).">
              <Button asChild variant="secondary" size="sm">
                <a href="/api/export?format=csv" download>
                  <Download />
                  CSV
                </a>
              </Button>
            </Row>
            <Row label="Export everything" hint="Profile, targets, diary, weights, foods and recipes (JSON).">
              <Button asChild variant="secondary" size="sm">
                <a href="/api/export?format=json" download>
                  <Download />
                  JSON
                </a>
              </Button>
            </Row>
            <Row label="Delete account" hint="Permanently removes your account and all your data.">
              <Button variant="danger" size="sm" onClick={() => setDeleting(true)}>
                Delete account
              </Button>
            </Row>
          </Panel>
        </section>
        <p className="text-xs text-faint">
          Nutrition targets in Plate are estimates for general wellness, not medical advice.
        </p>
      </div>

      <Modal
        open={deleting}
        onOpenChange={(o) => {
          setDeleting(o);
          setConfirm("");
          setDeleteError(null);
        }}
        title="Delete your account?"
        description="This permanently deletes your diary, targets, weights, foods and recipes. It can't be undone. Foods you added to the shared list stay for others, without your name. Export first if you want a copy."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api("/api/account", { method: "DELETE", json: { confirm } });
              await signOutAction();
            } catch (err) {
              setDeleteError((err as Error).message);
            }
          }}
          className="grid gap-3"
        >
          <label className="text-[13px] text-muted" htmlFor="confirm-delete">
            Type <span className="font-mono text-text">delete</span> to confirm.
          </label>
          <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
          {deleteError ? <p className="text-xs text-danger">{deleteError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={confirm !== "delete"}>
              Delete account
            </Button>
          </div>
        </form>
      </Modal>
    </PageColumn>
  );
}
