"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { PageColumn, PageHeader } from "@/components/layout/page-header";
import { MacroLine } from "@/components/nutrition/macro-line";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel, Skeleton } from "@/components/ui/misc";
import { formatKcal, formatQuantity } from "@/lib/format";
import { useRecipes } from "@/lib/queries/library";

export function RecipesView() {
  const { data, isLoading } = useRecipes();
  return (
    <PageColumn>
      <PageHeader
        title="Recipes"
        description="Dishes you cook often, logged by the serving."
        actions={
          <Button asChild size="sm">
            <Link href="/recipes/new">
              <Plus />
              New recipe
            </Link>
          </Button>
        }
      />
      <Panel>
        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : data?.length ? (
          <ul className="divide-y divide-border">
            {data.map((r) => (
              <li key={r.id}>
                <Link href={`/recipes/${r.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-subtle/60">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{r.name}</p>
                    <p className="text-xs text-muted">
                      {formatQuantity(r.servings)} servings · {r.ingredientCount} ingredient{r.ingredientCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  {r.perServing ? (
                    <div className="text-right">
                      <p className="tabular text-sm">
                        {formatKcal(r.perServing.calories)} <span className="text-xs text-faint">kcal / serving</span>
                      </p>
                      <MacroLine n={r.perServing} />
                    </div>
                  ) : null}
                  <ChevronRight className="size-4 text-faint" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No recipes yet"
            body="Build a dish from its ingredients, including the oil, and Plate works out each serving."
            action={
              <Button asChild variant="secondary" size="sm">
                <Link href="/recipes/new">Create a recipe</Link>
              </Button>
            }
          />
        )}
      </Panel>
    </PageColumn>
  );
}
