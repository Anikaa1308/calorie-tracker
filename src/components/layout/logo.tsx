import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 text-text", className)} aria-label="Plate home">
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden fill="none" strokeWidth="4" strokeLinecap="round">
        <path d="M4.6 8.2A8.5 8.5 0 0 1 8.2 4.6" stroke="var(--sage)" />
        <path d="M15.8 4.6a8.5 8.5 0 0 1 3.6 3.6" stroke="var(--butter)" />
        <path d="M19.4 15.8a8.5 8.5 0 0 1-3.6 3.6" stroke="var(--pink)" />
        <path d="M8.2 19.4a8.5 8.5 0 0 1-3.6-3.6" stroke="var(--periwinkle)" />
        <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
      </svg>
      <span className="text-[15px] font-bold tracking-tight">Plate</span>
    </Link>
  );
}
