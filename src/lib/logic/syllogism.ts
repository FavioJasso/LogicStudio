export type Quantifier = "A" | "E" | "I" | "O";

export type CategoricalStatement = {
  quantifier: Quantifier;
  subject: string;
  predicate: string;
};

export type Syllogism = {
  premise1: CategoricalStatement;
  premise2: CategoricalStatement;
  conclusion: CategoricalStatement;
};

export type MoodFigure = {
  mood: string; // e.g., AAA, EIO
  figure: 1 | 2 | 3 | 4 | null;
  isSyllogism: boolean;
  terms: { S: string; P: string; M: string } | null;
};

export type SetAssignment = {
  universe: string[];
  S: Set<string>;
  P: Set<string>;
  M: Set<string>;
};

function normalizeTerm(term: string): string {
  return term.trim().toLowerCase();
}

function distinct<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function analyzeMoodFigure(s: Syllogism): MoodFigure {
  const c = s.conclusion;
  const S = normalizeTerm(c.subject);
  const P = normalizeTerm(c.predicate);
  const allTerms = [
    normalizeTerm(s.premise1.subject),
    normalizeTerm(s.premise1.predicate),
    normalizeTerm(s.premise2.subject),
    normalizeTerm(s.premise2.predicate),
    S,
    P,
  ];
  const uniq = distinct(allTerms);
  if (uniq.length !== 3) {
    return { mood: `${s.premise1.quantifier}${s.premise2.quantifier}${c.quantifier}`, figure: null, isSyllogism: false, terms: null };
  }
  // Middle term M appears in both premises and not in conclusion
  const premiseTerms = [
    normalizeTerm(s.premise1.subject),
    normalizeTerm(s.premise1.predicate),
    normalizeTerm(s.premise2.subject),
    normalizeTerm(s.premise2.predicate),
  ];
  let M: string | null = null;
  for (const t of uniq) {
    const countInPremises = premiseTerms.filter((x) => x === t).length;
    const inConclusion = t === S || t === P;
    if (countInPremises >= 2 && !inConclusion) {
      M = t;
      break;
    }
  }
  if (!M) {
    return { mood: `${s.premise1.quantifier}${s.premise2.quantifier}${c.quantifier}`, figure: null, isSyllogism: false, terms: null };
  }

  // Determine figure by position of M in premises
  const p1S = normalizeTerm(s.premise1.subject);
  const p1P = normalizeTerm(s.premise1.predicate);
  const p2S = normalizeTerm(s.premise2.subject);
  const p2P = normalizeTerm(s.premise2.predicate);

  let figure: 1 | 2 | 3 | 4 | null = null;
  const mInP1 = p1S === M ? "S" : p1P === M ? "P" : null; // subject or predicate
  const mInP2 = p2S === M ? "S" : p2P === M ? "P" : null;
  if (mInP1 && mInP2) {
    // Figures:
    // 1: M–P; S–M  => P1: M is subject; P2: M is predicate
    // 2: P–M; S–M  => P1: M is predicate; P2: M is predicate
    // 3: M–P; M–S  => P1: M is subject; P2: M is subject
    // 4: P–M; M–S  => P1: M is predicate; P2: M is subject
    if (mInP1 === "S" && mInP2 === "P") figure = 1;
    else if (mInP1 === "P" && mInP2 === "P") figure = 2;
    else if (mInP1 === "S" && mInP2 === "S") figure = 3;
    else if (mInP1 === "P" && mInP2 === "S") figure = 4;
  }

  const mood = `${s.premise1.quantifier}${s.premise2.quantifier}${c.quantifier}`;
  return { mood, figure, isSyllogism: figure !== null, terms: { S, P, M } };
}

function evalStatement(q: Quantifier, subject: Set<string>, predicate: Set<string>): boolean {
  switch (q) {
    case "A": // All S are P => S ⊆ P
      for (const x of subject) if (!predicate.has(x)) return false;
      return true;
    case "E": // No S are P => S ∩ P = ∅
      for (const x of subject) if (predicate.has(x)) return false;
      return true;
    case "I": // Some S are P => S ∩ P ≠ ∅
      for (const x of subject) if (predicate.has(x)) return true;
      return false;
    case "O": // Some S are not P => S ∩ P^c ≠ ∅
      for (const x of subject) if (!predicate.has(x)) return true;
      return false;
  }
}

