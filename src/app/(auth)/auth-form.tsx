"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { googleAction, signInAction, signUpAction, type AuthState } from "./actions";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

export function AuthForm({ mode, next, google }: { mode: "sign-in" | "sign-up"; next?: string; google: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "sign-in" ? signInAction : signUpAction,
    {},
  );
  const isIn = mode === "sign-in";
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 pt-16 pb-10 sm:pt-24">
      <Logo />
      <div className="mt-8 w-full max-w-sm rounded-panel border border-border bg-surface p-6">
        <h1 className="text-lg font-bold tracking-tight">{isIn ? "Sign in" : "Create your account"}</h1>
        <p className="mt-1 text-[13px] text-muted">{isIn ? "Welcome back." : "Free, and your data stays yours."}</p>

        {google ? (
          <>
            <form action={googleAction} className="mt-5">
              <input type="hidden" name="next" value={next ?? ""} />
              <Button type="submit" variant="secondary" className="w-full">
                <GoogleIcon />
                Continue with Google
              </Button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs text-faint">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        ) : (
          <div className="h-5" />
        )}

        <form action={action} className="grid gap-4">
          <input type="hidden" name="next" value={next ?? ""} />
          {!isIn ? (
            <Field label="Name (optional)" htmlFor="name">
              <Input id="name" name="name" autoComplete="name" defaultValue={state.fields?.name} />
            </Field>
          ) : null}
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.fields?.email} />
          </Field>
          <Field label="Password" htmlFor="password" hint={!isIn ? "At least 8 characters." : undefined}>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isIn ? "current-password" : "new-password"}
              required
              minLength={isIn ? undefined : 8}
            />
          </Field>
          {state.error ? (
            <p role="alert" className="text-[13px] text-danger">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="mt-1 w-full">
            {pending ? "One moment…" : isIn ? "Sign in" : "Create account"}
          </Button>
        </form>
      </div>
      <p className="mt-6 text-[13px] text-muted">
        {isIn ? "New to Plate? " : "Already have an account? "}
        <Link href={isIn ? "/sign-up" : "/sign-in"} className="font-medium text-accent hover:underline">
          {isIn ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
