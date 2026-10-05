import { describe, expect, it } from "vitest";
import { addDays, ageOn, dateKeyToDb, dateRange, dbToDateKey, isDateKey, relativeDayLabel } from "../dates";

describe("dates", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("validates keys", () => {
    expect(isDateKey("2026-02-29")).toBe(false);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2026-1-1")).toBe(false);
  });
  it("round-trips through the db representation", () => {
    expect(dbToDateKey(dateKeyToDb("2026-10-06"))).toBe("2026-10-06");
  });
  it("labels relative days", () => {
    expect(relativeDayLabel("2026-10-06", "2026-10-06")).toBe("Today");
    expect(relativeDayLabel("2026-10-05", "2026-10-06")).toBe("Yesterday");
  });
  it("computes age and ranges", () => {
    expect(ageOn(new Date(2000, 9, 7), new Date(2026, 9, 6))).toBe(25);
    expect(dateRange("2026-10-06", 3)).toEqual(["2026-10-04", "2026-10-05", "2026-10-06"]);
  });
});