function* enumerateSetAssignments(universe: string[]): Generator<{ S: Set<string>; P: Set<string>; M: Set<string> }> {
  const total = 1 << universe.length;
  for (let sMask = 0; sMask < total; sMask++) {
    const S = new Set<string>();
    for (let i = 0; i < universe.length; i++) if ((sMask >> i) & 1) S.add(universe[i]);
    for (let pMask = 0; pMask < total; pMask++) {
      const P = new Set<string>();
      for (let i = 0; i < universe.length; i++) if ((pMask >> i) & 1) P.add(universe[i]);
      for (let mMask = 0; mMask < total; mMask++) {
        const M = new Set<string>();
        for (let i = 0; i < universe.length; i++) if ((mMask >> i) & 1) M.add(universe[i]);
        yield { S, P, M };
      }
    }
  }
}

export type SyllogismResult = {
  isValid: boolean;
  moodFigure: MoodFigure;
  namedForm?: string | null;
  counterModel?: SetAssignment | null;
};

const NAMED_FORMS: Record<string, string> = {
  // figure 1
  "AAA-1": "Barbara",
  "EAE-1": "Celarent",
  "AII-1": "Darii",
  "EIO-1": "Ferio",
  // figure 2
  "EAE-2": "Cesare",
  "AEE-2": "Camestres",
  "EIO-2": "Festino",
  "AOO-2": "Baroco",
  // figure 3
  "IAI-3": "Disamis",
  "AII-3": "Datisi",
  "EIO-3": "Ferison",
  "OAO-3": "Bocardo",
  "AAI-3": "Darapti",
  // figure 4
  "AEE-4": "Camenes",
  "IAI-4": "Dimaris",
  "EIO-4": "Fesapo",
  "AEO-4": "Bramantip",
};

export function checkSyllogism(s: Syllogism): SyllogismResult {
  const mf = analyzeMoodFigure(s);
  const key = mf.figure ? `${mf.mood}-${mf.figure}` : null;
  const namedForm = key ? NAMED_FORMS[key] ?? null : null;

  // Brute-force validity check over small universes
  // We map real terms to S,P,M by the conclusion roles
  if (!mf.isSyllogism || !mf.terms) {
    // Not a proper categorical syllogism structure
    return { isValid: false, moodFigure: mf, namedForm: null, counterModel: null };
  }
  const { S, P, M } = mf.terms;

  const mapTerm = (t: string, assignment: { S: Set<string>; P: Set<string>; M: Set<string> }): Set<string> => {
    const key = normalizeTerm(t);
    if (key === S) return assignment.S;
    if (key === P) return assignment.P;
    return assignment.M; // must be M otherwise
  };

  const universes = [
    ["a"],
    ["a", "b"],
    ["a", "b", "c"],
  ];

  for (const U of universes) {
    for (const asn of enumerateSetAssignments(U)) {
      const p1 = evalStatement(
        s.premise1.quantifier,
        mapTerm(s.premise1.subject, asn),
        mapTerm(s.premise1.predicate, asn)
      );
      const p2 = evalStatement(
        s.premise2.quantifier,
        mapTerm(s.premise2.subject, asn),
        mapTerm(s.premise2.predicate, asn)
      );
      if (p1 && p2) {
        const concHolds = evalStatement(
          s.conclusion.quantifier,
          mapTerm(s.conclusion.subject, asn),
          mapTerm(s.conclusion.predicate, asn)
        );
        if (!concHolds) {
          return {
            isValid: false,
            moodFigure: mf,
            namedForm,
            counterModel: { universe: U, S: asn.S, P: asn.P, M: asn.M },
          };
        }
      }
    }
  }

  return { isValid: true, moodFigure: mf, namedForm, counterModel: null };
}


