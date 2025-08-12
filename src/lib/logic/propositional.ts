export type TokenType =
  | "LPAREN"
  | "RPAREN"
  | "NOT"
  | "AND"
  | "OR"
  | "IMPLIES"
  | "IFF"
  | "IDENT";

export type Token = {
  type: TokenType;
  value?: string;
};

export type AstNode =
  | { type: "Var"; name: string }
  | { type: "Not"; expr: AstNode }
  | { type: "And"; left: AstNode; right: AstNode }
  | { type: "Or"; left: AstNode; right: AstNode }
  | { type: "Implies"; left: AstNode; right: AstNode }
  | { type: "Iff"; left: AstNode; right: AstNode };

const OP_CHARS = new Set([
  "(",
  ")",
  "¬",
  "~",
  "!",
  "∧",
  "&",
  "^",
  "∨",
  "|",
  "→",
  "↔",
  "-",
  "<",
]);

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === "\n" || ch === "\t") {
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "LPAREN" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "RPAREN" });
      i++;
      continue;
    }
    if (ch === "¬" || ch === "~" || ch === "!") {
      tokens.push({ type: "NOT" });
      i++;
      continue;
    }
    if (ch === "∧" || ch === "&" || ch === "^") {
      tokens.push({ type: "AND" });
      i++;
      continue;
    }
    if (ch === "∨" || ch === "|") {
      tokens.push({ type: "OR" });
      i++;
      continue;
    }
    if (ch === "→") {
      tokens.push({ type: "IMPLIES" });
      i++;
      continue;
    }
    if (ch === "↔") {
      tokens.push({ type: "IFF" });
      i++;
      continue;
    }
    // multi-char operators -> and <->
    if (ch === "-" && input[i + 1] === ">") {
      tokens.push({ type: "IMPLIES" });
      i += 2;
      continue;
    }
    if (ch === "<" && input.slice(i, i + 3) === "<->") {
      tokens.push({ type: "IFF" });
      i += 3;
      continue;
    }
    // identifier
    if (!OP_CHARS.has(ch)) {
      const start = i;
      while (
        i < input.length &&
        !OP_CHARS.has(input[i]) &&
        input[i] !== " " &&
        input[i] !== "\n" &&
        input[i] !== "\t"
      ) {
        i++;
      }
      const ident = input.slice(start, i);
      tokens.push({ type: "IDENT", value: ident });
      continue;
    }
    throw new Error(`Unexpected character '${ch}' at position ${i}`);
  }
  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  private peek(): Token | null {
    return this.tokens[this.pos] ?? null;
  }

  private consume(): Token {
    const tok = this.tokens[this.pos];
    if (!tok) throw new Error("Unexpected end of input");
    this.pos++;
    return tok;
  }

  parseExpression(): AstNode {
    return this.parseIff();
  }

  // Lowest precedence: IFF
  private parseIff(): AstNode {
    let node = this.parseImplies();
    while (this.peek()?.type === "IFF") {
      this.consume();
      const right = this.parseImplies();
      node = { type: "Iff", left: node, right };
    }
    return node;
  }

  // Next: IMPLIES (right-associative)
  private parseImplies(): AstNode {
    let node = this.parseOr();
    while (this.peek()?.type === "IMPLIES") {
      this.consume();
      const right = this.parseOr();
      node = { type: "Implies", left: node, right };
    }
    return node;
  }

  private parseOr(): AstNode {
    let node = this.parseAnd();
    while (this.peek()?.type === "OR") {
      this.consume();
      const right = this.parseAnd();
      node = { type: "Or", left: node, right };
    }
    return node;
  }

  private parseAnd(): AstNode {
    let node = this.parseUnary();
    while (this.peek()?.type === "AND") {
      this.consume();
      const right = this.parseUnary();
      node = { type: "And", left: node, right };
    }
    return node;
  }

  private parseUnary(): AstNode {
    const tok = this.peek();
    if (!tok) throw new Error("Unexpected end of input");
    if (tok.type === "NOT") {
      this.consume();
      const expr = this.parseUnary();
      return { type: "Not", expr };
    }
    if (tok.type === "LPAREN") {
      this.consume();
      const expr = this.parseExpression();
      const rp = this.consume();
      if (rp.type !== "RPAREN") throw new Error("Expected ')'");
      return expr;
    }
    if (tok.type === "IDENT") {
      this.consume();
      return { type: "Var", name: tok.value as string };
    }
    throw new Error(`Unexpected token ${tok.type}`);
  }
}

