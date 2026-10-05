"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * A sheet: bottom sheet on phones, right-hand panel on larger screens.
 * Used for add-food, food detail and edit flows.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  hideTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
  hideTitle?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-fade-in fixed inset-0 z-40 bg-black/25 dark:bg-black/50" />
        <Dialog.Content
          aria-describedby={description ? undefined : undefined}
          className={cn(
            "animate-sheet-in fixed z-50 flex flex-col bg-surface shadow-float focus:outline-none",
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-panel border-t border-border",
            "sm:inset-y-3 sm:right-3 sm:left-auto sm:bottom-3 sm:max-h-none sm:rounded-panel sm:border",
            size === "lg" ? "sm:w-[560px]" : "sm:w-[460px]",
          )}
        >
          <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border-strong sm:hidden" aria-hidden />
          <div className={cn("flex items-start justify-between gap-4 px-5 pt-3 pb-3 sm:pt-5", hideTitle && "sr-only")}>
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-text">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-[13px] text-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="-mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-control text-muted hover:bg-subtle hover:text-text"
              aria-label="Close"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          {footer ? <div className="pb-safe border-t border-border px-5 py-3">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Small centred dialog for short forms. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-fade-in fixed inset-0 z-40 bg-black/25 dark:bg-black/50" />
        <Dialog.Content className="animate-sheet-in fixed top-1/2 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-panel border border-border bg-surface p-5 shadow-float focus:outline-none">
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Description className={description ? "mt-1 text-[13px] text-muted" : "sr-only"}>
            {description ?? title}
          </Dialog.Description>
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
