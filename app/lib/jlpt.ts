/**
 * The next JLPT. In Japan it is held on the first Sunday of July and of December.
 * shortcut: worked out from that rule, not read from the official calendar; check jlpt.jp if a date is ever moved.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's date in Japan, where the exam is held, as midnight UTC of that date. */
function todayInJapan(now: Date): number {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(now).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** The first Sunday of `month` (0-based) in `year`, as midnight UTC. */
function firstSunday(year: number, month: number): number {
  const first = new Date(Date.UTC(year, month, 1));
  return Date.UTC(year, month, 1 + ((7 - first.getUTCDay()) % 7));
}

/** The date of the next exam ("2026-12-06"), and the days left until it; 0 on the day itself. */
export function nextJlpt(now = new Date()): { date: string; daysLeft: number } {
  const today = todayInJapan(now);
  const year = new Date(today).getUTCFullYear();
  const exam = [firstSunday(year, 6), firstSunday(year, 11), firstSunday(year + 1, 6)].find((day) => day >= today)!;
  return { date: new Date(exam).toISOString().slice(0, 10), daysLeft: Math.round((exam - today) / DAY_MS) };
}
