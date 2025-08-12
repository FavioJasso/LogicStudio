"use client";

export type SymbolShortcut = {
  key: string; // e.key on keyboard (e.g., '1')
  symbol: string; // text to insert
  name: string; // human-readable name
};

export function getDefaultSymbolKeymap(): SymbolShortcut[] {
  return [
    { key: "1", symbol: "¬", name: "NOT" },
    { key: "2", symbol: "∧", name: "AND" },
    { key: "3", symbol: "∨", name: "OR" },
    { key: "4", symbol: "→", name: "IMPLIES" },
    { key: "5", symbol: "↔", name: "IFF" },
  ];
}

function isEditableTarget(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  if (!target) return false;
  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  return false;
}

function insertTextAtCursor(el: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? start;
  el.setRangeText(text, start, end, "end");
  // Trigger React onChange for controlled inputs
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

export function useSymbolShortcuts(map: SymbolShortcut[] = getDefaultSymbolKeymap()): void {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const usesModifier = e.metaKey || e.ctrlKey;
      if (!usesModifier || e.altKey) return;
      const match = map.find((m) => m.key === e.key);
      if (!match) return;
      const active = document.activeElement;
      if (!isEditableTarget(active)) return;
      e.preventDefault();
      insertTextAtCursor(active, match.symbol);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [map]);
}

// React import for the hook
import React from "react";


