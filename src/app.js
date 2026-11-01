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

  /* ---------- keyboard page turns ---------- */
  addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))) return;
    var a = e.key === "ArrowRight" ? document.querySelector('a[data-key="next"]') : e.key === "ArrowLeft" ? document.querySelector('a[data-key="prev"]') : null;
    if (a) location.href = a.href;
  });
})();
