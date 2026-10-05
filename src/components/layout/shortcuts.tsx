"use client";

import { useEffect } from "react";
import { useAddFood } from "@/components/food-search/add-food-provider";

/** "A" opens add food anywhere in the app (when not typing). */
export function KeyboardShortcuts() {
  const { openAddFood } = useAddFood();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (document.querySelector("[role=dialog]")) return;
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        openAddFood();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openAddFood]);
  return null;
}
