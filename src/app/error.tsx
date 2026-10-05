"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-1 max-w-sm text-[13px] text-muted">
        Your diary is safe. Try again, and if it keeps happening, reload the page.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
