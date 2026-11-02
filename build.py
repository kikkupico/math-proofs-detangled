#!/usr/bin/env python3
"""Builds the site from src/ into site/.

Each file in src/pages/ holds the body of one page. This script wraps it in the shared
header (part tabs + page rail), the prev/next pager and the footer.

Inside a page, these placeholders are filled in:
  {{eyebrow}}   "Part 2 · Tools · 3 of 10"
  {{title}}     the page title
  {{tagline}}   the page tagline
Anything after <!-- FOOTNOTES --> becomes footnotes in the footer.

Output:
  site/               full HTML pages (site/index.html is the start)
  site/_artifact.html the start page without <html>/<head>/<body>, for publishing as an Artifact
"""
from pathlib import Path
import html, json, re, shutil
from urllib.parse import quote

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "site"

# (slug, short label, title, tagline, further reading: see READING below)
PARTS = [
    {
        "key": "purpose", "no": 1, "name": "Purpose", "blurb": "Why proofs exist, and why they need their own language.",
        "glyph": "?",
        "pages": [
            ("why-proofs", "Why proofs?", "Why we need proofs", "Because patterns lie.", "V:Introduction|L"),
            ("why-language", "Why a language?", "Why we need a mathematical language", "Because English is slippery.", "H:Logic|V:§1.1"),
        ],
    },
    {
        "key": "tools", "no": 2, "name": "Tools", "blurb": "The symbols and ideas every proof is written in.",
        "glyph": "∧",
        "pages": [
            ("connectives", "Connectives", "Connectives", "Not, and, or: the atoms of reasoning.", "H:Logic|V:§1.1"),
            ("truth-tables", "Truth tables", "Truth Tables", "Check any formula by brute force.", "H:Logic|V:§1.2"),
            ("sets", "Variables & sets", "Variables and Sets", "Sets are statements you can hold.", "H:Sets|V:§1.3"),
            ("set-operations", "Set operations", "Set Operations", "∩, ∪ and ∖ are ∧, ∨ and “and not”.", "H:Sets|V:§1.4"),
            ("conditionals", "Conditionals", "Conditionals and Biconditionals", "If, only if, if and only if.", "H:Logic|V:§1.5"),
            ("quantifiers", "Quantifiers", "Quantifiers", "All. Some. And why order matters.", "H:Logic|V:§2.1"),
            ("quantifier-laws", "Quantifier laws", "Quantifier Equivalences", "Negate anything, one step at a time.", "H:Logic|V:§2.2"),
            ("power-sets", "Power sets", "Power Sets", "Every subset, collected into one set.", "H:Sets|V:§2.3"),
            ("families", "Unions & intersections", "Arbitrary Unions and Intersections", "⋃ and ⋂ over whole families of sets.", "H:Sets|V:§2.3"),
            ("functions", "Functions", "Functions", "One input, exactly one output.", "H:Functions|V:Chapter 5"),
        ],
    },
    {
        "key": "techniques", "no": 3, "name": "Techniques", "blurb": "The standard moves, each shown on a small example.",
        "glyph": "⊢",
        "pages": [
            ("direct", "Direct proof", "Direct Proof", "Assume the hypothesis. Walk to the conclusion.", "H:Direct Proof|V:§3.1|So"),
            ("contrapositive", "Contrapositive", "Proof by Contrapositive", "Prove the mirror image instead.", "H:Contrapositive Proof|V:§3.2"),
            ("contradiction", "Contradiction", "Proof by Contradiction", "Assume the opposite and watch it break.", "H:Proof by Contradiction|V:§3.2"),
            ("for-all", "Arbitrary objects", "Proving “For All”", "Let x be arbitrary.", "H:Direct Proof|V:§3.3|So"),
            ("exists", "Witnesses", "Proving “There Exists”", "Find one, show it works.", "H:Proving Non-Conditional Statements|V:§3.3"),
            ("iff", "And & iff", "Conjunctions and Biconditionals", "Two halves, proved one at a time.", "H:Proving Non-Conditional Statements|V:§3.4"),
            ("cases", "Cases", "Proof by Cases", "Split the world. Cover every piece.", "H:Direct Proof|V:§3.5"),
            ("uniqueness", "Uniqueness", "Existence and Uniqueness", "At least one, and at most one.", "H:Proving Non-Conditional Statements|V:§3.6"),
            ("counterexample", "Counterexamples", "Disproof by Counterexample", "One failure sinks a “for all”.", "H:Disproof|V:§2.2"),
            ("induction", "Induction", "Proof by Induction", "Infinitely many cases in two steps.", "H:Mathematical Induction|V:§6.1"),
            ("strong-induction", "Strong induction", "Strong Induction and Well-Ordering", "Lean on every smaller case, not just the last one.", "H:Mathematical Induction|V:§6.4"),
            ("pigeonhole", "Pigeonhole", "The Pigeonhole Principle", "More pigeons than holes: two must share.", "H:Counting|E"),
        ],
    },
    {
        "key": "examples", "no": 4, "name": "Examples", "blurb": "Complete proofs where tools and techniques work together.",
        "glyph": "∎",
        "pages": [
            ("divisibility", "Divisibility", "Divisibility Is Transitive", "Three nested blocks, one clean proof.", "H:Direct Proof|V:§3.3"),
            ("mersenne", "Mersenne numbers", "Composite n Gives Composite 2ⁿ − 1", "A proof that builds the factors.", "V:§3.7"),
            ("infinite-primes", "Infinite primes", "There Are Infinitely Many Primes", "Euclid's argument, move by move.", "H:Proof by Contradiction|V:§3.7"),
            ("sqrt2", "√2 is irrational", "√2 Is Irrational", "A contradiction with a lemma inside.", "H:Proof by Contradiction|V:§6.4"),
            ("set-identity", "A set identity", "A ∖ (B ∪ C) = (A ∖ B) ∩ (A ∖ C)", "De Morgan's law, wearing set clothes.", "H:Proofs Involving Sets|V:§1.4"),
            ("power-set-meet", "Power sets meet", "𝒫(A ∩ B) = 𝒫(A) ∩ 𝒫(B)", "Subsets of subsets, chased element by element.", "H:Proofs Involving Sets|V:§2.3"),
            ("sum-of-powers", "Sum of powers", "1 + 2 + 4 + ⋯ + 2ⁿ = 2ⁿ⁺¹ − 1", "Induction, start to finish.", "H:Mathematical Induction|V:§6.1"),
            ("cantor", "Cantor's theorem", "No Set Is as Big as Its Power Set", "The diagonal trick, made precise.", "H:Cardinality of Sets|V:§7.2"),
            ("epsilon-delta", "A limit by ε–δ", "A Limit, by ε–δ", "Every challenge ε gets an answer δ.", "H:Proofs in Calculus"),
        ],
    },
    {
        "key": "craft", "no": 5, "name": "Craft", "blurb": "Reading, writing and debugging proofs, and what to do when you're stuck.",
        "glyph": "✎",
        "pages": [
            ("reading-proofs", "Reading proofs", "How to Read a Proof", "Recover the moves the author left out.", "So|Ho"),
            ("writing-proofs", "Writing proofs", "How to Write a Proof", "Sentences, not symbol soup.", "H:Direct Proof|S"),
            ("mistakes", "Common mistakes", "Common Mistakes", "Find the line that breaks.", "Ho|S"),
            ("stuck", "When you're stuck", "When You're Stuck", "Small cases, working backwards, invariants.", "P|E"),
        ],
    },
]

