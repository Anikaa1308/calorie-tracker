"use client";

import { useRouter } from "next/navigation";
import { useAddFood } from "@/components/food-search/add-food-provider";
import { PageColumn, PageHeader } from "@/components/layout/page-header";
import { RecipeBuilder } from "@/components/library/recipe-builder";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useDeleteRecipe, useRecipe, useSaveRecipe } from "@/lib/queries/library";

export function RecipeView({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading } = useRecipe(id);
  const save = useSaveRecipe(id);
  const del = useDeleteRecipe();
  const { openAddFood } = useAddFood();
  return (
    <PageColumn>
      <PageHeader title={data?.name ?? "Recipe"} description="Changes apply to future entries; your diary keeps what you logged." />
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-panel" />
      ) : !data ? (
        <EmptyState title="Recipe not found" />
      ) : (
        <RecipeBuilder
          key={data.id}
          recipe={data}
          submitting={save.isPending}
          onSubmit={(input) => save.mutate(input)}
          onDelete={() => del.mutate(id, { onSuccess: () => router.push("/recipes") })}
          onLog={data.food ? () => openAddFood({ food: data.food! }) : undefined}
        />
      )}
    </PageColumn>
  );
}
