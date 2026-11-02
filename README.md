# Proofs, Detangled

An interactive, general guide to reading, planning and writing mathematical proofs. All explanations and demos are original; each page ends with further reading from standard textbooks (Hammack's *Book of Proof*, Velleman's free web book *How To Prove It with Lean*, Sundstrom, Solow, Pólya and others).

## Structure

The guide has five parts. Each part has an overview page and several short pages.

1. **Purpose** — why we need proofs (patterns lie) and why we need a mathematical language (English is ambiguous).
2. **Tools** — connectives, truth tables, variables and sets, set operations, conditionals and biconditionals, quantifiers, quantifier equivalences, power sets, arbitrary unions and intersections, functions.
3. **Techniques** — direct proof, contrapositive, contradiction, arbitrary objects (∀), witnesses (∃), conjunctions and biconditionals, cases, existence and uniqueness, counterexamples, induction, strong induction and well-ordering, the pigeonhole principle. Each is shown on small examples.
4. **Examples** — complete proofs that combine several tools and techniques: divisibility, Mersenne numbers, infinitely many primes, √2 is irrational, a set identity, power sets of intersections, a sum by induction, Cantor's theorem, and a limit by ε–δ.
5. **Craft** — how to read a proof, how to write one, common mistakes (find the broken line), and strategies for when you're stuck (small cases, working backwards, invariants).

## Interaction

Shared components live in `src/app.js` and are driven entirely by markup:

- `.scrolly` — sticky stage beside scrolling steps; each `.step[data-key]` lights stage elements whose `data-on` lists that key.
- `.stepper` — click-through reveal; children with `data-at="n"` appear at step n, `data-until="n"` hides them after step n.
- `.quiz` — multiple choice; the right answer has `data-ok`, any option can carry `data-why`.
- `.ttgen[data-f="P → Q; ¬Q → ¬P"]` — truth table for one or more formulas.
- `.ttlab` — live truth-table comparison with two `input.formula` fields.
- `.engine` — interactive proof engine, driven by a JSON spec inside the element. Each step is one move (∀ intro, assume, name an ∃ given, witness, contradiction, …) plus how it changes the givens and goal. Readers can *watch* the proof, *drive* it by picking each move from the shape of the goal, change the numbers (every given and goal is checked live), type their own witness (tested on many cases, with a counterexample when it fails), and tap any proof line to rewind to it. The spec format is documented at the top of the engine code in `src/app.js`.
- Scroll reveals, a reading-progress bar, and ← / → keys to turn pages.

## Lean

`src/lean/<page>.lean` holds the same proof in Lean 4 with Mathlib. `build.py` puts it on that page wherever `{{lean}}` appears, with an “Open in the Lean playground” link (live.lean-lang.org, code passed in the URL). These files have not been checked by Lean in CI; open each one in the playground after editing it.

Page-specific demos are inline scripts at the bottom of each page in `src/pages/`.

## Building

```bash
python3 build.py
```

This wraps every page in `src/pages/` with the shared header, page rail, pager and footer, and writes the result to `site/`. Open `site/index.html` in a browser. Page order and titles are defined in `PARTS` at the top of `build.py`.
