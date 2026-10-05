"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { FoodDTO } from "@/lib/types";
import { api } from "./fetcher";
import { qk } from "./keys";

export function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export interface SearchResponse {
  query: string;
  results: FoodDTO[];
  external?: { provider: string; status: "ok" | "error" | "skipped"; message?: string }[];
}

export function useFoodSearch(query: string) {
  const q = useDebounced(query.trim(), 200);
  return useQuery({
    queryKey: qk.search(q),
    queryFn: ({ signal }) => api<SearchResponse>(`/api/foods/search?q=${encodeURIComponent(q)}`, { signal }),
    enabled: q.length >= 1,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export type LibraryTab = "recent" | "frequent" | "favorites" | "mine" | "recipes";

export function useLibrary(tab: LibraryTab, enabled = true) {
  return useQuery({
    queryKey: qk.library(tab),
    queryFn: () => api<{ foods: FoodDTO[] }>(`/api/foods/library?tab=${tab}`).then((r) => r.foods),
    enabled,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      api(`/api/foods/${id}/favorite`, { method: favorite ? "PUT" : "DELETE" }),
    onSuccess: (_r, { favorite }) => {
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["food-search"] });
      qc.invalidateQueries({ queryKey: ["food"] });
      toast(favorite ? "Saved to favorites" : "Removed from favorites");
    },
    onError: (e) => toast.error(e.message),
  });
}
