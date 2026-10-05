"use client";

import { useAddFood } from "@/components/food-search/add-food-provider";
import { SearchPanel } from "@/components/food-search/search-panel";
import { PageColumn, PageHeader } from "@/components/layout/page-header";

export function SearchView() {
  const { openAddFood } = useAddFood();
  return (
    <PageColumn>
      <PageHeader title="Search" description="Foods, brands and dishes. Every result shows where its numbers come from." />
      <SearchPanel onPick={(food) => openAddFood({ food })} autoFocus={false} />
    </PageColumn>
  );
}
