/**
 * Calendar dates are stored and passed around as "YYYY-MM-DD" keys in the
 * person's local time, never as instants, so a meal logged at 11 pm stays on
 * that day.
 */

export type DateKey = string;

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(s: string): s is DateKey {
  if (!KEY_RE.test(s)) return false;
  const d = parseDateKey(s);
  return toDateKey(d) === s;
}

export function toDateKey(d: Date): DateKey {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local-midnight Date for a key. */
export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(now = new Date()): DateKey {
  return toDateKey(now);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** UTC-midnight Date used for Postgres DATE columns. */
export function dateKeyToDb(key: DateKey): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function dbToDateKey(d: Date): DateKey {
  return d.toISOString().slice(0, 10);
}

/** "Tuesday, October 6". */
export function formatDayLong(key: DateKey): string {
  return parseDateKey(key).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** "Today", "Yesterday", "Tomorrow" or "Tue, Oct 6". */
export function relativeDayLabel(key: DateKey, today: DateKey = todayKey()): string {
  if (key === today) return "Today";
  if (key === addDays(today, -1)) return "Yesterday";
  if (key === addDays(today, 1)) return "Tomorrow";
  return parseDateKey(key).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ageOn(birthDate: Date, on: Date = new Date()): number {
  let age = on.getFullYear() - birthDate.getFullYear();
  const m = on.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < birthDate.getDate())) age--;
  return age;
}

export function dateRange(endKey: DateKey, days: number): DateKey[] {
  return Array.from({ length: days }, (_, i) => addDays(endKey, i - days + 1));
}
