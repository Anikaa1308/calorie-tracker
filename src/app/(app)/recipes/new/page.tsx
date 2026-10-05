"use client";

import { useRouter } from "next/navigation";
import { PageColumn, PageHeader } from "@/components/layout/page-header";
import { RecipeBuilder } from "@/components/library/recipe-builder";
import { useSaveRecipe } from "@/lib/queries/library";

export default function NewRecipePage() {
  const router = useRouter();
  const save = useSaveRecipe();
  return (
    <PageColumn>
      <PageHeader title="New recipe" />
      <RecipeBuilder
        submitting={save.isPending}
        onSubmit={(input) => save.mutate(input, { onSuccess: (r) => router.replace(`/recipes/${r.id}`) })}
      />
    </PageColumn>
  );
}