export function parse(input: string): AstNode {
  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  const ast = parser.parseExpression();
  if (parser["pos"] !== tokens.length) {
    throw new Error("Unexpected extra tokens at end of expression");
  }
  return ast;
}

export function collectVariables(ast: AstNode): string[] {
  const vars = new Set<string>();
  function walk(node: AstNode): void {
    switch (node.type) {
      case "Var":
        vars.add(node.name);
        break;
      case "Not":
        walk(node.expr);
        break;
      case "And":
      case "Or":
      case "Implies":
      case "Iff":
        walk(node.left);
        walk(node.right);
        break;
      default:
        break;
    }
  }
  walk(ast);
  return Array.from(vars);
}

export type Valuation = Record<string, boolean>;

export function evaluate(ast: AstNode, v: Valuation): boolean {
  switch (ast.type) {
    case "Var":
      return Boolean(v[ast.name]);
    case "Not":
      return !evaluate(ast.expr, v);
    case "And":
      return evaluate(ast.left, v) && evaluate(ast.right, v);
    case "Or":
      return evaluate(ast.left, v) || evaluate(ast.right, v);
    case "Implies": {
      const l = evaluate(ast.left, v);
      const r = evaluate(ast.right, v);
      return !l || r;
    }
    case "Iff": {
      const l = evaluate(ast.left, v);
      const r = evaluate(ast.right, v);
      return l === r;
    }
    default:
      return false;
  }
}

export function* enumerateValuations(variables: string[]): Generator<Valuation> {
  const n = variables.length;
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    const v: Valuation = {};
    for (let i = 0; i < n; i++) {
      v[variables[i]] = Boolean((mask >> (n - i - 1)) & 1);
    }
    yield v;
  }
}

export type ValidityResult = {
  isValid: boolean;
  counterModel: Valuation | null;
};

export function checkValidity(
  premises: AstNode[],
  conclusion: AstNode,
  options?: { maxVariables?: number }
): ValidityResult {
  const allVarsSet = new Set<string>();
  for (const p of premises) collectVariables(p).forEach((v) => allVarsSet.add(v));
  collectVariables(conclusion).forEach((v) => allVarsSet.add(v));
  const variables = Array.from(allVarsSet);

  const maxVariables = options?.maxVariables ?? 10;
  if (variables.length > maxVariables) {
    // Fallback: simple randomized search for countermodel if too many variables
    const attempts = 2000;
    for (let i = 0; i < attempts; i++) {
      const val: Valuation = {};
      for (const v of variables) {
        val[v] = Math.random() < 0.5;
      }
      const premisesTrue = premises.every((p) => evaluate(p, val));
      const conclusionFalse = !evaluate(conclusion, val);
      if (premisesTrue && conclusionFalse) {
        return { isValid: false, counterModel: val };
      }
    }
    // Not found: assume probably valid (but not proven)
    return { isValid: true, counterModel: null };
  }

  for (const v of enumerateValuations(variables)) {
    const premisesTrue = premises.every((p) => evaluate(p, v));
    const conclusionFalse = !evaluate(conclusion, v);
    if (premisesTrue && conclusionFalse) {
      return { isValid: false, counterModel: v };
    }
  }
  return { isValid: true, counterModel: null };
}

export type TruthTableRow = {
  valuation: Valuation;
  premisesValues: boolean[];
  conclusionValue: boolean;
};

