/* Shared behaviour for every page.
   Components (all driven by markup, no per-page code needed):
     .rv                 auto-added; fades content in as it scrolls into view
     .scrolly            sticky stage + scrolling steps. Each .step[data-key] lights stage
                         elements whose data-on lists that key, and shows .frame[data-frame] matches
     .stepper            click-through reveal. Children with data-at="n" appear at step n;
                         data-until="n" hides them after step n
     .quiz               multiple choice. The right button has data-ok; any button may carry data-why
     .ttgen[data-f]      truth table for "formula; formula" (¬ ∧ ∨ → ↔, letters P Q R ...)
     .ttlab              live truth-table comparison with two input.formula fields
     .engine             interactive proof engine, driven by a JSON spec in a child
                         <script type="application/json">. See the ENGINE section below
   Also: reading-progress bar, and ← / → keys to turn pages. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- reading progress ---------- */
  var bar = document.querySelector(".progress span");
  if (bar) {
    var tick = false;
    var upd = function () {
      var h = doc.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, scrollY / h) : 0) + ")";
      tick = false;
    };
    addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ---------- scroll reveal ---------- */
  var revealSel = [
    "main .sec-head", "main .split > *", "main .cards > *", "main .toc > a", "main .parts4 > *",
    "main .quiz", "main .callout", "main .statement", "main .theorem", "main .sec > .wrap > .lab",
    "main .sec > .wrap > .proof", "main .ingredients > *", "main .pager > *"
  ].join(",");
  var toReveal = $$(revealSel).filter(function (el) { return !el.closest(".scrolly .stage") && !el.closest(".hero"); });
  if ("IntersectionObserver" in window && !reduce) {
    toReveal.forEach(function (el) {
      el.classList.add("rv");
      var p = el.parentElement, i = Array.prototype.indexOf.call(p.children, el);
      if (/cards|toc|parts4|ingredients|pager|split/.test(p.className)) el.style.setProperty("--d", (i % 4) * 0.08 + "s");
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    toReveal.forEach(function (el) { io.observe(el); });
  }

  /* ---------- scrollytelling ---------- */
  $$(".scrolly").forEach(function (root) {
    var steps = $$(".step", root);
    var lit = $$("[data-on]", root), frames = $$(".frame[data-frame]", root);
    function has(el, attr, key) { return (" " + el.getAttribute(attr) + " ").indexOf(" " + key + " ") >= 0; }
    function activate(step) {
      if (step.classList.contains("active")) return;
      steps.forEach(function (s) { s.classList.toggle("active", s === step); });
      var key = step.getAttribute("data-key");
      lit.forEach(function (el) { el.classList.toggle("lit", has(el, "data-on", key)); });
      if (frames.length) {
        var any = frames.some(function (f) { return has(f, "data-frame", key); });
        if (any) frames.forEach(function (f) { f.classList.toggle("on", has(f, "data-frame", key)); });
      }
      root.dispatchEvent(new CustomEvent("scrolly", { detail: { key: key } }));
    }
    if (steps.length) activate(steps[0]);
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) activate(e.target); });
    }, { rootMargin: "-48% 0px -48% 0px" });
    steps.forEach(function (s) { io.observe(s); });
  });

  /* ---------- stepper ---------- */
  $$(".stepper").forEach(function (root) {
    var items = $$("[data-at]", root).filter(function (el) { return el.closest(".stepper") === root; });
    var n = items.reduce(function (m, el) { return Math.max(m, +el.getAttribute("data-at")); }, 1);
    var barEl = root.querySelector(".stepper-bar");
    if (!barEl) { barEl = document.createElement("div"); barEl.className = "stepper-bar"; root.insertBefore(barEl, root.firstChild); }
    barEl.innerHTML = '<div class="row"><button type="button" class="tbtn" data-act="back" aria-label="Previous step">←</button>' +
      '<button type="button" class="tbtn primary" data-act="next">Next step →</button>' +
      '<button type="button" class="tbtn" data-act="reset">Restart</button></div>' +
      '<div class="row"><span class="dots" aria-hidden="true">' + new Array(n + 1).join("<i></i>") + '</span><span class="count" aria-live="polite"></span></div>';
    var back = barEl.querySelector('[data-act="back"]'), next = barEl.querySelector('[data-act="next"]');
    var dots = $$(".dots i", barEl), count = barEl.querySelector(".count");
    var label = root.getAttribute("data-done") || "Done ∎";
    var cur = 1;
    function show(k, animate) {
      cur = Math.max(1, Math.min(n, k));
      items.forEach(function (el) {
        var at = +el.getAttribute("data-at"), until = el.hasAttribute("data-until") ? +el.getAttribute("data-until") : Infinity;
        var on = at <= cur && cur <= until;
        el.classList.toggle("off", !on);
        el.classList.remove("now");
        if (on && at === cur && animate) { void el.offsetWidth; el.classList.add("now"); }
      });
      dots.forEach(function (d, i) { d.classList.toggle("on", i < cur); d.classList.toggle("cur", i === cur - 1); });
      count.textContent = "Step " + cur + " of " + n;
      back.disabled = cur === 1;
      next.disabled = cur === n;
      next.textContent = cur === n ? label : "Next step →";
      root.dispatchEvent(new CustomEvent("step", { detail: { step: cur } }));
    }
    barEl.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var a = b.getAttribute("data-act");
      if (a === "next") show(cur + 1, true); else if (a === "back") show(cur - 1, false); else show(1, true);
    });
    show(1, false);
  });

  /* ---------- quiz ---------- */
  $$(".quiz").forEach(function (q) {
    var fb = q.querySelector(".fb");
    if (!fb) { fb = document.createElement("p"); fb.className = "fb"; fb.setAttribute("aria-live", "polite"); q.appendChild(fb); }
    q.addEventListener("click", function (e) {
      var b = e.target.closest(".opts button"); if (!b) return;
      var ok = b.hasAttribute("data-ok");
      b.classList.remove("wrong"); void b.offsetWidth;
      b.classList.add(ok ? "right" : "wrong");
      var why = b.getAttribute("data-why") || (ok ? q.getAttribute("data-why") : "") || "";
      fb.innerHTML = (ok ? '<b style="color:var(--good)">Yes.</b> ' : '<b style="color:var(--bad)">Not quite.</b> ') + why;
    });
  });

  /* ---------- formula parser for truth tables ---------- */
  function parse(src) {
    var toks = [], i = 0, s = src.replace(/<->|<=>/g, "↔").replace(/->|=>/g, "→").replace(/[~!]/g, "¬").replace(/[&^]/g, "∧").replace(/\|/g, "∨");
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if ("¬∧∨→↔()".indexOf(c) >= 0) toks.push(c);
      else if (/[A-Z]/.test(c)) toks.push({ v: c });
      else throw new Error("I don't recognise “" + c + "”.");
      i++;
    }
    var p = 0;
    function peek() { return toks[p]; }
    function eat(t) { if (toks[p] === t) { p++; return true; } return false; }
    function atom() {
      var t = toks[p];
      if (t === undefined) throw new Error("The formula ends too early.");
      if (t === "(") { p++; var e = iff(); if (!eat(")")) throw new Error("A “(” is never closed."); return e; }
      if (typeof t === "object") { p++; return function (env) { return env[t.v]; }; }
      throw new Error("Unexpected “" + t + "”.");
    }
    function not() { if (eat("¬")) { var a = not(); return function (env) { return !a(env); }; } return atom(); }
    function and() { var a = not(); while (eat("∧")) { a = (function (l, r) { return function (env) { return l(env) && r(env); }; })(a, not()); } return a; }
    function or() { var a = and(); while (eat("∨")) { a = (function (l, r) { return function (env) { return l(env) || r(env); }; })(a, and()); } return a; }
    function imp() { var a = or(); if (eat("→")) { var b = imp(); return function (env) { return !a(env) || b(env); }; } return a; }
    function iff() { var a = imp(); while (eat("↔")) { a = (function (l, r) { return function (env) { return l(env) === r(env); }; })(a, imp()); } return a; }
    var f = iff();
    if (p < toks.length) throw new Error("Unexpected “" + (typeof peek() === "object" ? peek().v : peek()) + "”.");
    var vars = []; toks.forEach(function (t) { if (typeof t === "object" && vars.indexOf(t.v) < 0) vars.push(t.v); });
    return { f: f, vars: vars, text: s };
  }
  function pretty(s) { return s.replace(/([A-Z])/g, "<i>$1</i>").replace(/\s*([∧∨→↔])\s*/g, " $1 "); }
  function table(forms) {
    var vars = [];
    forms.forEach(function (f) { f.vars.forEach(function (v) { if (vars.indexOf(v) < 0) vars.push(v); }); });

    var rows = 1 << vars.length, h = "<tr>", diff = 0, colT = forms.map(function () { return 0; });
    vars.forEach(function (v) { h += "<th><i>" + v + "</i></th>"; });
    forms.forEach(function (f, k) { h += '<th class="res">' + pretty(f.text) + "</th>"; });
    h += "</tr>";
    for (var r = 0; r < rows; r++) {
      var env = {};
      vars.forEach(function (v, k) { env[v] = !((r >> (vars.length - 1 - k)) & 1); });
      var vals = forms.map(function (f) { return f.f(env); });
      vals.forEach(function (v, k) { if (v) colT[k]++; });
      var mis = forms.length === 2 && vals[0] !== vals[1];
      if (mis) diff++;
      h += "<tr" + (mis ? ' class="hit"' : "") + ">";
      vars.forEach(function (v) { h += '<td class="' + (env[v] ? "T\">T" : "F\">F") + "</td>"; });
      vals.forEach(function (v) { h += '<td class="res ' + (v ? "T\">T" : "F\">F") + "</td>"; });
      h += "</tr>";
    }
    return { html: '<table class="tt">' + h + "</table>", diff: diff, rows: rows, colT: colT };
  }
  window.ProofsTT = { parse: parse, table: table };

  $$(".ttgen[data-f]").forEach(function (el) {
    try {
      var forms = el.getAttribute("data-f").split(";").map(function (s) { return parse(s.trim()); });
      el.innerHTML = '<div class="scroll-x">' + table(forms).html + "</div>";
    } catch (err) { el.textContent = err.message; }
  });

  $$(".ttlab").forEach(function (lab) {
    var ins = $$("input.formula", lab), out = lab.querySelector(".tt-out"), verdict = lab.querySelector(".tt-verdict"), note = lab.querySelector(".tt-note");
    function run() {
      try {
        var forms = ins.map(function (i) { return parse(i.value); });
        var t = table(forms);
        out.innerHTML = '<div class="scroll-x">' + t.html + "</div>";
        if (forms.length === 2) {
          var same = t.diff === 0;
          verdict.className = "chip tt-verdict " + (same ? "yes" : "no");
          verdict.textContent = same ? "Equivalent" : "Not equivalent";
          note.textContent = same ? "The columns agree in every row, so either formula can replace the other anywhere in a proof."
            : "The highlighted rows disagree (" + t.diff + " of " + t.rows + "). One disagreeing row is enough.";
        } else {
          var c = t.colT[0];
          verdict.className = "chip tt-verdict" + (c === t.rows ? " yes" : c === 0 ? " no" : "");
          verdict.textContent = c === t.rows ? "Tautology" : c === 0 ? "Contradiction" : "True in " + c + " of " + t.rows + " rows";
          note.textContent = "";
        }
      } catch (err) {
        verdict.className = "chip tt-verdict"; verdict.textContent = "Can't read that yet";
        note.textContent = err.message + " Use letters P, Q, R and the symbols ¬ ∧ ∨ → ↔ (or ~ & | -> <->).";
      }
    }
    ins.forEach(function (i) { i.addEventListener("input", run); });
    lab.addEventListener("click", function (e) {
      var b = e.target.closest("[data-set]"); if (!b) return;
      var parts = b.getAttribute("data-set").split("|");
      ins.forEach(function (inp, k) { if (parts[k] !== undefined) inp.value = parts[k]; });
      $$("[data-set]", lab).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      run();
    });
    lab.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ins]"); if (!b) return;
      var inp = lab.__last || ins[0], pos = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
      inp.value = inp.value.slice(0, pos) + b.getAttribute("data-ins") + inp.value.slice(inp.selectionEnd || pos);
      inp.focus(); inp.selectionStart = inp.selectionEnd = pos + 1; run();
    });
    ins.forEach(function (i) { i.addEventListener("focus", function () { lab.__last = i; }); });
    run();
  });


  /* ---------- proof engine ----------
     A proof is a list of steps. Each step is one move (∀ intro, assume, name an ∃ given, ...)
     and says how the givens and goal change. The engine replays steps 0..i to draw the
     board, so going back is free and every proof line links to the state it produced.
     Spec (JSON):
       goal, givens[]          starting goal and givens (html)
       vars[]                  {n, v, min, max}: numbers the reader can change
       defs{}                  derived values, e.g. {"b": "d*a"}, in order
       steps[] {
         m: move key or [keys], k: label, h: title, say: html, shape: "starts with ∀" (for hints)
         lines[]: [indent, html]       proof lines this step writes
         add[]: {id, t, num?, chk?}    new givens; num is a template like "{b} = {d}·{a}"
         drop[]: ids | "all"           givens used up
         goal: {t, num?, chk?} | null  the new goal; null means the goal is proved
         gift: true                    a creative step: no move to pick, just shown
         why{move: html}               tailored feedback for a wrong move
         wit: {v, def, test, show, over[], range[lo,hi], where, hint}   type a witness
         pick: {q, opts[{t, ok, why}]} choose among candidate witnesses
       }
     Expressions use a small exact-integer language: + − · ^ ! ( ), implicit products (2k, ed),
     = ≠ < ≤ > ≥, a | b (divides), & (and), and geo(r, n) = 1 + r + ⋯ + r^(n−1), fact, gcd, max, min,
     isprime (1 or 0), lpf (least prime factor), quo (integer quotient). Var labels: {n, label} shows label instead of the letter. */
  var MOVES = [
    ["intro", "Let … be arbitrary", "fits a goal that starts with ∀ (a ⊆ goal is a hidden ∀)"],
    ["assume", "Assume the hypothesis", "fits a goal of the form P → Q"],
    ["name", "Name an ∃ given", "fits when a given says ∃, or hides one (like a | b, or “not prime”)"],
    ["witness", "Choose a witness", "fits a goal that starts with ∃"],
    ["contra", "Assume the opposite", "fits a negative goal: ¬, “not”, “irrational”, “infinitely many”"],
    ["split", "Prove each half", "fits a goal with two halves: P ∧ Q, P ↔ Q, or A = B for sets"],
    ["cases", "Split into cases", "fits when a given is an “or”"],
    ["induct", "Use induction", "fits a goal of the form ∀n ∈ ℕ P(n)"],
    ["use", "Use a given or definition", "fits when you can unpack a definition, calculate, or apply a given or lemma"]
  ];
  var MOVE = {}; MOVES.forEach(function (m) { MOVE[m[0]] = { name: m[1], fits: m[2] }; });

  function Expr(src, env) {
    var s = String(src), i = 0;
    var FN = {
      geo: function (r, n) { var t = 0n, p = 1n; for (var j = 0n; j < n; j++) { t += p; p *= r; } return t; },
      fact: function (n) { var t = 1n; for (var j = 2n; j <= n; j++) t *= j; return t; },
      gcd: function (a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { var t = a % b; a = b; b = t; } return a; },
      max: function (a, b) { return a > b ? a : b; }, min: function (a, b) { return a < b ? a : b; },
      quo: function (a, b) { if (b === 0n) fail("Division by zero."); return a / b; },
      lpf: function (n) { if (n < 2n) return n; for (var d = 2n; d * d <= n; d++) if (n % d === 0n) return d; return n; },
      isprime: function (n) {
        if (n > 1n << 40n) fail("That number is too big to test here.");
        if (n < 2n) return 0n;
        for (var d = 2n; d * d <= n; d++) if (n % d === 0n) return 0n;
        return 1n;
      }
    };
    function ws() { while (i < s.length && /\s/.test(s[i])) i++; }
    function peek() { ws(); return s[i]; }
    function eat(str) { ws(); if (s.substr(i, str.length) === str) { i += str.length; return true; } return false; }
    function fail(msg) { throw new Error(msg); }
    function num(v) { if (typeof v !== "bigint") fail("Expected a number."); return v; }
    function atomStart() { var c = peek(); return c !== undefined && /[0-9A-Za-z(]/.test(c); }
    function atom() {
      ws(); var c = s[i];
      if (c === undefined) fail("The expression ends too early.");
      if (c === "(") { i++; var v = and(); if (!eat(")")) fail("A “(” is never closed."); return post(v); }
      if (/[0-9]/.test(c)) { var j = i; while (i < s.length && /[0-9]/.test(s[i])) i++; return post(BigInt(s.slice(j, i))); }
      if (/[A-Za-z]/.test(c)) {
        var k = i; while (i < s.length && /[A-Za-z]/.test(s[i])) i++;
        var id = s.slice(k, i);
        if (FN[id] && peek() === "(") {
          i++; var args = [sum()]; while (eat(",")) args.push(sum());
          if (!eat(")")) fail("A “(” is never closed.");
          return post(FN[id].apply(null, args.map(num)));
        }
        if (Object.prototype.hasOwnProperty.call(env, id)) return post(env[id]);
        var prod = 1n;
        for (var q = 0; q < id.length; q++) {
          if (!Object.prototype.hasOwnProperty.call(env, id[q])) fail("I don't know the letter “" + id[q] + "” here.");
          prod *= env[id[q]];
        }
        return post(prod);
      }
      fail("Unexpected “" + c + "”.");
    }
    function post(v) { while (s[i] === "!") { i++; v = FN.fact(num(v)); } return v; }
    function power() {
      var b = atom();
      if (eat("^")) { var e = unary(); if (e < 0n || e > 4096n) fail("That exponent is out of range."); return num(b) ** e; }
      return b;
    }
    function unary() { if (eat("-") || eat("−")) return -num(unary()); return power(); }
    function prod() {
      var v = unary();
      for (;;) {
        if (eat("*") || eat("·") || eat("×")) { v = num(v) * num(unary()); continue; }
        if (atomStart()) { v = num(v) * num(unary()); continue; }
        return v;
      }
    }
    function sum() {
      var v = prod();
      for (;;) {
        if (eat("+")) v = num(v) + num(prod());
        else if (peek() === "-" || peek() === "−") { i++; v = num(v) - num(prod()); }
        else return v;
      }
    }
    function rel() {
      var a = sum(), ops = ["<=", "≤", ">=", "≥", "!=", "≠", "==", "=", "<", ">", "|", "∣"];
      for (var k = 0; k < ops.length; k++) if (eat(ops[k])) {
        var b = sum(), o = ops[k];
        if (o === "|" || o === "∣") return a === 0n ? b === 0n : b % a === 0n;
        if (o === "<=" || o === "≤") return a <= b;
        if (o === ">=" || o === "≥") return a >= b;
        if (o === "!=" || o === "≠") return a !== b;
        if (o === "==" || o === "=") return a === b;
        return o === "<" ? a < b : a > b;
      }
      return a;
    }
    function and() { var v = rel(); while (eat("&")) { var w = rel(); v = v && w; } return v; }
    var out = and();
    ws(); if (i < s.length) fail("Unexpected “" + s[i] + "”.");
    return out;
  }
  window.ProofsExpr = Expr;

  function rng(seed) { return function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }

  $$(".engine").forEach(function (root) {
    var spec;
    try { spec = JSON.parse(root.querySelector('script[type="application/json"]').textContent); }
    catch (err) { root.textContent = "Proof engine: " + err.message; return; }
    var steps = spec.steps, N = steps.length;
    var vars = spec.vars || [], defs = spec.defs || {};
    var st = { i: 0, drive: false, pending: false, wit: {}, picked: {}, msg: "" };

    var hasNums = vars.length > 0;
    root.innerHTML =
      '<div class="eng-top"><div class="seg" role="group" aria-label="Mode">' +
      '<button type="button" data-mode="watch" aria-pressed="true">Watch</button>' +
      '<button type="button" data-mode="drive" aria-pressed="false">You drive</button></div>' +
      (hasNums ? '<div class="eng-nums"><span class="lab-title">Plug in numbers</span>' + vars.map(function (v) {
        return '<label class="ctl">' + (v.label || "<i>" + v.n + "</i>") + ' <input type="number" data-var="' + v.n + '" value="' + v.v + '"' +
          (v.min != null ? ' min="' + v.min + '"' : "") + (v.max != null ? ' max="' + v.max + '"' : "") + '></label>';
      }).join("") + '</div>' : "") + '</div>' +
      '<div class="eng-grid"><div class="board eng-board"><div><h4>Givens</h4><ul class="eng-givens"></ul></div>' +
      '<div><h4>Goal</h4><ul class="eng-goal"></ul></div></div>' +
      '<div class="eng-proof"><div class="lab-title">Proof so far</div><ol class="eng-lines"></ol></div></div>' +
      '<div class="eng-say" aria-live="polite"></div>' +
      '<div class="eng-bar"><div class="row"><button type="button" class="tbtn" data-act="back" aria-label="Previous step">←</button>' +
      '<button type="button" class="tbtn primary" data-act="next">Next move →</button>' +
      '<button type="button" class="tbtn" data-act="reset">Restart</button></div><span class="count"></span></div>';
    var q = function (sel) { return root.querySelector(sel); };

    function envNow() {
      var env = {};
      vars.forEach(function (v) {
        var inp = q('[data-var="' + v.n + '"]'), x = parseInt(inp && inp.value, 10);
        env[v.n] = BigInt(isNaN(x) ? v.v : x);
      });
      Object.keys(defs).forEach(function (k) { try { env[k] = Expr(defs[k], env); } catch (e) { } });
      for (var j = 0; j < st.i; j++) {
        var w = steps[j].wit; if (!w) continue;
        try { env[w.v] = Expr(st.wit[j] != null ? st.wit[j] : w.def, env); } catch (e) { try { env[w.v] = Expr(w.def, env); } catch (e2) { } }
      }
      return env;
    }
    function fill(tpl, env) {
      return tpl.replace(/\{([^}]+)\}/g, function (_, e) {
        try { var v = Expr(e, env); return typeof v === "bigint" ? String(v).replace("-", "−") : v ? "true" : "false"; } catch (err) { return "?"; }
      });
    }
    function chip(item, env, hyp) {
      if (!hasNums || (!item.num && !item.chk)) return "";
      var ok = null;
      if (item.chk) { try { ok = !!Expr(item.chk, env); } catch (e) { ok = null; } }
      var cls = ok === null ? "" : ok ? " yes" : hyp ? " warn" : " no";
      var mark = ok === null ? "" : ok ? "✓ " : "✗ ";
      return ' <span class="chip eng-num' + cls + '">' + mark + (item.num ? fill(item.num, env) : ok ? "true" : "false") + "</span>";
    }

    // Replay steps to get the state after k steps.
    function stateAt(k) {
      var givens = (spec.givens || []).map(function (g, n) { return typeof g === "string" ? { id: "g" + n, t: g } : g; });
      var goal = { t: spec.goal }, dropped = [], added = [];
      for (var j = 0; j < k; j++) {
        var s = steps[j];
        dropped = []; added = [];
        if (s.drop === "all") { dropped = givens.slice(); givens = []; }
        else if (s.drop) givens = givens.filter(function (g) { var d = s.drop.indexOf(g.id) >= 0; if (d) dropped.push(g); return !d; });
        (s.add || []).forEach(function (g) { givens.push(g); added.push(g.id); });
        if (s.goal !== undefined) goal = s.goal;
      }
      return { givens: givens, goal: goal, dropped: k ? dropped : [], added: added };
    }

    function drawBoard() {
      var env = envNow(), S = stateAt(st.i);
      var gl = S.givens.map(function (g) {
        return '<li class="' + (S.added.indexOf(g.id) >= 0 ? "new" : "") + '">' + g.t + chip(g, env, true) + "</li>";
      }).concat(S.dropped.map(function (g) { return '<li class="done">' + g.t + "</li>"; }));
      q(".eng-givens").innerHTML = gl.join("") || '<li class="muted small" style="font-family:var(--sans)">Nothing yet</li>';
      var broken = [];
      for (var b = 0; b < st.i; b++) if (steps[b].wit && st.wit[b] != null && st.wit[b] !== "" && !testWitness(b, st.wit[b]).ok) broken.push(b);
      q(".eng-goal").innerHTML = S.goal !== null ? "<li>" + S.goal.t + chip(S.goal, env, false) + "</li>"
        : broken.length ? '<li class="eng-broke">Not proved: the witness ' + steps[broken[0]].wit.v + ' = ' + esc(st.wit[broken[0]]) + ' fails. Tap the line where it was chosen to fix it.</li>'
        : '<li class="eng-qed">Proved ∎</li>';
      var lines = [];
      for (var j = 0; j < st.i; j++) (steps[j].lines || []).forEach(function (l) {
        var t = l[1];
        if (steps[j].wit) t = t.replace(/\{\{wit\}\}/g, st.wit[j] != null ? esc(st.wit[j]) : steps[j].wit.show || steps[j].wit.def);
        if (steps[j].pick) t = t.replace(/\{\{pick\}\}/g, steps[j].pick.opts[st.picked[j] != null ? st.picked[j] : okIndex(steps[j].pick)].t);
        lines.push('<li><button type="button" class="pl in' + l[0] + (j === st.i - 1 ? " lit" : "") + '" data-go="' + (j + 1) + '">' + t + "</button></li>");
      });
      q(".eng-lines").innerHTML = lines.join("") || '<li class="muted small">' + (st.drive ? "Pick the first move to start writing." : "Press Next move to start writing.") + "</li>";
      q(".eng-proof").classList.toggle("dim", st.i > 0);
      return env;
    }
    function render() {
      var env = drawBoard();
      var say = "";
      if (st.pending) say = askWitness(st.i);
      else if (st.drive && st.i < N) say = askMove(st.i);
      else if (st.i > 0) {
        var s = steps[st.i - 1];
        say = '<div class="eng-k"><span class="chip hot">' + s.k + "</span></div><h3>" + s.h + "</h3><p>" + s.say + "</p>" +
          (s.wit ? witBox(st.i - 1, env) : "") + (st.i === N ? '<p class="eng-done">Every goal is closed. Tap any line of the proof to see the state it left behind.</p>' : "");
      } else {
        say = '<h3>The goal</h3><p>' + (spec.intro || "Look at the goal's outermost shape. It decides the first move.") + "</p>";
      }
      if (st.msg) say = '<p class="eng-msg">' + st.msg + "</p>" + say;
      q(".eng-say").innerHTML = say;

      q('[data-act="back"]').disabled = st.i === 0 && !st.pending;
      var next = q('[data-act="next"]');
      next.hidden = st.drive && st.i < N && !(steps[st.i].gift);
      next.disabled = st.i === N || st.pending;
      next.textContent = st.i === N ? "Done ∎" : st.drive && steps[st.i].gift ? (steps[st.i].pick ? "Make the creative choice →" : "Show the idea →") : "Next move →";
      q(".count").textContent = "Move " + st.i + " of " + N;
      wireWitness();
    }
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function okIndex(p) { for (var k = 0; k < p.opts.length; k++) if (p.opts[k].ok) return k; return 0; }

    function askMove(k) {
      var s = steps[k];
      if (s.gift) return '<div class="eng-k"><span class="chip">Creative step</span></div><h3>No standard move here</h3><p>This step is the proof\'s one new idea, not a move you can read off the goal. Use the button below.</p>';
      return '<h3>Which move next?</h3><p class="muted">Look at the goal' + (s.shape ? ": it " + s.shape : "") + ". Pick the move that fits.</p>" +
        '<div class="eng-moves">' + MOVES.map(function (m) { return '<button type="button" class="tbtn" data-move="' + m[0] + '">' + m[1] + "</button>"; }).join("") + "</div>";
    }
    function askWitness(k) {
      var s = steps[k];
      if (s.pick) {
        return '<div class="eng-k"><span class="chip hot">' + s.k + "</span></div><h3>" + s.pick.q + '</h3><div class="eng-moves">' +
          s.pick.opts.map(function (o, n) { return '<button type="button" class="tbtn" data-pick="' + n + '">' + o.t + "</button>"; }).join("") + "</div>";
      }
      return '<div class="eng-k"><span class="chip hot">' + s.k + "</span></div><h3>Choose the witness</h3><p>" + (s.wit.hint || "") + "</p>" + witBox(k, envNow(), true);
    }
    function witBox(k, env, asking) {
      var w = steps[k].wit, val = st.wit[k] != null ? st.wit[k] : asking ? "" : w.show || w.def;
      return '<div class="eng-wit"><label class="ctl"><span class="mb"><i>' + w.v + '</i> =</span> <input type="text" class="formula" data-wit="' + k + '" value="' + esc(val) + '" autocomplete="off" spellcheck="false" placeholder="type an expression"></label>' +
        (asking ? '<div class="row"><button type="button" class="tbtn primary" data-act="try">Try it</button><button type="button" class="tbtn" data-act="show">Show me</button></div>' : "") +
        '<p class="eng-verdict" aria-live="polite"></p></div>';
    }
    function testWitness(k, src) {
      var w = steps[k].wit, r = rng(7 + k), lo = (w.range || [-9, 9])[0], hi = (w.range || [-9, 9])[1];
      var trials = [envNow()], tries = 0;
      while (trials.length < 60 && tries++ < 600) {
        var env = {};
        (w.over || vars.map(function (v) { return v.n; })).forEach(function (n) { env[n] = BigInt(lo + Math.floor(r() * (hi - lo + 1))); });
        Object.keys(defs).forEach(function (d) { try { env[d] = Expr(defs[d], env); } catch (e) { } });
        try { if (w.where && !Expr(w.where, env)) continue; } catch (e) { continue; }
        trials.push(env);
      }
      for (var t = 0; t < trials.length; t++) {
        var e2 = Object.assign({}, trials[t]);
        try { e2[w.v] = Expr(src, e2); } catch (err) { return { ok: false, msg: err.message + ' Use letters from the proof, numbers, + − · ^ and brackets.' }; }
        var ok; try { ok = Expr(w.test, e2); } catch (err) { ok = false; }
        if (!ok) {
          var at = (w.over || vars.map(function (v) { return v.n; })).map(function (n) { return "<i>" + n + "</i> = " + String(e2[n]).replace("-", "−"); }).join(", ");
          return { ok: false, msg: "Breaks when " + at + ": " + fill(w.check || w.test, e2) + "." };
        }
      }
      return { ok: true, msg: "Works for every case tried (" + trials.length + " sets of numbers)" + (w.note ? ". " + w.note : ".") };
    }
    function wireWitness() {
      var inp = q("[data-wit]"); if (!inp) return;
      var k = +inp.getAttribute("data-wit"), out = q(".eng-verdict");
      function check(commit) {
        var v = inp.value.trim();
        if (!v) { out.textContent = ""; return; }
        var r = testWitness(k, v);
        out.innerHTML = '<span class="chip ' + (r.ok ? "yes" : "no") + '">' + (r.ok ? "Works" : "Fails") + "</span> " + r.msg;
        if (!st.pending) { st.wit[k] = v; renderBoardOnly(); }
        else if (commit && r.ok) { st.wit[k] = v; st.pending = false; st.i = k + 1; st.msg = ""; render(); }
      }
      inp.addEventListener("input", function () { if (!st.pending) check(false); });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); check(true); } });
      root.__check = check;
      if (!st.pending && inp.value) check(false);
    }
    function renderBoardOnly() { drawBoard(); }

    function go(k) { st.i = Math.max(0, Math.min(N, k)); st.pending = false; st.msg = ""; render(); }
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !root.contains(b)) return;
      var mode = b.getAttribute("data-mode");
      if (mode) {
        st.drive = mode === "drive";
        $$("[data-mode]", root).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        go(0); return;
      }
      if (b.hasAttribute("data-go")) { go(+b.getAttribute("data-go")); return; }
      var act = b.getAttribute("data-act");
      if (act === "next") {
        var s = steps[st.i];
        if (st.drive && (s.wit || s.pick)) { st.pending = true; st.msg = ""; render(); return; }
        go(st.i + 1); return;
      }
      if (act === "back") { go(st.pending ? st.i : st.i - 1); return; }
      if (act === "reset") { st.wit = {}; st.picked = {}; go(0); return; }
      if (act === "try" && root.__check) { root.__check(true); return; }
      if (act === "show") { var inp = q("[data-wit]"); inp.value = steps[st.i].wit.show || steps[st.i].wit.def; root.__check(true); return; }
      var mv = b.getAttribute("data-move");
      if (mv) {
        var s2 = steps[st.i], okm = [].concat(s2.m);
        if (okm.indexOf(mv) >= 0) {
          if (s2.wit || s2.pick) { st.pending = true; st.msg = ""; render(); }
          else { st.i++; st.msg = ""; render(); }
        } else {
          b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong");
          var why = (s2.why && s2.why[mv]) || ("<b>" + MOVE[mv].name + "</b> " + MOVE[mv].fits + ".");
          var fb = q(".eng-fb");
          if (!fb) { fb = document.createElement("p"); fb.className = "eng-fb"; q(".eng-say").appendChild(fb); }
          fb.innerHTML = '<b style="color:var(--bad)">Not here.</b> ' + why;
        }
        return;
      }
      var pk = b.getAttribute("data-pick");
      if (pk != null) {
        var p = steps[st.i].pick.opts[+pk];
        if (p.ok) { st.picked[st.i] = +pk; st.pending = false; st.i++; st.msg = ""; render(); }
        else {
          b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong");
          var fb2 = q(".eng-fb");
          if (!fb2) { fb2 = document.createElement("p"); fb2.className = "eng-fb"; q(".eng-say").appendChild(fb2); }
          fb2.innerHTML = '<b style="color:var(--bad)">That one fails.</b> ' + p.why;
        }
      }
    });
    $$("[data-var]", root).forEach(function (inp) { inp.addEventListener("input", function () { renderBoardOnly(); var c = root.__check; if (c && !st.pending && q("[data-wit]")) c(false); }); });
    render();
  });

  /* ---------- keyboard page turns ---------- */
  addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))) return;
    var a = e.key === "ArrowRight" ? document.querySelector('a[data-key="next"]') : e.key === "ArrowLeft" ? document.querySelector('a[data-key="prev"]') : null;
    if (a) location.href = a.href;
  });
})();
