"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFoodSearch, useLibrary, type LibraryTab } from "@/lib/queries/foods";
import type { FoodDTO } from "@/lib/types";
import { cn } from "@/lib/cn";
import { FoodRow } from "./food-row";

const TABS: { value: LibraryTab; label: string; empty: string; body: string }[] = [
  { value: "recent", label: "Recent", empty: "Nothing logged yet", body: "Foods you log show up here for one-tap re-adding." },
  { value: "frequent", label: "Frequent", empty: "No regulars yet", body: "The foods you log most often will collect here." },
  { value: "favorites", label: "Favorites", empty: "No favorites yet", body: "Tap the star on any food to keep it here." },
  { value: "mine", label: "My foods", empty: "No custom foods", body: "Add a food from its label when search doesn't have it." },
  { value: "recipes", label: "Recipes", empty: "No recipes yet", body: "Save a dish you cook often and log it by the serving." },
];

function ResultList({
  foods,
  onPick,
  onQuickAdd,
  addingId,
}: {
  foods: FoodDTO[];
  onPick: (f: FoodDTO) => void;
  onQuickAdd?: (f: FoodDTO) => void;
  addingId?: string | null;
}) {
  return (
    <ul>
      {foods.map((f) => (
        <FoodRow
          key={f.id}
          food={f}
          onOpen={() => onPick(f)}
          onQuickAdd={onQuickAdd ? () => onQuickAdd(f) : undefined}
          adding={addingId === f.id}
        />
      ))}
    </ul>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 py-3" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

function LibraryList({
  tab,
  onPick,
  onQuickAdd,
  addingId,
}: {
  tab: (typeof TABS)[number];
  onPick: (f: FoodDTO) => void;
  onQuickAdd?: (f: FoodDTO) => void;
  addingId?: string | null;
}) {
  const { data, isLoading } = useLibrary(tab.value);
  if (isLoading) return <LoadingRows />;
  if (!data?.length)
    return (
      <EmptyState
        title={tab.empty}
        body={tab.body}
        action={
          tab.value === "mine" ? (
            <Link href="/foods/new" className="text-[13px] font-medium text-accent hover:underline">
              Add a custom food
            </Link>
          ) : tab.value === "recipes" ? (
            <Link href="/recipes/new" className="text-[13px] font-medium text-accent hover:underline">
              Create a recipe
            </Link>
          ) : null
        }
      />
    );
  return <ResultList foods={data} onPick={onPick} onQuickAdd={onQuickAdd} addingId={addingId} />;
}

export function SearchPanel({
  onPick,
  onQuickAdd,
  addingId,
  autoFocus = true,
  className,
}: {
  onPick: (f: FoodDTO) => void;
  onQuickAdd?: (f: FoodDTO) => void;
  addingId?: string | null;
  autoFocus?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<LibraryTab>("recent");
  const search = useFoodSearch(query);
  const q = query.trim();

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
          placeholder="Search foods, brands, meals..."
          aria-label="Search foods"
          autoComplete="off"
          className="h-11 w-full rounded-control border border-border bg-surface pr-9 pl-9 text-base placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-faint hover:bg-subtle hover:text-text"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {q ? (
        <div className="mt-2" aria-live="polite" aria-busy={search.isFetching}>
          {search.isLoading ? (
            <LoadingRows />
          ) : search.data?.results.length ? (
            <>
              <ResultList foods={search.data.results} onPick={onPick} onQuickAdd={onQuickAdd} addingId={addingId} />
              {search.data.external?.some((e) => e.status === "error") ? (
                <p className="mt-3 text-xs text-faint">Some online sources didn&apos;t respond. Showing what we have.</p>
              ) : null}
            </>
          ) : (
            <EmptyState
              title={`No matches for “${q}”`}
              body="Try a simpler name, or add it from the pack label."
              action={
                <Link
                  href={`/foods/new?name=${encodeURIComponent(q)}`}
                  className="text-[13px] font-medium text-accent hover:underline"
                >
                  Add “{q}” as a custom food
                </Link>
              }
            />
          )}
        </div>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as LibraryTab)} className="mt-3">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value} className="focus-visible:outline-none">
              <LibraryList tab={t} onPick={onPick} onQuickAdd={onQuickAdd} addingId={addingId} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