HOME = ("index", "Home", "Proofs, Detangled", "Learn to read, plan and write mathematical proofs.", "")

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=IBM+Plex+Mono:wght@400;500&amp;'
         'family=IBM+Plex+Sans:wght@400;500;600&amp;'
         'family=STIX+Two+Text:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&amp;display=swap">')

CREDIT = ("An independent, general guide to proofs. “Further reading” names chapters by title where possible, "
          "since page and chapter numbers change between editions; section numbers for Velleman's <i>How to Prove It</i> refer to its 2nd edition.")

# Further reading. Each page lists codes separated by "|": "H:<chapter title>" or "V:<section>", or a bare code for a whole book.
READING = {
    "H": "Hammack, <i>Book of Proof</i> (free online)",
    "V": "Velleman, <i>How to Prove It</i>",
    "S": "Sundstrom, <i>Mathematical Reasoning: Writing and Proof</i> (free online)",
    "So": "Solow, <i>How to Read and Do Proofs</i>",
    "P": "Pólya, <i>How to Solve It</i>",
    "Ho": "Houston, <i>How to Think Like a Mathematician</i>",
    "L": "Lakatos, <i>Proofs and Refutations</i>",
    "E": "Engel, <i>Problem-Solving Strategies</i>",
}


def reading(codes):
    out = []
    for c in codes.split("|"):
        book, _, where = c.partition(":")
        where = f", “{where}”" if book == "H" else f", {where}" if where else ""
        out.append(READING[book] + where)
    return "; ".join(out)


