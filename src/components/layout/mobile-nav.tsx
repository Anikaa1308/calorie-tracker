"use client";

import { CalendarDays, ChartLine, Plus, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAddFood } from "@/components/food-search/add-food-provider";
import { cn } from "@/lib/cn";

const LEFT = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/search", label: "Search", icon: Search },
];
const RIGHT = [
  { href: "/history", label: "History", icon: ChartLine },
  { href: "/profile", label: "Profile", icon: User },
];

function Item({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof User; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium transition-colors",
        active ? "text-text" : "text-faint",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
          active && "bg-butter text-on-pastel",
        )}
      >
        <Icon className="size-[18px]" strokeWidth={active ? 2 : 1.6} />
      </span>
      {label}
    </Link>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { openAddFood } = useAddFood();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-bg/95 backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {LEFT.map((i) => (
          <Item key={i.href} {...i} active={isActive(i.href)} />
        ))}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={() => openAddFood()}
            aria-label="Add food"
            className="flex h-11 w-14 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-float transition-transform active:scale-95"
          >
            <Plus className="size-5" strokeWidth={2.25} />
          </button>
        </div>
        {RIGHT.map((i) => (
          <Item key={i.href} {...i} active={isActive(i.href)} />
        ))}
      </div>
    </nav>
  );
}
