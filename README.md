# Proofs, Detangled

An interactive guide to reading, planning and writing mathematical proofs, built as a companion to Daniel J. Velleman's *How to Prove It: A Structured Approach* (2nd edition).

## Structure

The guide has four parts. Each part has an overview page and several short pages.

1. **Purpose** — why we need proofs (patterns lie) and why we need a mathematical language (English is ambiguous).
2. **Tools** — connectives, truth tables, variables and sets, set operations, conditionals and biconditionals, quantifiers, quantifier equivalences, power sets, arbitrary unions and intersections, functions.
3. **Techniques** — direct proof, contrapositive, contradiction, arbitrary objects (∀), witnesses (∃), conjunctions and biconditionals, cases, existence and uniqueness, counterexamples, induction. Each is shown on small examples.
4. **Examples** — complete proofs that combine several tools and techniques: divisibility, Mersenne numbers, infinitely many primes, √2 is irrational, a set identity, power sets of intersections, a sum by induction, and Cantor's theorem.

## Interaction

Shared components live in `src/app.js` and are driven entirely by markup:

- `.scrolly` — sticky stage beside scrolling steps; each `.step[data-key]` lights stage elements whose `data-on` lists that key.
- `.stepper` — click-through reveal; children with `data-at="n"` appear at step n, `data-until="n"` hides them after step n.
- `.quiz` — multiple choice; the right answer has `data-ok`, any option can carry `data-why`.
- `.ttgen[data-f="P → Q; ¬Q → ¬P"]` — truth table for one or more formulas.
- `.ttlab` — live truth-table comparison with two `input.formula` fields.
- Scroll reveals, a reading-progress bar, and ← / → keys to turn pages.

Page-specific demos are inline scripts at the bottom of each page in `src/pages/`.

## Building

```bash
python3 build.py
```

This wraps every page in `src/pages/` with the shared header, page rail, pager and footer, and writes the result to `site/`. Open `site/index.html` in a browser. Page order and titles are defined in `PARTS` at the top of `build.py`.
