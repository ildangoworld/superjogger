"use client";

import { useState } from "react";

type StatItem = {
  id: string;
  value: string;
  label: string;
  hint: string;
};

export function WorkoutsHeaderStats({ items }: { items: StatItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = items.find((item) => item.id === activeId) ?? null;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-4 gap-3" role="list">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="listitem"
              aria-pressed={isActive}
              aria-describedby={isActive ? `stat-hint-${item.id}` : undefined}
              onClick={() =>
                setActiveId((current) => (current === item.id ? null : item.id))
              }
              className={[
                "rounded-lg px-1 py-1 text-left transition-colors",
                isActive ? "bg-pine-50" : "hover:bg-fog-100",
              ].join(" ")}
            >
              <span className="text-pine-900 block text-base font-semibold">
                {item.value}
              </span>
              <span className="text-muted mt-0.5 block text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
      {active ? (
        <p
          id={`stat-hint-${active.id}`}
          role="status"
          className="text-muted mt-3 text-sm leading-6"
        >
          {active.hint}
        </p>
      ) : null}
    </div>
  );
}
