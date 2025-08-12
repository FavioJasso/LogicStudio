"use client";
import React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { CategoricalStatement, Quantifier, Syllogism } from "@/lib/logic/syllogism";
import { analyzeMoodFigure, checkSyllogism } from "@/lib/logic/syllogism";

function StatementRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: CategoricalStatement;
  onChange: (s: CategoricalStatement) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="w-24 shrink-0 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <select
        value={value.quantifier}
        onChange={(e) => onChange({ ...value, quantifier: e.target.value as Quantifier })}
        className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <option value="A">All</option>
        <option value="E">No</option>
        <option value="I">Some</option>
        <option value="O">Some ... not</option>
      </select>
      <Input
        placeholder="Subject term (S)"
        value={value.subject}
        onChange={(e) => onChange({ ...value, subject: e.target.value })}
        className="max-w-48"
      />
      <span className="text-sm text-zinc-500">are</span>
      <Input
        placeholder="Predicate term (P)"
        value={value.predicate}
        onChange={(e) => onChange({ ...value, predicate: e.target.value })}
        className="max-w-48"
      />
    </div>
  );
}

export default function SyllogismChecker() {
  const [premise1, setPremise1] = React.useState<CategoricalStatement>({ quantifier: "A", subject: "M", predicate: "P" });
  const [premise2, setPremise2] = React.useState<CategoricalStatement>({ quantifier: "A", subject: "S", predicate: "M" });
  const [conclusion, setConclusion] = React.useState<CategoricalStatement>({ quantifier: "A", subject: "S", predicate: "P" });
  const [result, setResult] = React.useState<ReturnType<typeof checkSyllogism> | null>(null);

  function onRun() {
    const syllogism: Syllogism = { premise1, premise2, conclusion };
    const res = checkSyllogism(syllogism);
    setResult(res);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <StatementRow label="Premise 1" value={premise1} onChange={setPremise1} />
        <StatementRow label="Premise 2" value={premise2} onChange={setPremise2} />
        <StatementRow label="Conclusion" value={conclusion} onChange={setConclusion} />
      </div>
      <div className="flex gap-3">
        <Button onClick={onRun}>Check syllogism</Button>
      </div>
      {result && (
        <div className="space-y-3">
          <div className={`rounded-lg p-4 border ${result.isValid ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-200" : "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200"}`}>
            <div className="font-semibold">
              {result.isValid ? "Valid syllogism" : "Invalid syllogism"}
            </div>
            <div className="text-sm mt-1 opacity-90">
              Mood: {result.moodFigure.mood} {result.moodFigure.figure ? `(Figure ${result.moodFigure.figure})` : ""}
            </div>
            {result.namedForm && (
              <div className="text-sm mt-1 opacity-90">Named form: {result.namedForm}</div>
            )}
            {!result.isValid && result.counterModel && (
              <div className="text-sm mt-1 opacity-90">
                Countermodel universe: {`{${result.counterModel.universe.join(", ")}}`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


