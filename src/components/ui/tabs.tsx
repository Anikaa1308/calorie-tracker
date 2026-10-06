"use client";

import { Tabs as T } from "radix-ui";
import { cn } from "@/lib/cn";

export const Tabs = T.Root;
export const TabsContent = T.Content;

export function TabsList({ className, ...props }: React.ComponentProps<typeof T.List>) {
  return (
    <T.List
      className={cn("flex gap-1.5 overflow-x-auto [scrollbar-width:none]", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "h-9 shrink-0 rounded-full bg-pill px-4 text-[13px] font-semibold text-muted transition-colors hover:text-text data-[state=active]:bg-accent data-[state=active]:text-accent-contrast",
        className,
      )}
      {...props}
    />
  );
}
