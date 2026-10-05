import type { Metadata } from "next";
import { googleEnabled } from "@/server/auth";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const next = (await searchParams).next;
  return <AuthForm mode="sign-in" next={typeof next === "string" ? next : undefined} google={googleEnabled} />;
}
