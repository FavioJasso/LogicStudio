## Logic Studio

Logic Studio is a web-based toolkit for learning and teaching formal logic. It is built with [Next.js](https://nextjs.org) and designed for classrooms, tutoring labs, and self-study.

### Mission
Empower instructors and students to focus on reasoning, not rote mechanics. Logic Studio streamlines tasks that are time-consuming on the board—like constructing truth tables or checking syllogisms—so classes can spend more time on interpretation and proof strategy. This includes supporting instructors who often construct logic tables by hand on a whiteboard and can get tired; Logic Studio reduces fatigue, speeds up feedback, and preserves the clarity of step-by-step work for teaching.

### Current Features
- Propositional logic helpers: input well-formed formulas and visualize evaluations
- Auto-generated truth tables with subformula columns; click a row to see step-by-step derivations
- Export dropdown (CSV / LaTeX / PDF) for handouts and archives
- Projector mode and Large-text accessibility toggle; print-friendly styles
- Syllogism checker: validate categorical syllogisms and common forms
- Keyboard support with keyboard shortcuts. 

---

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Start editing the app by modifying `src/app/page.tsx`. The page auto-updates as you edit.

---

## Using Logic Studio (Overview)
- Propositional Checker (`src/components/PropositionalChecker.tsx`): enter formulas to evaluate and compare.
- Syllogism Checker (`src/components/SyllogismChecker.tsx`): test syllogistic forms and get quick validity feedback.

---

## Roadmap for Academic Use

- [Shipped] Auto-generated truth tables and step-by-step derivations for classroom display
- [Shipped] Projector-friendly theme and large-text mode; print styles
- Assignment mode with rubrics, partial credit, and auto-grading for mechanical steps
- [Shipped] Export to PDF/LaTeX/CSV for handouts, archives, and LMS uploads
- Item banks with randomization and multiple versions to reduce sharing/cheating
- Class analytics: common errors, time-on-task, and learning outcomes alignment

### For Students
- Guided “show me the next legal step” proofs with hints and misconceptions coaching
- Practice sets with spaced repetition; mastery goals and progress tracking
- Side-by-side comparisons of equivalent forms; syntax highlighting for scopes
- Shareable links to solutions and collaborative study rooms

### Pedagogy and Assessment
- Configurable logic systems (connectives, truth values, quantifiers, symbol sets)
- Support for natural deduction, semantic tableaux, and Venn/Carroll diagrams
- Validity/consistency/counterexample generators with minimal countermodels
- Explanation-first feedback: summarize why a derivation works or fails

### Accessibility and Inclusivity
- Full keyboard navigation, screen-reader semantics, and ARIA labels
- Dyslexia-friendly fonts and color-independent cues
- Localized UI copy; right-to-left language support
- Offline-first PWA so classrooms without stable internet can still run activities

### Integrations and Deployment
- LMS integrations (LTI 1.3, Canvas, Moodle, Blackboard) for rostering and grade return
- SSO (Google, Microsoft) and privacy-first analytics (no third-party trackers)
- Cloud and on-prem deployment options; configurable data retention

### Quality and Reliability
- Comprehensive test suite for logic engines (unit and property-based tests)
- Deterministic evaluation and clear error messages for malformed formulas
- Versioned problem sets and reproducible random seeds for fairness

If you are an educator: please open an issue describing your context (course level, topics, constraints). Real classroom feedback will drive priorities.

---

## Contributing
Contributions are welcome—especially improvements to the logic engines, accessibility, and pedagogy. Please:
1. Fork the repo and create a feature branch
2. Add tests where relevant
3. Open a pull request describing the educational impact of your change

---

## Learn More
- [Next.js Documentation](https://nextjs.org/docs) — framework features and API
- [Learn Next.js](https://nextjs.org/learn) — interactive tutorial

Deployment is straightforward with platforms like [Vercel](https://vercel.com). See the [Next.js deployment guide](https://nextjs.org/docs/app/building-your-application/deploying) for details.
