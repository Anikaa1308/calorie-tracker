import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 text-text", className)} aria-label="Plate home">
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <circle cx="12" cy="12" r="10.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 1.75a10.25 10.25 0 0 1 9.4 6.15" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".35" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">Plate</span>
    </Link>
  );
}
