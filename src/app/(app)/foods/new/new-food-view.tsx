"use client";

import { useRouter } from "next/navigation";
import { CustomFoodForm, type CustomFoodDefaults } from "@/components/library/custom-food-form";
import { useAddFood } from "@/components/food-search/add-food-provider";
import { PageColumn, PageHeader } from "@/components/layout/page-header";
import { useSaveCustomFood } from "@/lib/queries/library";

export function NewFoodView({ defaults }: { defaults: CustomFoodDefaults }) {
  const router = useRouter();
  const save = useSaveCustomFood();
  const { openAddFood } = useAddFood();
  return (
    <PageColumn>
      <PageHeader title="New food" description="Copy the values from the pack. Plate never guesses nutrition." />
      <CustomFoodForm
        defaults={defaults}
        submitting={save.isPending}
        onSubmit={(input) =>
          save.mutate(input, {
            onSuccess: (food) => {
              router.push("/foods");
              openAddFood({ food });
            },
          })
        }
      />
    </PageColumn>
  );
}
