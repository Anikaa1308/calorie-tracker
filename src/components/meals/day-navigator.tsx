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
        <h1 className="mt-1 truncate text-[22px] font-bold tracking-tight sm:text-[26px]">{formatDayLong(date)}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="dashed" size="icon" aria-label="Previous day" onClick={() => onChange(addDays(date, -1))}>
          <ChevronLeft />
        </Button>
        {!isToday ? (
          <Button variant="secondary" size="sm" onClick={() => onChange(today)}>
            Today
          </Button>
        ) : null}
        <Button variant="dashed" size="icon" aria-label="Next day" onClick={() => onChange(addDays(date, 1))}>
          <ChevronRight />
        </Button>
        <label className="relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-pill text-text hover:bg-pill-hover">
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
