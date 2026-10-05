"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAddFood } from "@/components/food-search/add-food-provider";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { NAV } from "./nav-items";

export function AppSidebar({ footer }: { footer?: React.ReactNode }) {
  const pathname = usePathname();
  const { openAddFood } = useAddFood();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-bg px-3 py-5 lg:flex">
      <div className="px-2">
        <Logo href="/today" />
      </div>
      <Button className="mt-6 justify-start" onClick={() => openAddFood()}>
        <Plus />
        Add food
        <span className="ml-auto opacity-70">
          <Kbd>A</Kbd>
        </span>
      </Button>
      <nav className="mt-6 flex flex-col gap-0.5" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors",
                active ? "bg-subtle font-medium text-text" : "text-muted hover:bg-subtle hover:text-text",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-2">{footer}</div>
    </aside>
  );
}
