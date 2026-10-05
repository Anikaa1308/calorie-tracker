"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAddFood } from "@/components/food-search/add-food-provider";
import { FoodRow } from "@/components/food-search/food-row";
import { PageColumn, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel, Skeleton } from "@/components/ui/misc";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLibrary, type LibraryTab } from "@/lib/queries/foods";

const TABS: { value: LibraryTab; label: string; empty: string }[] = [
  { value: "mine", label: "My foods", empty: "Foods you add from a label appear here." },
  { value: "favorites", label: "Favorites", empty: "Star a food to keep it here." },
  { value: "frequent", label: "Frequent", empty: "The foods you log most will collect here." },
  { value: "recent", label: "Recent", empty: "Foods you log show up here." },
];

export function FoodsView() {
  const [tab, setTab] = useState<LibraryTab>("mine");
  const { data, isLoading } = useLibrary(tab);
  const { openAddFood } = useAddFood();
  const current = TABS.find((t) => t.value === tab)!;
  return (
    <PageColumn>
      <PageHeader
        title="My foods"
        actions={
          <Button asChild size="sm">
            <Link href="/foods/new">
              <Plus />
              New food
            </Link>
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as LibraryTab)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Panel className="mt-4 px-4">
        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : data?.length ? (
          <ul>
            {data.map((f) => (
              <FoodRow
                key={f.id}
                food={f}
                onOpen={() => openAddFood({ food: f })}
                trailing={
                  f.isOwn && f.kind === "USER" ? (
                    <Link href={`/foods/${f.id}/edit`} className="shrink-0 px-1 text-xs font-medium text-muted hover:text-text">
                      Edit
                    </Link>
                  ) : null
                }
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nothing here yet"
            body={current.empty}
            action={
              tab === "mine" ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/foods/new">Add a food from its label</Link>
                </Button>
              ) : null
            }
          />
        )}
      </Panel>
    </PageColumn>
  );
}
