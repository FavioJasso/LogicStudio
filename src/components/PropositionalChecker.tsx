"use client";
import React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  buildTruthTable,
  checkValidity,
  parseArgument,
  prettyPrintValuation,
  AstNode,
  collectVariables,
  evaluate,
  deriveArgumentSteps,
  formatAst,
  buildDetailedTruthTable,
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
  const [showDetailed, setShowDetailed] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState<number | null>(null);

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setResult(null);
    }
  }

  function exportCSV() {
    if (!result?.table) return;
    const headers = [...result.table.variables, ...result.pAsts.map((_, i) => `Premise ${i + 1}`), "Conclusion"];
    const lines = [headers.join(",")];
    for (const row of result.table.rows) {
      const vals = [
        ...result.table.variables.map((v) => (row.valuation[v] ? "T" : "F")),
        ...row.premisesValues.map((b) => (b ? "T" : "F")),
        row.conclusionValue ? "T" : "F",
      ];
      lines.push(vals.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "truth-table.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportLaTeX() {
    if (!result?.table) return;
    const headerCols = [
      ...result.table.variables,
      ...result.pAsts.map((_, i) => `P_${i + 1}`),
      "C",
    ];
    const colSpec = "|" + headerCols.map(() => "c|").join("");
    const headerRow = headerCols.join(" & ") + " \\\n";
    const bodyRows = result.table.rows
      .map((row) => {
        const vals = [
          ...result.table!.variables.map((v) => (row.valuation[v] ? "T" : "F")),
          ...row.premisesValues.map((b) => (b ? "T" : "F")),
          row.conclusionValue ? "T" : "F",
        ];
        return vals.join(" & ") + " \\\n";
      })
      .join("");
    const latex = `\\begin{tabular}{${colSpec}}
${headerRow}\\hline
${bodyRows}\\hline
\\end{tabular}`;
    const blob = new Blob([latex], { type: "application/x-tex;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "truth-table.tex";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportPDF() {
    window.print();
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

  const examples: Array<{
    label: string;
    premises: string[];
    conclusion: string;
    explanation: string; // 3-5 sentence rationale
  }> = [
    {
      label: "Modus Ponens (valid)",
      premises: ["P → Q", "P"],
      conclusion: "Q",
      explanation:
        "Modus Ponens states that if P implies Q and P is true, then Q must be true. There is no valuation where both the conditional and the antecedent are true while the consequent is false. The rule mirrors everyday reasoning: from a sufficient condition and its fulfillment, the result follows. Our truth-table confirms no counterexample exists. Therefore the argument is valid.",
    },
    {
      label: "Modus Tollens (valid)",
      premises: ["P → Q", "¬Q"],
      conclusion: "¬P",
      explanation:
        "Modus Tollens says that if P implies Q and Q is false, then P must be false. If P were true while Q is false, the conditional would be violated, so that valuation cannot exist. This captures reasoning from a necessary condition and its failure. The table shows no row with true premises and a false conclusion. Hence, the argument is valid.",
    },
    {
      label: "Hypothetical Syllogism (valid)",
      premises: ["P → Q", "Q → R"],
      conclusion: "P → R",
      explanation:
        "Hypothetical Syllogism chains conditionals: from P → Q and Q → R we infer P → R. Any valuation making both premises true will make the composite implication true as well. The middle term Q passes the requirement forward. Truth-table analysis shows no countermodel. So the argument is valid.",
    },
    {
      label: "Disjunctive Syllogism (valid)",
      premises: ["P ∨ Q", "¬P"],
      conclusion: "Q",
      explanation:
        "Disjunctive Syllogism eliminates one disjunct: if P ∨ Q and not P, then Q follows. If the disjunction is true and P is false, the only way the disjunction can be true is with Q true. The truth-table rules out any row with true premises and false Q. This matches ordinary 'either-or' reasoning. Therefore the argument is valid.",
    },
    {
      label: "Addition (valid)",
      premises: ["P"],
      conclusion: "P ∨ Q",
      explanation:
        "Addition allows us to move from a statement to a larger disjunction. If P is true, then the disjunction P ∨ Q is true regardless of Q. There cannot be a counterexample with P true and P ∨ Q false. Though it may feel uninformative, it's truth-functionally correct. Thus the argument is valid.",
    },
    {
      label: "Simplification (valid)",
      premises: ["P ∧ Q"],
      conclusion: "P",
      explanation:
        "From a conjunction we can infer each conjunct. If P ∧ Q is true, then P is true and Q is true by definition of ∧. The table confirms no row where the conjunction is true and P is false. This is a standard elimination rule. Hence, valid.",
    },
    {
      label: "Conjunction (valid)",
      premises: ["P", "Q"],
      conclusion: "P ∧ Q",
      explanation:
        "Conjunction introduces ∧ from two independently true statements. If P is true and Q is true, then P ∧ Q is true by the semantics of ∧. No counterexample can make both premises true while the conjunction is false. This is the dual to simplification. Therefore valid.",
    },
    {
      label: "Constructive Dilemma (valid)",
      premises: ["P → R", "Q → S", "P ∨ Q"],
      conclusion: "R ∨ S",
      explanation:
        "Constructive Dilemma argues by cases on a disjunction. If P leads to R and Q leads to S, and at least one of P or Q holds, then at least one of R or S must hold. The truth-table spans the two cases and preserves truth to the consequent disjunction. There is no valuation with true premises and a false conclusion. So the argument is valid.",
    },
    {
      label: "Destructive Dilemma (valid)",
      premises: ["P → R", "Q → S", "¬R ∨ ¬S"],
      conclusion: "¬P ∨ ¬Q",
      explanation:
        "Destructive Dilemma contraposits each conditional within a disjunctive refutation. If either R is false or S is false, then the corresponding antecedent must fail, yielding ¬P ∨ ¬Q. The table shows every row with the premises true forces at least one antecedent false. This mirrors reasoning by contrapositive on alternatives. Hence valid.",
    },
    {
      label: "Biconditional Elimination (valid)",
      premises: ["P ↔ Q", "P"],
      conclusion: "Q",
      explanation:
        "A biconditional means each side implies the other. From P ↔ Q and P, it follows that Q, because the right-to-left direction is guaranteed in the definition of ↔. Any valuation making P ↔ Q and P true must make Q true. The reverse direction (from Q) would also work symmetrically. Therefore valid.",
    },
    {
      label: "Biconditional Introduction (valid)",
      premises: ["P → Q", "Q → P"],
      conclusion: "P ↔ Q",
      explanation:
        "If each statement implies the other, the biconditional holds. The truth-table treats ↔ as equivalence of truth values, which follows from the two conditionals. No counterexample makes both implications true while the equivalence fails. This corresponds to mutual sufficiency and necessity. Thus valid.",
    },
    {
      label: "Double Negation (valid)",
      premises: ["P"],
      conclusion: "¬¬P",
      explanation:
        "Under classical logic, negation is involutive: applying it twice preserves truth. If P is true, then ¬P is false and so ¬¬P is true. There is no way for P to be true while ¬¬P is false. The rule can be read in both directions, but here we introduce ¬¬. Therefore valid.",
    },
    {
      label: "Affirming the Consequent (invalid)",
      premises: ["P → Q", "Q"],
      conclusion: "P",
      explanation:
        "This fallacy assumes that because Q is true, the specific cause P must be true. But Q might hold for other reasons. The truth-table shows a counterexample when P is false and Q is true: the conditional is still true, yet the conclusion fails. So the premises can be true while the conclusion is false. The argument is invalid.",
    },
    {
      label: "Denying the Antecedent (invalid)",
      premises: ["P → Q", "¬P"],
      conclusion: "¬Q",
      explanation:
        "From the falsity of P it does not follow that Q is false. Q may be true for independent reasons. In the table, take P false and Q true: the conditional holds, the second premise holds, yet the conclusion is false. This exhibits a concrete countermodel. Hence the argument is invalid.",
    },
    {
      label: "Proof by Cases (valid)",
      premises: ["P ∨ Q", "P → R", "Q → R"],
      conclusion: "R",
      explanation:
        "Proof by cases evaluates each disjunct and carries truth to a common result. If either P or Q holds, and each leads to R, then R must hold. The semantics of ∨ and → ensure preservation of truth across both branches. The table contains no row with all premises true and R false. Therefore valid.",
    },
    {
      label: "De Morgan Instance (valid)",
      premises: ["¬(P ∨ Q)"],
      conclusion: "¬P ∧ ¬Q",
      explanation:
        "De Morgan’s law says that denying a disjunction is equivalent to conjoining the denials. If neither P nor Q is allowed, then both ¬P and ¬Q are true. The truth-table shows exact matching truth values for these forms. This is a semantic equivalence used constantly in derivations. Thus valid.",
    },
  ];

  const [selectedExampleIdx, setSelectedExampleIdx] = React.useState<number>(0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 no-print">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">Load example:</label>
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            value={selectedExampleIdx}
            onChange={(e) => {
              const idx = Number(e.target.value);
              const ex = examples[idx];
              if (!ex) return;
              setPremises(ex.premises);
              setConclusion(ex.conclusion);
              setSelectedExampleIdx(idx);
            }}
          >
            {examples.map((ex, i) => (
              <option key={i} value={i}>
                {ex.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap items-center no-print">
          <Button onClick={onRun}>Check validity</Button>
          <Button variant="secondary" onClick={() => setShowDetailed((s) => !s)}>
            {showDetailed ? "Hide" : "Show"} detailed table
          </Button>
          <div className="relative">
            <ExportMenu onCSV={exportCSV} onLaTeX={exportLaTeX} onPDF={exportPDF} />
          </div>
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

      <div className="flex gap-3 no-print" />

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 rounded-md bg-red-50 dark:bg-red-950/30 p-3">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {selectedExampleIdx !== null && examples[selectedExampleIdx] && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/60 dark:bg-zinc-900/30">
              <div className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line">
                {examples[selectedExampleIdx].explanation}
              </div>
            </div>
          )}
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
                          Premises under your assignment: {premVals.map((b) => (b ? "T" : "F")).join(", ")}
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
                      <tr key={idx} className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 cursor-pointer" onClick={() => setSelectedRow(idx)}>
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

          {showDetailed && result?.pAsts && (
            <div className="overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              {(() => {
                const dt = buildDetailedTruthTable(result.pAsts, result.cAst);
                return (
                  <table className="min-w-[960px] w-full text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/40">
                      <tr>
                        {dt.columns.map((c) => (
                          <th key={c} className="px-2 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dt.rows.map((row, idx) => (
                        <tr key={idx} className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 cursor-pointer" onClick={() => setSelectedRow(idx)}>
                          {dt.columns.map((c) => (
                            <td key={c} className="px-2 py-2">
                              {row.valuesByColumn[c] ? "T" : "F"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}

          {showDetailed && result?.table && selectedRow !== null && (
            <DetailedDerivation
              rowIndex={selectedRow}
              valuation={result.table.rows[selectedRow].valuation}
              pAsts={result.pAsts}
              cAst={result.cAst}
            />
          )}
        </div>
      )}
    </div>
  );
}

function DetailedDerivation({
  rowIndex,
  valuation,
  pAsts,
  cAst,
}: {
  rowIndex: number;
  valuation: Record<string, boolean>;
  pAsts: AstNode[];
  cAst: AstNode;
}) {
  const { premiseSteps, conclusionSteps } = deriveArgumentSteps(pAsts, cAst, valuation);
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Derivation for row {rowIndex + 1}</div>
      <div className="mt-3 grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Premises</div>
          {premiseSteps.map((steps, i) => (
            <ol key={i} className="mt-1 list-decimal list-inside text-sm">
              <div className="text-xs text-zinc-500">Premise {i + 1}: {formatAst(pAsts[i])}</div>
              {steps.map((s, j) => (
                <li key={j} className="mt-1">
                  <span className="font-mono">{s.label}</span> = {s.value ? "T" : "F"} <span className="opacity-70">[{s.rule}]</span>
                  {s.details ? <div className="text-xs opacity-70">{s.details}</div> : null}
                </li>
              ))}
            </ol>
          ))}
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Conclusion</div>
          <ol className="mt-1 list-decimal list-inside text-sm">
            <div className="text-xs text-zinc-500">{formatAst(cAst)}</div>
            {conclusionSteps.map((s, j) => (
              <li key={j} className="mt-1">
                <span className="font-mono">{s.label}</span> = {s.value ? "T" : "F"} <span className="opacity-70">[{s.rule}]</span>
                {s.details ? <div className="text-xs opacity-70">{s.details}</div> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function ExportMenu({ onCSV, onLaTeX, onPDF }: { onCSV: () => void; onLaTeX: () => void; onPDF: () => void }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest?.("[data-export-menu]")) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);
  return (
    <div className="inline-block" data-export-menu>
      <Button variant="outline" onClick={() => setOpen((v) => !v)}>
        <span className="mr-1">Export</span>
        <span aria-hidden>▾</span>
      </Button>
      {open && (
        <div className="absolute mt-2 w-40 rounded-lg border border-zinc-200 bg-white p-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <button className="w-full text-left px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onCSV}>CSV</button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onLaTeX}>LaTeX</button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onPDF}>PDF</button>
        </div>
      )}
    </div>
  );
}


