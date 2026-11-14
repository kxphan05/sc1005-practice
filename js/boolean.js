/* Boolean-algebra toolkit: expression parser, equivalence checking, Quine-McCluskey, K-map HTML. */
(function (root) {
  'use strict';
  const B = (root.B = {});

  /* ----------------------------------------------------------- parser */
  // Grammar:  or := xor ('+'|'|' xor)* ; xor := and ('^' and)* ; and := not (('.'|'*'|'&'|implicit) not)* ;
  //           not := ('~'|'!') not | atom ("'")*  ; atom := var | 0 | 1 | '(' or ')'
  B.parse = function (str, vars) {
    const sorted = vars.slice().sort((a, b) => b.length - a.length);
    const s = str.replace(/\s+/g, '').replace(/[·∙]/g, '.').replace(/⊕/g, '^').replace(/¬/g, '~').replace(/’|´|`/g, "'").replace(/−/g, '-');
    let i = 0;
    const fail = (m) => { throw new Error(m); };
    function atom() {
      if (s[i] === '(') {
        i++; const e = or();
        if (s[i] !== ')') fail('missing closing parenthesis');
        i++; return e;
      }
      if (s[i] === '0' || s[i] === '1') return { t: 'c', v: s[i++] === '1' };
      for (const v of sorted) if (s.startsWith(v, i)) { i += v.length; return { t: 'v', n: v }; }
      if (i >= s.length) fail('expression ended unexpectedly');
      fail(`unexpected '${s[i]}' (variables are: ${vars.join(', ')})`);
    }
    function not() {
      if (s[i] === '~' || s[i] === '!') { i++; return { t: 'n', a: not() }; }
      let e = atom();
      while (s[i] === "'") { i++; e = { t: 'n', a: e }; }
      return e;
    }
    function and() {
      let e = not();
      for (;;) {
        if (s[i] === '.' || s[i] === '*' || s[i] === '&') { i++; e = { t: 'a', a: e, b: not() }; }
        else if (i < s.length && s[i] !== '+' && s[i] !== '|' && s[i] !== '^' && s[i] !== ')') e = { t: 'a', a: e, b: not() };
        else return e;
      }
    }
    function xor() { let e = and(); while (s[i] === '^') { i++; e = { t: 'x', a: e, b: and() }; } return e; }
    function or() { let e = xor(); while (s[i] === '+' || s[i] === '|') { i++; e = { t: 'o', a: e, b: xor() }; } return e; }
    if (!s) fail('empty expression');
    const e = or();
    if (i < s.length) fail(`unexpected '${s[i]}'`);
    return e;
  };
  B.evalAst = function (e, env) {
    switch (e.t) {
      case 'c': return e.v;
      case 'v': return !!env[e.n];
      case 'n': return !B.evalAst(e.a, env);
      case 'a': return B.evalAst(e.a, env) && B.evalAst(e.b, env);
      case 'o': return B.evalAst(e.a, env) || B.evalAst(e.b, env);
      case 'x': return B.evalAst(e.a, env) !== B.evalAst(e.b, env);
    }
  };
  B.literals = (e) => (e.t === 'v' ? 1 : e.t === 'c' ? 0 : e.t === 'n' ? B.literals(e.a) : B.literals(e.a) + B.literals(e.b));
  B.truth = function (str, vars) {
    const ast = B.parse(str, vars);
    const out = [];
    for (let m = 0; m < 1 << vars.length; m++) {
      const env = {}; vars.forEach((v, k) => { env[v] = !!((m >> (vars.length - 1 - k)) & 1); });
      out.push(B.evalAst(ast, env) ? 1 : 0);
    }
    return { out, ast };
  };
  /** Compare expression with a set of minterms (don't-cares allowed to be either). */
  B.checkExpr = function (str, vars, minterms, dcs) {
    dcs = dcs || [];
    let t;
    try { t = B.truth(str, vars); } catch (e) { return { ok: false, parseError: e.message }; }
    for (let m = 0; m < t.out.length; m++) {
      if (dcs.includes(m)) continue;
      const want = minterms.includes(m) ? 1 : 0;
      if (t.out[m] !== want) return { ok: false, wrongAt: m, literals: B.literals(t.ast) };
    }
    return { ok: true, literals: B.literals(t.ast), ast: t.ast };
  };

  /* -------------------------------------------------- Quine-McCluskey */
  function popcount(x) { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; }
  B.primes = function (n, ones, dcs) {
    let cur = new Map();
    for (const m of [...ones, ...dcs]) cur.set(`${m}:0`, { v: m, mask: 0 });
    const primes = [];
    while (cur.size) {
      const next = new Map(), used = new Set();
      const arr = [...cur.values()];
      for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i], b = arr[j];
        if (a.mask !== b.mask) continue;
        const d = a.v ^ b.v;
        if (popcount(d) === 1) {
          const nm = a.mask | d, nv = a.v & b.v;
          next.set(`${nv}:${nm}`, { v: nv, mask: nm });
          used.add(`${a.v}:${a.mask}`); used.add(`${b.v}:${b.mask}`);
        }
      }
      for (const [k, x] of cur) if (!used.has(k)) primes.push(x);
      cur = next;
    }
    return primes;
  };
  const covers = (p, m) => ((m & ~p.mask) === (p.v & ~p.mask));
  const cost = (p, n) => n - popcount(p.mask);
  /** Minimal SOP implicant cover (exact, min #terms then min #literals). */
  B.minCover = function (n, ones, dcs) {
    dcs = dcs || [];
    if (!ones.length) return [];
    if (ones.length + dcs.length === 1 << n) return [{ v: 0, mask: (1 << n) - 1 }];
    const primes = B.primes(n, ones, dcs);
    let best = null;
    const chosen = [];
    const rec = (remaining, start) => {
      if (!remaining.length) {
        const c = chosen.slice();
        const key = [c.length, c.reduce((a, p) => a + cost(p, n), 0)];
        if (!best || key[0] < best.key[0] || (key[0] === best.key[0] && key[1] < best.key[1])) best = { key, c };
        return;
      }
      if (best && chosen.length >= best.key[0]) return;
      // pick the minterm with fewest covering primes
      let pm = remaining[0], pc = null;
      for (const m of remaining) {
        const cs = primes.filter((p) => covers(p, m));
        if (!pc || cs.length < pc.length) { pm = m; pc = cs; }
      }
      for (const p of pc) {
        chosen.push(p);
        rec(remaining.filter((m) => !covers(p, m)), 0);
        chosen.pop();
      }
    };
    rec(ones.slice(), 0);
    return best.c;
  };
  const termStr = (p, vars, sop) => {
    const n = vars.length; const lits = [];
    for (let k = 0; k < n; k++) {
      const bit = 1 << (n - 1 - k);
      if (p.mask & bit) continue;
      const val = !!(p.v & bit);
      if (sop) lits.push(vars[k] + (val ? '' : "'"));
      else lits.push(vars[k] + (val ? "'" : '')); // POS: complement of the f' implicant literal
    }
    return lits;
  };
  /** Minimal SOP string */
  B.minSOP = function (vars, ones, dcs) {
    const n = vars.length;
    if (!ones.length) return { str: '0', literals: 0, terms: [] };
    const cov = B.minCover(n, ones, dcs || []);
    const terms = cov.map((p) => termStr(p, vars, true));
    if (terms.some((t) => !t.length)) return { str: '1', literals: 0, terms: [] };
    return { str: terms.map((t) => t.join('')).join(' + '), literals: terms.reduce((a, t) => a + t.length, 0), terms };
  };
  /** Minimal POS string */
  B.minPOS = function (vars, ones, dcs) {
    const n = vars.length; dcs = dcs || [];
    const zeros = []; for (let m = 0; m < 1 << n; m++) if (!ones.includes(m) && !dcs.includes(m)) zeros.push(m);
    if (!zeros.length) return { str: '1', literals: 0, terms: [] };
    const cov = B.minCover(n, zeros, dcs);
    const terms = cov.map((p) => termStr(p, vars, false));
    if (terms.some((t) => !t.length)) return { str: '0', literals: 0, terms: [] };
    const str = terms.map((t) => (terms.length > 1 && t.length > 1 ? '(' + t.join(' + ') + ')' : t.length > 1 ? t.join(' + ') : t[0])).join('');
    return { str: terms.length === 1 && terms[0].length > 1 ? terms[0].join(' + ') : str, literals: terms.reduce((a, t) => a + t.length, 0), terms };
  };

  /* ---------------------------------------------------------- K-map */
  const GRAY2 = [0, 1, 3, 2];
  function grayOrder(bits) { return bits === 0 ? [0] : bits === 1 ? [0, 1] : GRAY2; }
  /** HTML table K-map. vars: names (2-4). ones/dcs: minterm numbers. Shows 1/0/X. */
  B.kmapHTML = function (vars, ones, dcs, opts) {
    dcs = dcs || []; opts = opts || {};
    const n = vars.length;
    if (n === 5) {
      const a = B.kmapHTML(vars.slice(1), ones.filter((m) => m < 16), dcs.filter((m) => m < 16), { title: `${vars[0]} = 0` });
      const bm = (arr) => arr.filter((m) => m >= 16).map((m) => m - 16);
      const b = B.kmapHTML(vars.slice(1), bm(ones), bm(dcs), { title: `${vars[0]} = 1` });
      return `<div class="kmap5">${a}${b}</div>`;
    }
    const rb = Math.floor(n / 2), cb = n - rb;
    const rows = grayOrder(rb), cols = grayOrder(cb);
    const rvars = vars.slice(0, rb).join(''), cvars = vars.slice(rb).join('');
    const lab = (g, bits) => g.toString(2).padStart(bits, '0');
    let h = `<table class="kmap">${opts.title ? `<caption>${opts.title}</caption>` : ''}<tr><th class="corner"><span class="rv">${rvars}</span>\\<span class="cv">${cvars}</span></th>`;
    for (const c of cols) h += `<th>${lab(c, cb)}</th>`;
    h += '</tr>';
    for (const r of rows) {
      h += `<tr><th>${rb ? lab(r, rb) : ''}</th>`;
      for (const c of cols) {
        const m = (r << cb) | c;
        const cell = ones.includes(m) ? '1' : dcs.includes(m) ? 'X' : '0';
        h += `<td class="${cell === '1' ? 'one' : cell === 'X' ? 'dc' : ''}"><small>${m}</small>${cell}</td>`;
      }
      h += '</tr>';
    }
    return h + '</table>';
  };
  /** Truth table HTML for a set of functions given as arrays of output bits */
  B.tableHTML = function (vars, outs) { // outs: [{name, bits:[...]}]
    const n = vars.length;
    let h = '<table class="tt"><tr>' + vars.map((v) => `<th>${v}</th>`).join('') + outs.map((o) => `<th class="out">${o.name}</th>`).join('') + '</tr>';
    for (let m = 0; m < 1 << n; m++) {
      h += '<tr>' + vars.map((v, k) => `<td>${(m >> (n - 1 - k)) & 1}</td>`).join('') + outs.map((o) => `<td class="out">${o.bits[m]}</td>`).join('') + '</tr>';
    }
    return h + '</table>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
