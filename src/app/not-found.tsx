import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <h1 className="mt-8 text-lg font-semibold">This page isn&apos;t on the menu</h1>
      <p className="mt-1 text-[13px] text-muted">The link may be old, or the page has moved.</p>
      <Button asChild className="mt-6">
        <Link href="/today">Go to today</Link>
      </Button>
    </div>
  );
}
