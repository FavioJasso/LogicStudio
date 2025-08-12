"use client";
import React from "react";

type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
};

export function Tabs({ items, activeId, onChange }: TabsProps) {
  return (
    <div className="w-full">
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {items.map((t) => {
          const active = t.id === activeId;
          return (
            <button
              key={t.id}
              className={`px-3 py-2 text-sm font-medium transition-colors -mb-px border-b-2 ${
                active
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
              onClick={() => onChange(t.id)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}


