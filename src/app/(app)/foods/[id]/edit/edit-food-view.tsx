"use client";

import { useRouter } from "next/navigation";
import { CustomFoodForm } from "@/components/library/custom-food-form";
import { PageColumn, PageHeader } from "@/components/layout/page-header";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useDeleteCustomFood, useFood, useSaveCustomFood } from "@/lib/queries/library";

export function EditFoodView({ id }: { id: string }) {
  const router = useRouter();
  const { data: food, isLoading, error } = useFood(id);
  const save = useSaveCustomFood(id);
  const del = useDeleteCustomFood();
  return (
    <PageColumn>
      <PageHeader title="Edit food" description="Changes apply to future entries. Your diary keeps what you already logged." />
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-panel" />
      ) : !food || error || !food.isOwn ? (
        <EmptyState title="This food can't be edited" body="Only foods you added yourself can be changed." />
      ) : (
        <CustomFoodForm
          food={food}
          submitting={save.isPending}
          onSubmit={(input) => save.mutate(input, { onSuccess: () => router.push("/foods") })}
          onDelete={() => del.mutate(id, { onSuccess: () => router.push("/foods") })}
        />
      )}
    </PageColumn>
  );
}
