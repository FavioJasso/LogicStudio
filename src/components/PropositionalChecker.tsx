"use client";
import React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  buildTruthTable,
  checkValidity,
  parse,
  parseArgument,
  prettyPrintValuation,
  AstNode,
  collectVariables,
  evaluate,
} from "@/lib/logic/propositional";

type Row = ReturnType<typeof buildTruthTable>["rows"][number];

export default function PropositionalChecker() {
  const [premises, setPremises] = React.useState<string[]>(["P → Q", "P"]);
  const [conclusion, setConclusion] = React.useState<string>("Q");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<
    | {
        isValid: boolean;
        counter: string | null;
        table?: { variables: string[]; rows: Row[] };
        pAsts: AstNode[];
        cAst: AstNode;
        variables: string[];
      }
    | null
  >(null);
  const [userTruths, setUserTruths] = React.useState<Record<string, boolean>>({});

  function onRun() {
    try {
      setError(null);
      const { premises: pAsts, conclusion: cAst } = parseArgument(
        premises,
        conclusion
      );
      const validity = checkValidity(pAsts, cAst, { maxVariables: 10 });
      const table = buildTruthTable(pAsts, cAst);
      const variables = Array.from(
        new Set<string>([
          ...pAsts.flatMap((p) => collectVariables(p)),
          ...collectVariables(cAst),
        ])
      );
      setUserTruths((prev) => {
        const next: Record<string, boolean> = { ...prev };
        for (const v of variables) if (next[v] === undefined) next[v] = false;
        // remove stale keys
        for (const k of Object.keys(next)) if (!variables.includes(k)) delete next[k];
        return next;
      });
      setResult({
        isValid: validity.isValid,
        counter: validity.counterModel ? prettyPrintValuation(validity.counterModel) : null,
        table,
        pAsts,
        cAst,
        variables,
      });
    } catch (e: any) {
      setError(e.message || String(e));
      setResult(null);
    }
  }

  function updatePremise(i: number, value: string) {
    setPremises((prev) => prev.map((p, idx) => (idx === i ? value : p)));
  }

  function addPremise() {
    setPremises((prev) => [...prev, ""]);
  }
  function removePremise(i: number) {
    setPremises((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Examples</div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => {
              setPremises(["P → Q", "P"]);
              setConclusion("Q");
            }}
          >
            Modus Ponens
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setPremises(["P → Q", "Q"]);
              setConclusion("P");
            }}
          >
            Affirming the consequent (invalid)
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setPremises(["P", "Q → P"]);
              setConclusion("P");
            }}
          >
            Tautological consequence
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Premises</label>
        <div className="space-y-2">
          {premises.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder={`Premise ${i + 1} (e.g., P → Q)`}
                value={p}
                onChange={(e) => updatePremise(i, e.target.value)}
              />
              <Button variant="outline" onClick={() => removePremise(i)} aria-label={`Remove premise ${i + 1}`}>
                ✕
              </Button>
            </div>
          ))}
          <Button variant="secondary" onClick={addPremise}>
            + Add premise
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Conclusion</label>
        <Input
          placeholder="Conclusion (e.g., Q)"
          value={conclusion}
          onChange={(e) => setConclusion(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={onRun}>Check validity</Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 rounded-md bg-red-50 dark:bg-red-950/30 p-3">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div
            className={`rounded-lg p-4 border ${
              result.isValid
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-200"
                : "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200"
            }`}
          >
            <div className="font-semibold">
              {result.isValid ? "Valid argument" : "Invalid argument"}
            </div>
            {!result.isValid && result.counter && (
              <div className="text-sm mt-1 opacity-90">Countermodel: {result.counter}</div>
            )}
          </div>

          {result.variables.length > 0 && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="font-medium text-zinc-800 dark:text-zinc-200">Soundness (set truth values)</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.variables.map((v) => (
                  <div key={v} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{v}</span>
                    <div className="flex gap-1">
                      <Button
                        variant={userTruths[v] ? "primary" : "outline"}
                        className="px-2 py-1 text-xs"
                        onClick={() => setUserTruths((prev) => ({ ...prev, [v]: true }))}
                      >
                        T
                      </Button>
                      <Button
                        variant={!userTruths[v] ? "primary" : "outline"}
                        className="px-2 py-1 text-xs"
                        onClick={() => setUserTruths((prev) => ({ ...prev, [v]: false }))}
                      >
                        F
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                {(() => {
                  try {
                    const premVals = result.pAsts.map((p) => evaluate(p, userTruths));
                    const concVal = evaluate(result.cAst, userTruths);
                    const allPremTrue = premVals.every(Boolean);
                    const sound = result.isValid && allPremTrue;
                    return (
                      <div className="space-y-1">
                        <div>
                          Premises under your assignment: {premVals.map((b, i) => (b ? "T" : "F")).join(", ")}
                        </div>
                        <div>Conclusion under your assignment: {concVal ? "T" : "F"}</div>
                        <div className={sound ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}>
                          {sound ? "Sound (valid and premises true)" : "Not sound (either invalid or a premise is false)"}
                        </div>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </div>
            </div>
          )}

          {result.table && (
            <div className="overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="min-w-[640px] w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/40">
                  <tr>
                    {result.table.variables.map((v) => (
                      <th key={v} className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                        {v}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                      Premises
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                      Conclusion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.table.rows.map((row, idx) => {
                    const premisesTrue = row.premisesValues.every(Boolean);
                    return (
                      <tr key={idx} className="border-t border-zinc-200 dark:border-zinc-800">
                        {result.table!.variables.map((v) => (
                          <td key={v} className="px-3 py-2">
                            {row.valuation[v] ? "T" : "F"}
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          {row.premisesValues.map((b, i) => (
                            <span key={i} className={b ? "text-emerald-600" : "text-rose-600"}>
                              {b ? "T" : "F"}
                              {i < row.premisesValues.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </td>
                        <td className={`px-3 py-2 ${premisesTrue && !row.conclusionValue ? "bg-amber-100 dark:bg-amber-950/50" : ""}`}>
                          <span className={row.conclusionValue ? "text-emerald-600" : "text-rose-600"}>
                            {row.conclusionValue ? "T" : "F"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