export function buildTruthTable(
  premises: AstNode[],
  conclusion: AstNode
): { variables: string[]; rows: TruthTableRow[] } {
  const allVarsSet = new Set<string>();
  for (const p of premises) collectVariables(p).forEach((v) => allVarsSet.add(v));
  collectVariables(conclusion).forEach((v) => allVarsSet.add(v));
  const variables = Array.from(allVarsSet);

  const rows: TruthTableRow[] = [];
  for (const v of enumerateValuations(variables)) {
    const premisesValues = premises.map((p) => evaluate(p, v));
    const conclusionValue = evaluate(conclusion, v);
    rows.push({ valuation: { ...v }, premisesValues, conclusionValue });
  }
  return { variables, rows };
}

// --- Derivation and detailed tables ---

function stringify(ast: AstNode): string {
  switch (ast.type) {
    case "Var":
      return ast.name;
    case "Not":
      return `(¬${stringify(ast.expr)})`;
    case "And":
      return `(${stringify(ast.left)} ∧ ${stringify(ast.right)})`;
    case "Or":
      return `(${stringify(ast.left)} ∨ ${stringify(ast.right)})`;
    case "Implies":
      return `(${stringify(ast.left)} → ${stringify(ast.right)})`;
    case "Iff":
      return `(${stringify(ast.left)} ↔ ${stringify(ast.right)})`;
  }
}

function depthOf(node: AstNode): number {
  switch (node.type) {
    case "Var":
      return 0;
    case "Not":
      return 1 + depthOf(node.expr);
    case "And":
    case "Or":
    case "Implies":
    case "Iff":
      return 1 + Math.max(depthOf(node.left), depthOf(node.right));
  }
}

export function formatAst(ast: AstNode): string {
  return stringify(ast);
}

export type Subformula = { label: string; ast: AstNode; depth: number };

export function listSubformulas(ast: AstNode): Subformula[] {
  const map = new Map<string, Subformula>();
  function visit(node: AstNode): void {
    const label = stringify(node);
    if (!map.has(label)) {
      map.set(label, { label, ast: node, depth: depthOf(node) });
    }
    switch (node.type) {
      case "Var":
        return;
      case "Not":
        visit(node.expr);
        return;
      case "And":
      case "Or":
      case "Implies":
      case "Iff":
        visit(node.left);
        visit(node.right);
        return;
    }
  }
  visit(ast);
  return Array.from(map.values()).sort((a, b) => a.depth - b.depth);
}

