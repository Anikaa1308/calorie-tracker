"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { hashPassword, signIn } from "@/server/auth";
import { db } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { HttpError } from "@/server/http";
import { headers } from "next/headers";

export interface AuthState {
  error?: string;
  fields?: { email?: string; name?: string };
}

/** Only allow redirects back into the app. */
function safeNext(v: FormDataEntryValue | null, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function signInAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  try {
    await signIn("credentials", {
      email,
      password: String(form.get("password") ?? ""),
      redirectTo: safeNext(form.get("next"), "/today"),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      const rateLimited = e.type === "CredentialsSignin" && (e as { code?: string }).code === "rate_limited";
      return {
        error: rateLimited ? "Too many attempts. Try again in a few minutes." : "That email and password don't match.",
        fields: { email },
      };
    }
    throw e; // redirect
  }
  return {};
}

const signUpSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
});

export async function signUpAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const raw = { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") };
  const parsed = signUpSchema.safeParse(raw);
  const fields = { email: raw.email, name: raw.name };
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };
  try {
    rateLimit(`signup:${await ip()}`, 10, 60 * 60_000);
  } catch (e) {
    if (e instanceof HttpError) return { error: e.message, fields };
    throw e;
  }
  const { email, password, name } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists. Sign in instead.", fields };
  await db.user.create({ data: { email, name: name || null, passwordHash: await hashPassword(password) } });
  try {
    await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Your account was created, but signing in failed. Try signing in.", fields };
    throw e;
  }
  return {};
}

export async function googleAction(form: FormData) {
  await signIn("google", { redirectTo: safeNext(form.get("next"), "/today") });
}
