"use client";

import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { FoodDetail } from "@/components/food-search/food-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { formatKcal, formatQuantity } from "@/lib/format";
import { useDeleteEntry, useUpdateEntry } from "@/lib/queries/diary";
import { api } from "@/lib/queries/fetcher";
import { qk } from "@/lib/queries/keys";
import type { FoodDTO, MealItemDTO, MealTypeCode } from "@/lib/types";

export function EditEntrySheet({
  item,
  meal,
  date,
  onClose,
}: {
  item: MealItemDTO | null;
  meal: MealTypeCode;
  date: string;
  onClose: () => void;
}) {
  const food = useQuery({
    queryKey: qk.food(item?.foodId ?? ""),
    queryFn: () => api<FoodDTO>(`/api/foods/${item!.foodId}`),
    enabled: !!item?.foodId,
    retry: false,
  });
  const update = useUpdateEntry(date);
  const del = useDeleteEntry(date);

  const remove = () => {
    if (!item) return;
    del.mutate(item);
    onClose();
  };

  const deleteButton = (
    <Button variant="danger" size="sm" className="mt-4 self-start" onClick={remove}>
      <Trash2 />
      Remove from diary
    </Button>
  );

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()} title="Edit entry" hideTitle={!!food.data}>
      {item ? (
        food.data ? (
          <FoodDetail
            key={item.id}
            food={food.data}
            meal={meal}
            initial={{ text: formatQuantity(item.quantity), unit: item.unit }}
            submitting={update.isPending}
            submitLabel={() => "Save changes"}
            onSubmit={(v) =>
              update.mutate(
                { id: item.id, quantity: v.quantity, unit: v.unit, meal: v.meal },
                { onSuccess: onClose },
              )
            }
            extraActions={deleteButton}
          />
        ) : food.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="flex flex-col">
            <p className="text-sm font-medium">{item.foodName}</p>
            <p className="mt-1 text-[13px] text-muted">
              {formatQuantity(item.quantity)} {item.unit} · {formatKcal(item.nutrients.calories)} kcal. This food is
              no longer in your library, so the entry keeps the values it was logged with.
            </p>
            {deleteButton}
          </div>
        )
      ) : null}
    </Sheet>
  );
}
