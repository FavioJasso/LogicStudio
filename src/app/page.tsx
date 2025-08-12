"use client";
import PropositionalChecker from "@/components/PropositionalChecker";
import SyllogismChecker from "@/components/SyllogismChecker";
import { Tabs } from "@/components/ui/Tabs";
import React from "react";
import { useSymbolShortcuts } from "@/lib/shortcuts";

export default function Home() {
  const [tab, setTab] = React.useState("prop");
  const [projectorMode, setProjectorMode] = React.useState(false);
  const [largeText, setLargeText] = React.useState(false);
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("large-text-root", largeText);
    }
  }, [largeText]);
  useSymbolShortcuts();
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
              <a className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700" href="#about" onClick={(e) => { e.preventDefault(); document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }); }}>About & Shortcuts</a>
            </div>
          </div>
          <div className="mt-6 print-area">
            {tab === "prop" ? <PropositionalChecker /> : <SyllogismChecker />}
          </div>
        </div>
        <footer className="text-xs text-zinc-500 dark:text-zinc-400 mt-8">
          Made for philosophy academia. Symbols supported: ¬ ~ ! ∧ & ^ ∨ | → -&gt; ↔ &lt;-&gt;
        </footer>
        <section id="about" className="mt-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/50 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">About & Keyboard Shortcuts</h2>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            To speed entry of logical symbols, use Control (or Command on macOS) plus the number keys:
          </p>
          <ul className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 grid sm:grid-cols-2 gap-y-1">
            <li><span className="font-mono">Ctrl/⌘ + 1</span>: ¬ (NOT)</li>
            <li><span className="font-mono">Ctrl/⌘ + 2</span>: ∧ (AND)</li>
            <li><span className="font-mono">Ctrl/⌘ + 3</span>: ∨ (OR)</li>
            <li><span className="font-mono">Ctrl/⌘ + 4</span>: → (IMPLIES)</li>
            <li><span className="font-mono">Ctrl/⌘ + 5</span>: ↔ (IFF)</li>
          </ul>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            Shortcuts work in any input on this page. You can still type ASCII alternatives like <span className="font-mono">-&gt;</span> and <span className="font-mono">&lt;-&gt;</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
