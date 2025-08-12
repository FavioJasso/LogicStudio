"use client";
import PropositionalChecker from "@/components/PropositionalChecker";
import SyllogismChecker from "@/components/SyllogismChecker";
import { Tabs } from "@/components/ui/Tabs";
import React from "react";

export default function Home() {
  const [tab, setTab] = React.useState("prop");
  const [projectorMode, setProjectorMode] = React.useState(false);
  const [largeText, setLargeText] = React.useState(false);
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("large-text-root", largeText);
    }
  }, [largeText]);
  return (
    <div className={`min-h-screen font-sans bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 ${projectorMode ? "projector-mode" : ""}`}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Logic Studio
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Check arguments for validity and explore categorical syllogisms.
          </p>
        </header>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/50 backdrop-blur p-6 shadow-sm card">
          <div className="flex items-center justify-between gap-3 no-print">
            <Tabs
              items={[
                { id: "prop", label: "Propositional" },
                { id: "syll", label: "Syllogism" },
              ]}
              activeId={tab}
              onChange={setTab}
            />
            <div className="flex flex-wrap gap-2">
              <label className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2"><input type="checkbox" checked={projectorMode} onChange={(e) => setProjectorMode(e.target.checked)} /> Projector</label>
              <label className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2"><input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} /> Large text</label>
            </div>
          </div>
          <div className="mt-6 print-area">
            {tab === "prop" ? <PropositionalChecker /> : <SyllogismChecker />}
          </div>
        </div>
        <footer className="text-xs text-zinc-500 dark:text-zinc-400 mt-8">
          Made for philosophy academia. Symbols supported: ¬ ~ ! ∧ & ^ ∨ | → -&gt; ↔ &lt;-&gt;
        </footer>
      </div>
    </div>
  );
}
