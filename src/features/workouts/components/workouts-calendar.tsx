"use client";

import { useMemo, useState } from "react";
import {
  addMonthsToYearMonth,
  buildMonthCalendarDays,
  getYearMonthFromLocalDate,
} from "@/lib/dates/week";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

function formatYearMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${year}년 ${Number(month)}월`;
}

export function WorkoutsCalendar({
  todayLocal,
  countsByDate,
  selectedDate,
  onSelectDate,
}: {
  todayLocal: string;
  countsByDate: Record<string, number>;
  selectedDate: string | null;
  onSelectDate: (localDate: string | null) => void;
}) {
  const [yearMonth, setYearMonth] = useState(
    getYearMonthFromLocalDate(todayLocal),
  );

  const cells = useMemo(
    () => buildMonthCalendarDays(yearMonth),
    [yearMonth],
  );

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-pine-900 text-lg font-semibold">달력</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => setYearMonth((current) => addMonthsToYearMonth(current, -1))}
            className="text-pine-800 border-line hover:border-pine-300 inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm"
          >
            ←
          </button>
          <p className="text-pine-900 min-w-28 text-center text-sm font-medium">
            {formatYearMonthLabel(yearMonth)}
          </p>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => setYearMonth((current) => addMonthsToYearMonth(current, 1))}
            className="text-pine-800 border-line hover:border-pine-300 inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm"
          >
            →
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1">
        {WEEKDAY_LABELS.map((label) => (
          <p
            key={label}
            className="text-muted py-1 text-center text-xs font-medium"
          >
            {label}
          </p>
        ))}
        {cells.map((cell) => {
          const count = countsByDate[cell.localDate] ?? 0;
          const isToday = cell.localDate === todayLocal;
          const isSelected = cell.localDate === selectedDate;
          const hasWorkout = count > 0;

          return (
            <button
              key={cell.localDate}
              type="button"
              disabled={!cell.inMonth}
              aria-pressed={isSelected}
              aria-label={`${cell.localDate}${hasWorkout ? `, 기록 ${count}개` : ""}`}
              onClick={() => {
                if (!cell.inMonth) {
                  return;
                }
                onSelectDate(isSelected ? null : cell.localDate);
              }}
              className={[
                "relative flex h-11 flex-col items-center justify-center rounded-lg text-sm transition-colors",
                cell.inMonth ? "text-pine-900" : "text-fog-300",
                isSelected ? "bg-pine-800 text-fog-50" : "",
                !isSelected && isToday ? "bg-pine-50" : "",
                !isSelected && !isToday && cell.inMonth
                  ? "hover:bg-fog-100"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={isToday && !isSelected ? "font-semibold" : ""}>
                {cell.day}
              </span>
              {hasWorkout ? (
                <span
                  className={[
                    "mt-0.5 h-1 w-1 rounded-full",
                    isSelected ? "bg-fog-50" : "bg-pine-600",
                  ].join(" ")}
                  aria-hidden
                />
              ) : (
                <span className="mt-0.5 h-1 w-1" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate ? (
        <p className="text-muted mt-3 text-sm">
          {selectedDate} 기록만 보고 있어요.{" "}
          <button
            type="button"
            onClick={() => onSelectDate(null)}
            className="text-pine-700 font-medium underline-offset-4 hover:underline"
          >
            전체 보기
          </button>
        </p>
      ) : (
        <p className="text-muted mt-3 text-sm">
          운동한 날은 점으로 표시돼요. 날짜를 누르면 그날 기록만 볼 수 있어요.
        </p>
      )}
    </section>
  );
}
