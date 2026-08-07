/**
 * Convert a wall-clock local date/time in an IANA timezone to a UTC ISO string.
 */
export function zonedLocalToUtcIso(
  localDate: string,
  localTime: string,
  timeZone: string,
): string {
  const normalizedTime =
    localTime.length === 5 ? `${localTime}:00` : localTime;

  const [year, month, day] = localDate.split("-").map(Number);
  const [hour, minute, second] = normalizedTime.split(":").map(Number);

  if (
    [year, month, day, hour, minute, second].some(
      (value) => !Number.isFinite(value),
    )
  ) {
    throw new Error("Invalid local date or time");
  }

  const desiredAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  let utc = new Date(desiredAsUtcMs);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(utc)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    ) as Record<string, string>;

    const asUtcMs = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );

    utc = new Date(utc.getTime() + (desiredAsUtcMs - asUtcMs));
  }

  return utc.toISOString();
}

export function isFutureLocalDate(
  localDate: string,
  todayLocalDate: string,
): boolean {
  return localDate > todayLocalDate;
}