export function listSubformulasForAll(forms: AstNode[]): Subformula[] {
  const map = new Map<string, Subformula>();
  for (const f of forms) {
    for (const s of listSubformulas(f)) {
      if (!map.has(s.label)) map.set(s.label, s);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.depth - b.depth || a.label.localeCompare(b.label));
}

export type DetailedTruthTableRow = {
  valuation: Valuation;
  valuesByColumn: Record<string, boolean>;
};

export function buildDetailedTruthTable(
  premises: AstNode[],
  conclusion: AstNode
): {
  variables: string[];
  columns: string[]; // subformula labels
  rows: DetailedTruthTableRow[];
} {
  const allVarsSet = new Set<string>();
  for (const p of premises) collectVariables(p).forEach((v) => allVarsSet.add(v));
  collectVariables(conclusion).forEach((v) => allVarsSet.add(v));
  const variables = Array.from(allVarsSet);

  const allForms: AstNode[] = [...premises, conclusion];
  const subs = listSubformulasForAll(allForms);
  const columns = subs.map((s) => s.label);

  const rows: DetailedTruthTableRow[] = [];
  for (const v of enumerateValuations(variables)) {
    const valuesByColumn: Record<string, boolean> = {};
    for (const s of subs) {
      valuesByColumn[s.label] = evaluate(s.ast, v);
    }
    rows.push({ valuation: { ...v }, valuesByColumn });
  }
  return { variables, columns, rows };
}

export type DerivationStep = {
  label: string; // subformula as string
  value: boolean;
  rule: string;
  details?: string;
};

function deriveEval(node: AstNode, v: Valuation, steps: DerivationStep[]): boolean {
  switch (node.type) {
    case "Var": {
      const val = Boolean(v[node.name]);
      steps.push({ label: stringify(node), value: val, rule: "VAR" });
      return val;
    }
    case "Not": {
      const inner = deriveEval(node.expr, v, steps);
      const res = !inner;
      steps.push({
        label: stringify(node),
        value: res,
        rule: "NOT",
        details: `¬${stringify(node.expr)} because ${inner ? "T" : "F"} → ${res ? "T" : "F"}`,
      });
      return res;
    }
    case "And": {
      const l = deriveEval(node.left, v, steps);
      const r = deriveEval(node.right, v, steps);
      const res = l && r;
      steps.push({
        label: stringify(node),
        value: res,
        rule: "AND",
        details: `${stringify(node.left)} ∧ ${stringify(node.right)}: ${l ? "T" : "F"} ∧ ${r ? "T" : "F"} → ${res ? "T" : "F"}`,
      });
      return res;
    }
    case "Or": {
      const l = deriveEval(node.left, v, steps);
      const r = deriveEval(node.right, v, steps);
      const res = l || r;
      steps.push({
        label: stringify(node),
        value: res,
        rule: "OR",
        details: `${stringify(node.left)} ∨ ${stringify(node.right)}: ${l ? "T" : "F"} ∨ ${r ? "T" : "F"} → ${res ? "T" : "F"}`,
      });
      return res;
    }
    case "Implies": {
      const l = deriveEval(node.left, v, steps);
      const r = deriveEval(node.right, v, steps);
      const res = !l || r;
      steps.push({
        label: stringify(node),
        value: res,
        rule: "IMPLIES",
        details: `${stringify(node.left)} → ${stringify(node.right)} is (¬${stringify(node.left)}) ∨ ${stringify(node.right)}: ${(!l) ? "T" : "F"} ∨ ${r ? "T" : "F"} → ${res ? "T" : "F"}`,
      });
      return res;
    }
    case "Iff": {
      const l = deriveEval(node.left, v, steps);
      const r = deriveEval(node.right, v, steps);
      const res = l === r;
      steps.push({
        label: stringify(node),
        value: res,
        rule: "IFF",
        details: `${stringify(node.left)} ↔ ${stringify(node.right)}: ${l ? "T" : "F"} ↔ ${r ? "T" : "F"} → ${res ? "T" : "F"}`,
      });
      return res;
    }
  }
}

export function deriveSteps(ast: AstNode, v: Valuation): DerivationStep[] {
  const steps: DerivationStep[] = [];
  deriveEval(ast, v, steps);
  return steps;
}

export function deriveArgumentSteps(
  premises: AstNode[],
  conclusion: AstNode,
  v: Valuation
): { premiseSteps: DerivationStep[][]; conclusionSteps: DerivationStep[] } {
  const premiseSteps = premises.map((p) => deriveSteps(p, v));
  const conclusionSteps = deriveSteps(conclusion, v);
  return { premiseSteps, conclusionSteps };
}

export type ParseResult = {
  premises: AstNode[];
  conclusion: AstNode;
};

export function parseArgument(
  premisesInputs: string[],
  conclusionInput: string
): ParseResult {
  const premises = premisesInputs.map((s, i) => {
    if (!s.trim()) throw new Error(`Premise ${i + 1} is empty`);
    return parse(s);
  });
  if (!conclusionInput.trim()) throw new Error("Conclusion is empty");
  const conclusion = parse(conclusionInput);
  return { premises, conclusion };
}

export function prettyPrintValuation(v: Valuation): string {
  return Object.keys(v)
    .sort()
    .map((k) => `${k}=${v[k] ? "T" : "F"}`)
    .join("  ");
}


