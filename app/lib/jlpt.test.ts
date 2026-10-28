import { describe, expect, it } from "vitest";
import { nextJlpt } from "./jlpt";

describe("nextJlpt", () => {
  it("finds the December exam, the first Sunday of the month, and counts the days to it", () => {
    expect(nextJlpt(new Date("2026-10-28T03:00:00Z"))).toEqual({ date: "2026-12-06", daysLeft: 39 });
  });

  it("finds the July exam in the first half of the year", () => {
    expect(nextJlpt(new Date("2027-02-01T03:00:00Z"))).toEqual({ date: "2027-07-04", daysLeft: 153 });
  });

  it("counts 0 on the exam day, and moves to the next year's July the day after December's", () => {
    expect(nextJlpt(new Date("2026-12-06T03:00:00Z")).daysLeft).toBe(0);
    expect(nextJlpt(new Date("2026-12-07T03:00:00Z"))).toEqual({ date: "2027-07-04", daysLeft: 209 });
  });

  it("goes by the date in Japan, which is ahead of UTC", () => {
    // 15:30 UTC on 5 December is 00:30 on 6 December in Tokyo: the exam day.
    expect(nextJlpt(new Date("2026-12-05T15:30:00Z")).daysLeft).toBe(0);
  });
});