def build_order():
    """Flat reading order: home, then each part's hub followed by its pages."""
    seq = [dict(slug=HOME[0], label=HOME[1], title=HOME[2], tagline=HOME[3], book="", part=None, idx=None)]
    for p in PARTS:
        seq.append(dict(slug=p["key"], label=p["name"], title=f"Part {p['no']}: {p['name']}", tagline=p["blurb"],
                        book="", part=p, idx=0))
        for i, (slug, label, title, tagline, book) in enumerate(p["pages"], 1):
            seq.append(dict(slug=slug, label=label, title=title, tagline=tagline, book=book, part=p, idx=i))
    return seq


SEQ = build_order()


def topbar(cur):
    cur_key = cur["part"]["key"] if cur["part"] else None
    tabs = []
    for p in PARTS:
        here = ' aria-current="true"' if p["key"] == cur_key else ""
        tabs.append(f'<a class="tab t-{p["key"]}" href="{p["key"]}.html"{here}><span class="n">{p["no"]}</span><span class="l">{p["name"]}</span></a>')
    return ('<header class="top"><div class="wrap top-in">'
            '<a class="mark" href="index.html" aria-label="Proofs, Detangled: home"><span class="qed">∎</span><span class="wm">Proofs, Detangled</span></a>'
            f'<nav class="tabs" aria-label="Parts">{"".join(tabs)}</nav>'
            '</div><div class="progress" aria-hidden="true"><span></span></div></header>')


def rail(cur):
    p = cur["part"]
    if not p:
        return ""
    items = [f'<a class="r-hub" href="{p["key"]}.html"{" aria-current=\"page\"" if cur["idx"] == 0 else ""}>Overview</a>']
    for i, (slug, label, *_rest) in enumerate(p["pages"], 1):
        here = ' aria-current="page"' if cur["slug"] == slug else ""
        items.append(f'<a href="{slug}.html"{here}><span class="i">{i}</span>{html.escape(label)}</a>')
    return f'<nav class="rail" aria-label="{p["name"]} pages"><div class="wrap rail-in">{"".join(items)}</div></nav>'


def eyebrow(cur):
    p = cur["part"]
    if not p:
        return ""
    if cur["idx"] == 0:
        return f'Part {p["no"]} · {len(p["pages"])} pages'
    return f'Part {p["no"]} · {p["name"]} · {cur["idx"]} of {len(p["pages"])}'


def pager(i):
    out = []
    if i > 0:
        p = SEQ[i - 1]
        where = f'Part {p["part"]["no"]} · {p["part"]["name"]}' if p["part"] else "Start"
        out.append(f'<a class="pg prev" href="{p["slug"]}.html" data-key="prev"><span class="d">← Previous · {where}</span><span class="t">{p["title"]}</span></a>')
    else:
        out.append('<span></span>')
    if i + 1 < len(SEQ):
        n = SEQ[i + 1]
        where = f'Part {n["part"]["no"]} · {n["part"]["name"]}'
        out.append(f'<a class="pg next" href="{n["slug"]}.html" data-key="next"><span class="d">Next · {where} →</span><span class="t">{n["title"]}</span><span class="s">{n["tagline"]}</span></a>')
    else:
        out.append('<a class="pg next" href="index.html" data-key="next"><span class="d">Finished →</span><span class="t">Back to the start</span></a>')
    return f'<nav class="pager wrap" aria-label="Keep going">{"".join(out)}</nav>'


def footer(cur, notes):
    deeper = ""
    if cur["book"]:
        deeper = f'<p class="deeper"><b>Further reading:</b> {reading(cur["book"])}.</p>'
    ol = f"<ol class='notes'>{notes}</ol>" if notes.strip() else ""
    cols = []
    for p in PARTS:
        links = "".join(f'<a href="{s}.html">{html.escape(lbl)}</a>' for s, lbl, *_ in p["pages"])
        cols.append(f'<div><a class="fh t-{p["key"]}" href="{p["key"]}.html">{p["no"]} · {p["name"]}</a>{links}</div>')
    return (f'<footer class="foot"><div class="wrap">{deeper}{ol}'
            f'<nav class="fmap" aria-label="All pages">{"".join(cols)}</nav>'
            f'<p class="credit">{CREDIT}</p></div></footer>')


