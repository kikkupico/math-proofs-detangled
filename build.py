#!/usr/bin/env python3
"""Builds the site: wraps each page body in src/pages/ with the shared nav and footer.

Output:
  site/               full HTML pages you can open locally (site/index.html is the start)
  site/_artifact.html the start page without <html>/<head>/<body>, for publishing as an Artifact
"""
from pathlib import Path
import html, shutil

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "site"

# Reading order. (slug, nav label, page title, tagline, local-nav links)
PAGES = [
    ("index", "Home", "How to Prove It Speedrun", "Start here", []),
    ("intro", "Intro", "Introduction", "Why prove anything?", [("#highlights", "Key ideas"), ("#labs", "Try it"), ("#book", "In the book")]),
    ("logic", "Logic", "Sentential Logic", "The grammar of certainty", [("#highlights", "Key ideas"), ("#labs", "Try it"), ("#book", "In the book")]),
    ("quantifiers", "Quantifiers", "Quantificational Logic", "All. Some. Exactly one.", [("#highlights", "Key ideas"), ("#labs", "Try it"), ("#book", "In the book")]),
    ("proofs", "Proofs", "Proofs", "The main event", [("#highlights", "Key ideas"), ("#labs", "Try it"), ("#strategies", "Strategies"), ("#book", "In the book")]),
    ("relations", "Relations", "Relations", "Connected, precisely", [("#highlights", "Key ideas"), ("#labs", "Try it"), ("#book", "In the book")]),
    ("functions", "Functions", "Functions", "One input, one output", [("#highlights", "Key ideas"), ("#labs", "Try it"), ("#book", "In the book")]),
    ("induction", "Induction", "Mathematical Induction", "Infinitely many cases, two steps", [("#highlights", "Key ideas"), ("#labs", "Try it"), ("#book", "In the book")]),
    ("infinity", "Infinity", "Infinite Sets", "Some infinities are bigger", [("#highlights", "Key ideas"), ("#labs", "Try it"), ("#book", "In the book")]),
    ("toolkit", "Toolkit", "Proof Toolkit", "Every technique on one page", [("#moves", "Find a move"), ("#notation", "Symbols"), ("#map", "Every section")]),
]

FONT = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=STIX+Two+Text:ital,wght@0,400;0,600;1,400&amp;display=swap">'

CREDIT = (
    "An unofficial study companion to Daniel J. Velleman, <i>How to Prove It: A Structured Approach</i>, "
    "2nd edition (Cambridge University Press, 2006). Page numbers (p.) are the printed page numbers of that edition. "
    "Statements are quoted or paraphrased for study; the book has the complete proofs, the scratch work behind them, and the exercises."
)


def gnav(slug):
    items = ['<li><a class="brand" href="index.html" aria-label="Home">&#8718;</a></li>']
    for s, label, *_ in PAGES[1:]:
        cur = ' aria-current="page"' if s == slug else ""
        items.append(f'<li><a href="{s}.html"{cur}>{label}</a></li>')
    return '<nav class="gnav" aria-label="Chapters"><ul>' + "".join(items) + "</ul></nav>"


def lnav(i):
    slug, _, title, _, links = PAGES[i]
    if slug == "index":
        title = "How to Prove It"
    secs = "".join(f'<a class="sec" href="{h}">{t}</a>' for h, t in links)
    if i + 1 < len(PAGES):
        nxt = PAGES[i + 1]
        btn = f'<a class="btn sm" href="{nxt[0]}.html">Next: {nxt[1]}</a>'
    else:
        btn = '<a class="btn sm" href="index.html">Back to start</a>'
    return (f'<div class="lnav"><div class="wrap"><a class="title" href="{slug}.html">{title}</a>'
            f'<nav aria-label="On this page">{secs}{btn}</nav></div></div>')


def prevnext(i):
    parts = []
    if i > 0:
        p = PAGES[i - 1]
        name = "Home" if p[0] == "index" else p[2]
        parts.append(f'<a class="prev" href="{p[0]}.html"><span class="dir">Previous</span><span class="nm">{name}</span><span class="tg">&#8249; {p[3]}</span></a>')
    if i + 1 < len(PAGES):
        n = PAGES[i + 1]
        parts.append(f'<a class="next" href="{n[0]}.html"><span class="dir">Next</span><span class="nm">{n[2]}</span><span class="tg">{n[3]} &#8250;</span></a>')
    return '<section class="band tight" aria-label="Keep going"><div class="wrap"><div class="pn">' + "".join(parts) + "</div></div></section>"


def footer(notes):
    dir_links = "".join(f'<a href="{s}.html">{t if s != "index" else "Home"}</a>' for s, _, t, *_ in PAGES)
    ol = f"<ol>{notes}</ol>" if notes.strip() else ""
    return (f'<footer class="foot"><div class="wrap">{ol}<p class="rule credit">{CREDIT}</p>'
            f'<nav class="dir" aria-label="All pages">{dir_links}</nav></div></footer>')


def page(i, body, notes, full):
    slug, _, title, tagline, _ = PAGES[i]
    doc_title = title if slug == "index" else f"{title} · How to Prove It Speedrun"
    head = (f'<title>{html.escape(doc_title)}</title>\n'
            '<meta name="claude:viewport-fit-sides" content="cover">\n'
            f'<meta name="description" content="{html.escape(tagline)}">\n'
            f'{FONT}\n<link rel="stylesheet" href="style.css">\n')
    content = (f'<div class="page ch-{"home" if slug == "index" else slug}">\n{gnav(slug)}\n{lnav(i)}\n'
               f'<main>\n{body}\n{prevnext(i)}\n</main>\n{footer(notes)}\n</div>\n'
               '<script src="app.js"></script>\n')
    if not full:
        return head + content
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            f'{head}</head>\n<body>\n{content}</body>\n</html>\n')


def main():
    OUT.mkdir(exist_ok=True)
    for f in ("style.css", "app.js"):
        shutil.copy(SRC / f, OUT / f)
    for i, (slug, *_) in enumerate(PAGES):
        src = SRC / "pages" / f"{slug}.html"
        if not src.exists():
            print("missing", src)
            continue
        raw = src.read_text()
        body, _, notes = raw.partition("<!-- FOOTNOTES -->")
        (OUT / f"{slug}.html").write_text(page(i, body, notes, True))
        if slug == "index":
            (OUT / "_artifact.html").write_text(page(i, body, notes, False))
        print("built", slug)


if __name__ == "__main__":
    main()
