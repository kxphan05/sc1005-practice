/* Helpers on top of the simulator: port analysis, truth tables, and the problem judge. */
(function (root) {
  'use strict';
  const V = root.V;

  const CLK_RE = /^(clk|clock|ck|clk_in)$/i;
  const RST_RE = /^(rst|reset|rst_n|reset_n|rstn|resetn|clear|clr)$/i;

  function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function randBig(r, w) { let v = 0n; for (let i = 0; i < w; i += 16) v = (v << 16n) | BigInt(Math.floor(r() * 65536)); return v & V.mask(w); }

  /** Port + kind info of a module in source. */
  V.analyze = function (src, top) {
    const design = V.parse(src);
    const name = top || design.order[design.order.length - 1];
    const mod = design.modules[name];
    if (!mod) throw new V.VError(`module '${name}' not found`, 0);
    const sim = V.elaborate(design, { top: name });
    const ports = mod.ports.map((p) => {
      const s = sim.top.sigs.get(p.name);
      return { name: p.name, dir: p.dir, w: s.w, isReg: s.isReg };
    });
    const clk = ports.find((p) => p.dir === 'input' && CLK_RE.test(p.name));
    const seq = !!clk || sim.procs.length && false;
    const isTb = ports.length === 0;
    return { name, ports, clk: clk && clk.name, rst: (ports.find((p) => p.dir === 'input' && RST_RE.test(p.name)) || {}).name, isTb, sequential: !!clk, order: design.order, warnings: sim.warnings };
  };

  /** Exhaustive truth table of a combinational module (<= 12 input bits). */
  V.truthTable = function (src, top) {
    const info = V.analyze(src, top);
    const ins = info.ports.filter((p) => p.dir === 'input'), outs = info.ports.filter((p) => p.dir === 'output');
    const bits = ins.reduce((a, p) => a + p.w, 0);
    if (bits > 12) throw new Error(`${bits} input bits is too many for an automatic truth table (max 12)`);
    const sim = V.build(src, { top: info.name });
    sim.start(); sim.settle();
    const rows = [];
    for (let n = 0; n < 1 << bits; n++) {
      let sh = bits; const inV = {};
      for (const p of ins) { sh -= p.w; inV[p.name] = BigInt((n >> sh) & ((1 << p.w) - 1)); sim.poke(p.name, inV[p.name]); }
      sim.settle();
      const o = {}; for (const p of outs) o[p.name] = sim.peek(p.name);
      rows.push({ in: inV, out: o });
    }
    return { ins, outs, rows, warnings: sim.warnings };
  };

  /** Rename the module `from` to `to` in source. */
  function renameModule(src, from, to) { return src.replace(new RegExp('\\bmodule\\s+' + from + '\\b'), 'module ' + to); }

  /**
   * Judge student code against a reference.
   * spec: { module, ref: <verilog source defining module `module`>, provided?: <verilog helper modules>,
   *         cycles?: number, seqInputs?: ... }
   * Returns { ok, message, tests, warnings, detail }
   */
  V.judge = function (userSrc, spec) {
    const provided = spec.provided || '';
    let info, uSim, rSim;
    const bare = userSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const rx of spec.forbid || []) if (new RegExp(rx).test(bare)) return { ok: false, message: `This problem restricts the constructs you may use: your code contains something matching /${rx}/. Re-read the statement.` };
    for (const rx of spec.must || []) if (!new RegExp(rx).test(bare)) return { ok: false, message: `Your solution must use /${rx.replace(/\\b/g, '')}/ as asked in the statement.` };
    try {
      info = V.analyze(spec.ref + '\n' + provided, spec.module);
    } catch (e) { return { ok: false, message: 'Internal error in reference solution: ' + e.message }; }
    try { uSim = V.build(userSrc + '\n' + provided, { top: spec.module }); }
    catch (e) {
      if (e instanceof V.VError) return { ok: false, compileError: true, line: e.line, message: (e.line ? `Line ${e.line}: ` : '') + e.message };
      throw e;
    }
    if (!uSim.design.modules[spec.module]) return { ok: false, message: `Your code must define a module called '${spec.module}'.` };
    // port check
    const um = uSim.design.modules[spec.module];
    for (const p of info.ports) {
      const q = uSim.top.sigs.get(p.name);
      if (!q || !q.isPort) return { ok: false, message: `Module '${spec.module}' is missing the port '${p.name}' (${p.dir}, ${p.w} bit${p.w > 1 ? 's' : ''}). Keep the port list from the starter code.` };
      if (q.dir !== p.dir) return { ok: false, message: `Port '${p.name}' must be an ${p.dir}.` };
      if (q.w !== p.w) return { ok: false, message: `Port '${p.name}' must be ${p.w} bit${p.w > 1 ? 's' : ''} wide, but yours is ${q.w}.` };
    }
    if (um.ports.length !== info.ports.length) return { ok: false, message: `Module '${spec.module}' should have exactly ${info.ports.length} ports: ${info.ports.map((p) => p.name).join(', ')}.` };
    rSim = V.build(spec.ref + '\n' + provided, { top: spec.module });
    uSim.start(); rSim.start();
    try { uSim.settle(); rSim.settle(); } catch (e) { return { ok: false, message: e.message }; }

    const ins = info.ports.filter((p) => p.dir === 'input' && p.name !== info.clk);
    const outs = info.ports.filter((p) => p.dir === 'output');
    const clkName = info.clk;
    const r = rng(2024);
    let tests = 0;
    const fmt = (vals, ports) => ports.map((p) => `${p.name}=${p.w === 1 ? vals[p.name] : '0x' + vals[p.name].toString(16)}`).join(' ');

    const compare = (stage, inV, extra) => {
      const got = {}, exp = {};
      for (const o of outs) { got[o.name] = uSim.peek(o.name); exp[o.name] = rSim.peek(o.name); }
      tests++;
      for (const o of outs) {
        if (got[o.name] !== exp[o.name]) {
          const show = (x, w) => (w === 1 ? x.toString() : `${x.toString(2).padStart(w, '0')} (${x})`);
          return {
            ok: false,
            message: `Output '${o.name}' is wrong ${stage}.\n  inputs:   ${fmt(inV, ins)}${extra ? '  ' + extra : ''}\n  expected: ${o.name} = ${show(exp[o.name], o.w)}\n  yours:    ${o.name} = ${show(got[o.name], o.w)}`,
          };
        }
      }
      return null;
    };
    const apply = (inV) => { for (const p of ins) { uSim.poke(p.name, inV[p.name]); rSim.poke(p.name, inV[p.name]); } uSim.settle(); rSim.settle(); };

    try {
      if (!clkName) { // combinational
        const bits = ins.reduce((a, p) => a + p.w, 0);
        const vecs = [];
        if (bits <= 12) {
          for (let n = 0; n < 1 << bits; n++) { let sh = bits; const v = {}; for (const p of ins) { sh -= p.w; v[p.name] = BigInt((n >> sh) & ((1 << p.w) - 1)); } vecs.push(v); }
        } else {
          for (let n = 0; n < 600; n++) { const v = {}; for (const p of ins) v[p.name] = randBig(r, p.w); vecs.push(v); }
          for (const pick of [0n, 1n, -1n]) { const v = {}; for (const p of ins) v[p.name] = BigInt.asUintN(p.w, pick); vecs.push(v); }
        }
        for (const ev of spec.vectors || []) { const v = {}; for (const p of ins) v[p.name] = BigInt(ev[p.name] || 0); vecs.push(v); }
        for (const v of vecs) { apply(v); const bad = compare('for this input', v); if (bad) return Object.assign(bad, { tests, warnings: uSim.warnings }); }
      } else { // sequential
        const rstP = ins.find((p) => RST_RE.test(p.name));
        const rstActive = rstP ? (/_n$|n$/i.test(rstP.name) && /rst_?n|reset_?n/i.test(rstP.name) ? 0n : 1n) : null;
        const cyc = spec.cycles || 60;
        for (let run = 0; run < 4; run++) {
          const rr = rng(100 + run * 7);
          let cycle = 0;
          const nextVals = (forceRst) => {
            const v = {};
            for (const p of ins) {
              if (rstP && p.name === rstP.name) v[p.name] = forceRst ? rstActive : (rr() < (spec.rstProb == null ? 0.06 : spec.rstProb) ? rstActive : rstActive ^ 1n);
              else if (spec.biasHigh && p.w === 1) v[p.name] = rr() < 0.65 ? 1n : 0n;
              else v[p.name] = randBig(rr, p.w);
            }
            return v;
          };
          for (let c = 0; c < cyc; c++) {
            const v = nextVals(c < 2);
            // all inputs change while clock is low
            apply(v);
            let bad = compare(`before clock edge #${c + 1}`, v, `cycle=${c}`);
            if (bad) return Object.assign(bad, { tests, warnings: uSim.warnings });
            uSim.poke(clkName, 1); rSim.poke(clkName, 1); uSim.settle(); rSim.settle();
            bad = compare(`after clock edge #${c + 1}`, v, `cycle=${c}`);
            if (bad) return Object.assign(bad, { tests, warnings: uSim.warnings });
            uSim.poke(clkName, 0); rSim.poke(clkName, 0); uSim.settle(); rSim.settle();
            bad = compare(`after clock falls (edge #${c + 1})`, v, `cycle=${c}`);
            if (bad) return Object.assign(bad, { tests, warnings: uSim.warnings });
          }
        }
      }
    } catch (e) {
      if (e instanceof V.VError) return { ok: false, message: e.message, warnings: uSim.warnings };
      throw e;
    }
    const w = uSim.warnings;
    return { ok: true, message: `All ${tests} checks passed.`, tests, warnings: w };
  };

  /** Run source as a testbench (or auto-pick); returns {log, sim, error}. */
  V.simulate = function (src, top, maxTime) {
    try {
      const sim = V.build(src, { top });
      sim.run(maxTime || 10000);
      return { sim, log: sim.log, warnings: sim.warnings };
    } catch (e) {
      if (e instanceof V.VError) return { error: e };
      throw e;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
