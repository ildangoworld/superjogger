/**
 * Returns YYYY-MM-DD for the given instant in an IANA timezone.
 */
export function formatLocalDate(
  timeZone: string,
  date: Date = new Date(),
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format local date");
  }

  return `${year}-${month}-${day}`;
}

/**
 * Monday-start week (user local timezone). Returns YYYY-MM-DD of that Monday.
 */
export function getWeekStartDate(
  timeZone: string,
  date: Date = new Date(),
): string {
  const localDate = formatLocalDate(timeZone, date);
  return getWeekStartFromLocalDateString(localDate);
}

export function getWeekStartFromLocalDateString(localDate: string): string {
  const [year, month, day] = localDate.split("-").map(Number);
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = utcNoon.getUTCDay(); // 0 Sun .. 6 Sat
  const daysFromMonday = (weekday + 6) % 7;
  utcNoon.setUTCDate(utcNoon.getUTCDate() - daysFromMonday);
  return utcNoon.toISOString().slice(0, 10);
}

export function addDaysToLocalDate(localDate: string, days: number): string {
  const [year, month, day] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return date.toISOString().slice(0, 10);
}

/**
 * Completed Mondays from firstWeekStart inclusive up to (but not including) currentWeekStart.
 */
export function listCompletedWeekStarts(
  firstWeekStart: string,
  currentWeekStart: string,
): string[] {
  if (firstWeekStart >= currentWeekStart) {
    return [];
  }

  const weeks: string[] = [];
  let cursor = firstWeekStart;
  while (cursor < currentWeekStart) {
    weeks.push(cursor);
    cursor = addDaysToLocalDate(cursor, 7);
  }
  return weeks;
}
