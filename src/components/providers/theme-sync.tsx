"use client";

import { useEffect } from "react";
import { useProfile } from "@/lib/queries/profile";
import { applyTheme, type ThemeChoice } from "@/lib/theme";

/** Applies the theme saved on the account (e.g. after signing in on a new device). */
export function ThemeSync() {
  const { data } = useProfile();
  useEffect(() => {
    if (data?.theme) applyTheme(data.theme as ThemeChoice);
  }, [data?.theme]);
  return null;
}
