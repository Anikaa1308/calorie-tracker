"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, formatDayLong, isDateKey, todayKey } from "@/lib/dates";

export function DayNavigator({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const today = todayKey();
  const isToday = date === today;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="label-caps">{isToday ? "Today" : date === addDays(today, -1) ? "Yesterday" : " "}</p>
        <h1 className="mt-1 truncate text-[20px] font-semibold tracking-tight sm:text-[24px]">{formatDayLong(date)}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Previous day" onClick={() => onChange(addDays(date, -1))}>
          <ChevronLeft />
        </Button>
        {!isToday ? (
          <Button variant="secondary" size="sm" onClick={() => onChange(today)}>
            Today
          </Button>
        ) : null}
        <Button variant="ghost" size="icon" aria-label="Next day" onClick={() => onChange(addDays(date, 1))}>
          <ChevronRight />
        </Button>
        <label className="relative flex size-9 cursor-pointer items-center justify-center rounded-control text-muted hover:bg-subtle hover:text-text">
          <CalendarDays className="size-4" />
          <span className="sr-only">Pick a date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => isDateKey(e.target.value) && onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}
