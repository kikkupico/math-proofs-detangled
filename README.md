# Math Proofs Detangled: How to Prove It Speedrun

An interactive study companion and speedrun based on Daniel J. Velleman's classic, *How to Prove It: A Structured Approach* (2nd edition).

## Overview

Proofs aren't magic tricks—they are structured logic. Just like programs are built by nesting standard control structures (`if-else`, loops), proofs are built by nesting standard deductive blocks based on logical forms ($\forall$, $\exists$, $\rightarrow$, etc.).

This project provides an interactive overview covering:
- **Intro**: Why prove anything?
- **Sentential Logic**: Connectives, truth tables, and equivalence.
- **Quantifiers**: $\forall$, $\exists$, uniqueness.
- **Proofs**: Direct proof, contrapositive, contradiction, cases, existence.
- **Relations**: Equivalence relations, partial orders, partitions.
- **Functions**: Injections, surjections, bijections, inverses.
- **Induction**: Base case, induction step, strong induction.
- **Infinite Sets**: Equinumerosity, countable vs. uncountable infinities, Cantor's theorem.
- **Proof Toolkit**: Quick-reference moves, symbols, and mappings.

## Building the Site

To rebuild the static HTML pages in `site/` from `src/`:

```bash
python3 build.py
```

Open `site/index.html` in any browser to explore.