LEAN_PLAYGROUND = "https://live.lean-lang.org/#code="
HTPI = "https://djvelleman.github.io/HTPIwL/"


def lean_panel(slug):
    """'Try it in Lean' panel for src/lean/<slug>.lean: the code, plus a link that opens it in the Lean playground."""
    f = SRC / "lean" / f"{slug}.lean"
    if not f.exists():
        return ""
    code = f.read_text().rstrip() + "\n"
    shown = html.escape(code)
    shown = re.sub(r"/-!?[\s\S]*?-/", lambda m: f'<span class="c">{m.group(0)}</span>', shown)
    shown = re.sub(r"(?m)--.*$", lambda m: f'<span class="c">{m.group(0)}</span>', shown)
    shown = re.sub(r"\b(import|example|by)\b(?![^<]*</span>)", r'<span class="kw">\1</span>', shown)
    url = LEAN_PLAYGROUND + quote(code, safe="")
    return ('<div class="lean"><div class="lean-top"><span class="lab-title">Try it in Lean</span>'
            f'<a class="tbtn primary" href="{html.escape(url)}" target="_blank" rel="noopener">Open in the Lean playground ↗</a></div>'
            '<p class="note">Lean is a proof assistant: it accepts a proof only if every step checks. This is the same proof, '
            'move for move, using the Mathlib library. The playground runs it in your browser tab; hover over any line to see the givens and goal at that point. '
            f'For a whole course in this style, see Velleman\'s free book <a href="{HTPI}" target="_blank" rel="noopener"><i>How To Prove It with Lean</i></a>.</p>'
            f'<details><summary>Show the Lean code</summary><pre><code>{shown}</code></pre></details></div>')


def check_engines(slug, body):
    """Fail the build if an engine spec isn't valid JSON or is missing a field."""
    for m in re.finditer(r'<div class="engine"><script type="application/json">([\s\S]*?)</script>', body):
        spec = json.loads(m.group(1))
        for k, st in enumerate(spec["steps"]):
            for key in ("m", "k", "h", "say"):
                if key not in st and not (key == "m" and st.get("gift")):
                    raise SystemExit(f"{slug}: engine step {k + 1} is missing '{key}'")


def page(i, body, notes, full):
    cur = SEQ[i]
    body = (body.replace("{{eyebrow}}", eyebrow(cur))
                .replace("{{lean}}", lean_panel(cur["slug"]))
                .replace("{{title}}", cur["title"])
                .replace("{{tagline}}", cur["tagline"]))
    doc_title = cur["title"] if cur["slug"] == "index" else f'{cur["title"]} · Proofs, Detangled'
    cls = f'part-{cur["part"]["key"]}' if cur["part"] else "part-home"
    head = (f'<title>{html.escape(doc_title)}</title>\n'
            '<meta name="claude:viewport-fit-sides" content="cover">\n'
            f'<meta name="description" content="{html.escape(cur["tagline"])}">\n'
            f'{FONTS}\n<link rel="stylesheet" href="style.css">\n')
    content = (f'<div class="page {cls}">\n{topbar(cur)}\n{rail(cur)}\n'
               f'<main>\n{body}\n{pager(i)}\n</main>\n{footer(cur, notes)}\n</div>\n'
               '<script src="app.js"></script>\n')
    if not full:
        return head + content
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            f'{head}</head>\n<body>\n{content}</body>\n</html>\n')


def main():
    if OUT.exists():
        for f in OUT.glob("*.html"):
            f.unlink()
    OUT.mkdir(exist_ok=True)
    for f in ("style.css", "app.js"):
        shutil.copy(SRC / f, OUT / f)
    missing = []
    for i, cur in enumerate(SEQ):
        src = SRC / "pages" / f'{cur["slug"]}.html'
        if not src.exists():
            missing.append(cur["slug"])
            continue
        body, _, notes = src.read_text().partition("<!-- FOOTNOTES -->")
        check_engines(cur["slug"], body)
        (OUT / f'{cur["slug"]}.html').write_text(page(i, body, notes, True))
        if cur["slug"] == "index":
            (OUT / "_artifact.html").write_text(page(i, body, notes, False))
    print(f"built {len(SEQ) - len(missing)} pages")
    if missing:
        print("missing:", ", ".join(missing))


if __name__ == "__main__":
    main()
