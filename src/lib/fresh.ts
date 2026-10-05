"use client";

import { useSyncExternalStore } from "react";

/** Ids of diary entries added in this session, so their rows can briefly highlight. */
let fresh: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

export function markFresh(id: string) {
  fresh = new Set([...fresh, id]);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const EMPTY: ReadonlySet<string> = new Set();

export function useFreshIds() {
  return useSyncExternalStore(subscribe, () => fresh, () => EMPTY);
}
