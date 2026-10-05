"use client";

import { Tabs as T } from "radix-ui";
import { cn } from "@/lib/cn";

export const Tabs = T.Root;
export const TabsContent = T.Content;

export function TabsList({ className, ...props }: React.ComponentProps<typeof T.List>) {
  return (
    <T.List
      className={cn("flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "-mb-px shrink-0 border-b-2 border-transparent px-2.5 pt-1 pb-2.5 text-[13px] font-medium text-muted transition-colors hover:text-text data-[state=active]:border-text data-[state=active]:text-text",
        className,
      )}
      {...props}
    />
  );
}
