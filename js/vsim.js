/* Verilog elaboration + event-driven simulator (2-state, BigInt values).
 *   V.build(src, {top, params}) -> Sim       (throws VError)
 *   Sim.run(maxTime) -> runs testbench style until $finish / no events / maxTime
 *   Sim.poke(name, val), Sim.peek(name), Sim.settle(), Sim.advance(dt)  (interactive use)
 * Supported: modules, params, wire/reg/integer, vectors, memories, gate primitives, assign,
 * always/initial, if/case/casez/casex/for/while/repeat/forever, #delay, @(...), blocking & non-blocking
 * assignment, $display/$write/$monitor/$strobe/$finish/$time/$random/$signed/$unsigned/$clog2.
 * Not supported: x/z values (everything is 0/1), tri-state, functions/tasks, generate.
 */
(function (root) {
  'use strict';
  const V = root.V;
  const { VError } = V;

  const MASKS = [];
  const mask = (w) => (MASKS[w] !== undefined ? MASKS[w] : (MASKS[w] = (1n << BigInt(w)) - 1n));
  const toS = (v, w) => (w > 0 && (v >> BigInt(w - 1)) & 1n ? v - (1n << BigInt(w)) : v);
  const ext = (v, w, cw, sx) => (sx && cw > w && (v >> BigInt(w - 1)) & 1n ? v | (mask(cw) ^ mask(w)) : v);
  const popParity = (v) => { let p = 0n; while (v) { p ^= v & 1n; v >>= 1n; } return p; };
  const clog2 = (n) => { let r = 0; n = n - 1n; while (n > 0n) { r++; n >>= 1n; } return r; };

  /* ------------------------------------------------------------ signals */
  class Sig {
    constructor(name, full, w, signed) {
      this.name = name; this.full = full; this.w = w; this.signed = !!signed;
      this.v = 0n; this.isReg = false; this.isPort = false; this.dir = null;
      this.mem = null; this.memLen = 0;
      this.fanout = []; this.wpos = []; this.wneg = []; this.wany = [];
      this.trace = [[0, 0n]];
      this.drivers = [];
    }
  }

  /* ----------------------------------------------------------- simulator */
  class Sim {
    constructor() {
      this.time = 0; this.active = []; this.nba = []; this.wheel = [];
      this.log = []; this.warnings = []; this.finished = false; this.limitHit = false;
      this.monitor = null; this.strobes = []; this.ops = 0; this.sigs = []; this.top = null;
      this.seed = 12345; this.timeBase = 'ns'; this.started = false; this.procs = []; this.assigns = [];
    }
    warn(msg, line) { this.warnings.push({ msg, line: line || 0 }); }
    schedule(t, fn) {
      const w = this.wheel; let i = w.length;
      while (i > 0 && w[i - 1].t > t) i--;
      w.splice(i, 0, { t, fn });
    }
    setSig(s, nv) {
      nv &= mask(s.w);
      if (nv === s.v) return;
      const old = s.v; s.v = nv;
      const tr = s.trace;
      if (tr[tr.length - 1][0] === this.time) tr[tr.length - 1][1] = nv; else tr.push([this.time, nv]);
      for (const a of s.fanout) if (!a.q) { a.q = true; this.active.push(a); }
      const o = old & 1n, n = nv & 1n;
      if (o !== n) this.wake(n ? s.wpos : s.wneg);
      this.wake(s.wany);
    }
    wake(list) {
      if (!list.length) return;
      const copy = list.slice(); list.length = 0;
      for (const e of copy) {
        if (e.tok.done) continue;
        e.tok.done = true; this.active.push(e.proc);
      }
    }
    setMem(s, idx, val) {
      if (idx < 0 || idx >= s.memLen) return;
      val &= mask(s.w);
      if (s.mem[idx] === val) return;
      s.mem[idx] = val;
      for (const a of s.fanout) if (!a.q) { a.q = true; this.active.push(a); }
      this.wake(s.wany);
    }
    runProc(p) {
      if (p.kind === 'assign') { p.q = false; p.run(); return; }
      if (p.done) return;
      let r;
      try { r = p.gen.next(); } catch (e) { if (e instanceof VError) throw e; throw e; }
      if (r.done) { p.done = true; return; }
      const d = r.value;
      if (d.d !== undefined) {
        const delay = Number(d.d);
        this.schedule(this.time + delay, () => this.active.push(p));
      } else {
        const tok = { done: false };
        for (const [sig, edge] of d.w) {
          const lst = edge === 'pos' ? sig.wpos : edge === 'neg' ? sig.wneg : sig.wany;
          lst.push({ proc: p, tok });
        }
      }
    }
    settle() {
      let guard = 0;
      for (;;) {
        while (this.active.length) {
          if (this.finished) return;
          if (++guard > 2000000) throw new VError(`Simulation stuck at time ${this.time}: too many events in one time step (combinational loop or zero-delay oscillation?)`, 0);
          this.runProc(this.active.shift());
        }
        if (this.nba.length) {
          const q = this.nba; this.nba = [];
          for (const f of q) f();
          continue;
        }
        break;
      }
      if (this.finished) return;
      for (const s of this.strobes.splice(0)) this.log.push(this.fmtArgs([{ isStr: true, str: s.fmt }, ...s.args]));
      if (this.monitor) {
        const key = this.monitor.args.filter((a) => !a.isTime).map((a) => (a.isStr ? '' : a.ev(a.w, a.s).toString())).join(',');
        if (key !== this.monitor.last) { this.monitor.last = key; this.log.push(this.fmtArgs(this.monitor.args)); }
      }
    }
    start() {
      if (this.started) return; this.started = true;
      for (const a of this.assigns) { a.q = true; this.active.push(a); }
      for (const p of this.procs) this.active.push(p);
    }
    advance(dt) { this.runUntil(this.time + dt); }
    runUntil(tEnd) {
      this.start(); this.ops = 0;
      this.settle();
      while (!this.finished && this.wheel.length && this.wheel[0].t <= tEnd) {
        const t = this.wheel[0].t;
        this.time = t; this.ops = 0;
        while (this.wheel.length && this.wheel[0].t === t) this.wheel.shift().fn();
        this.settle();
      }
      if (!this.finished && this.time < tEnd) this.time = tEnd;
    }
    run(maxTime) {
      maxTime = maxTime || 100000;
      this.start(); this.settle();
      while (!this.finished && this.wheel.length) {
        if (this.wheel[0].t > maxTime) { this.limitHit = true; break; }
        const t = this.wheel[0].t;
        this.time = t;
        while (this.wheel.length && this.wheel[0].t === t) this.wheel.shift().fn();
        this.settle();
      }
      return this;
    }
    find(name) {
      const s = this.top.sigs.get(name);
      if (!s) throw new Error(`no signal named '${name}' in ${this.top.mod}`);
      return s;
    }
    poke(name, val) { this.setSig(this.find(name), BigInt(val)); }
    peek(name) { return this.find(name).v; }

    /* ---- $display formatting ---- */
    fmtArgs(args) {
      if (!args.length) return '';
      if (args[0].isStr) return this.fmtOne(args[0].str, args.slice(1));
      return args.map((a) => (a.isStr ? a.str : a.ev(a.w, a.s).toString(10))).join(' ');
    }
    fmtOne(fmt, rest) {
      let ai = 0;
      return fmt.replace(/%(-?)(0?)(\d*)([bBdDhHxXoOtTsScCmM%])/g, (all, left, zero, wd, ch) => {
        if (ch === '%') return '%';
        if (ch === 'm' || ch === 'M') return this.top ? this.top.mod : '';
        const a = rest[ai++];
        if (!a) return '';
        let v = a.isStr ? 0n : a.ev(a.w, a.s), s;
        const lc = ch.toLowerCase();
        const width = a.isStr ? 0 : a.w;
        if (lc === 'b') s = v.toString(2).padStart(zero === '0' && wd === '' ? 1 : width, '0');
        else if (lc === 'h' || lc === 'x') s = v.toString(16).padStart(zero === '0' && wd === '' ? 1 : Math.ceil(width / 4), '0');
        else if (lc === 'o') s = v.toString(8).padStart(zero === '0' && wd === '' ? 1 : Math.ceil(width / 3), '0');
        else if (lc === 'c') s = String.fromCharCode(Number(v & 0xffn));
        else if (lc === 's') s = a.isStr ? a.str : String(v);
        else if (lc === 't') s = String(v);
        else { // %d
          const sv = a.s ? toS(v, width) : v;
          s = sv.toString(10);
          if (zero !== '0' || wd !== '') { /* explicit width given */ }
          if (!(zero === '0' && wd === '') && lc === 'd' && !a.isStr) {
            const maxDigits = (a.s ? (1n << BigInt(width - 1)) : mask(width)).toString(10).length + (a.s ? 1 : 0);
            if (wd === '' && zero === '') s = s.padStart(maxDigits, ' ');
          }
        }
        if (wd !== '' && !(zero === '0' && wd === '')) {
          const n = parseInt(wd, 10);
          if (left) s = s.padEnd(n, ' '); else s = s.padStart(n, zero === '0' && lc !== 'd' ? '0' : ' ');
        }
        return s;
      });
    }
    display(fmt, args, nl) {
      const txt = this.fmtArgs([{ isStr: true, str: fmt }, ...args]);
      this.log.push(txt);
    }
  }

  /* ------------------------------------------------------- elaboration */
  const DIM = 'dims';
  function build(src, opts) {
    opts = opts || {};
    const design = V.parse(src);
    return V.elaborate(design, opts);
  }

  function elaborate(design, opts) {
    const sim = new Sim();
    const mods = design.modules;
    let topName = opts.top;
    if (!topName) {
      const used = new Set();
      for (const m of Object.values(mods)) for (const it of m.items) if (it.k === 'inst') used.add(it.mod);
      const cands = design.order.filter((n) => !used.has(n));
      const tb = cands.filter((n) => mods[n].ports.length === 0);
      topName = (tb.length ? tb[tb.length - 1] : cands[cands.length - 1]) || design.order[design.order.length - 1];
    }
    if (!topName) throw new VError('no module found: write a module ... endmodule', 1);
    if (!mods[topName]) throw new VError(`module '${topName}' not found`, 0);
    sim.topName = topName;
    sim.design = design;
    sim.top = instantiate(sim, mods, topName, topName, {}, null, 0);
    return sim;
  }
  V.elaborate = elaborate;

  function instantiate(sim, mods, modName, instPath, paramOverrides, parent, depth) {
    if (depth > 20) throw new VError('module instantiation is too deep (recursive module?)', 0);
    const mod = mods[modName];
    const inst = { mod: modName, path: instPath, sigs: new Map(), params: new Map(), children: [], sim, signalsList: [] };
    const sc = { inst, sim, mod, readsStack: [] };

    /* params */
    const evalConst = (expr) => {
      const c = compileExpr(expr, sc);
      return c.ev(c.w, c.s);
    };
    mod.params.forEach((pr, i) => {
      let ov = paramOverrides[pr.name];
      if (ov === undefined) { const c = compileExpr(pr.expr, sc); inst.params.set(pr.name, { v: c.ev(c.w, c.s), w: c.w, s: c.s }); }
      else inst.params.set(pr.name, { v: ov, w: 32, s: true });
    });
    for (const it of mod.items) {
      if (it.k !== 'param') continue;
      for (const pr of it.list) {
        const ov = !it.local ? paramOverrides[pr.name] : undefined;
        if (ov !== undefined) inst.params.set(pr.name, { v: ov, w: 32, s: true });
        else { const c = compileExpr(pr.expr, sc); inst.params.set(pr.name, { v: c.ev(c.w, c.s), w: c.w, s: c.s }); }
      }
    }
    for (const k of Object.keys(paramOverrides)) {
      if (!inst.params.has(k)) sim.warn(`module '${modName}' has no parameter '${k}'`, mod.line);
    }

    const rangeW = (r) => {
      if (!r) return 1;
      const m = Number(evalConst(r.msb)), l = Number(evalConst(r.lsb));
      return Math.abs(m - l) + 1;
    };
    const declare = (name, w, signed, line) => {
      let s = inst.sigs.get(name);
      if (s) return s;
      s = new Sig(name, instPath + '.' + name, w, signed);
      inst.sigs.set(name, s); sim.sigs.push(s); inst.signalsList.push(s);
      return s;
    };

    /* ports + declarations */
    for (const pt of mod.ports) {
      const w = rangeW(pt.range);
      const s = declare(pt.name, w, pt.signed, pt.line);
      s.isPort = true; s.dir = pt.dir; s.isReg = !!pt.isReg;
    }
    const memInit = [];
    for (const it of mod.items) {
      if (it.k !== 'decl') continue;
      const w = it.kind === 'integer' ? 32 : rangeW(it.range);
      for (const nm of it.names) {
        let s = inst.sigs.get(nm.name);
        if (s && !s.isPort) throw new VError(`'${nm.name}' is declared twice`, it.line);
        if (s) { if (it.kind === 'reg') s.isReg = true; if (it.range) s.w = w; if (it.signed) s.signed = true; }
        else s = declare(nm.name, w, it.signed, it.line);
        if (it.kind === 'reg' || it.kind === 'integer') s.isReg = true;
        if (nm.dims) {
          const a = Number(evalConst(nm.dims.msb)), b = Number(evalConst(nm.dims.lsb));
          s.memLen = Math.abs(a - b) + 1; s.memLo = Math.min(a, b); s.mem = new Array(s.memLen).fill(0n);
        }
        if (nm.init) memInit.push({ s, init: nm.init, isReg: s.isReg, line: it.line });
      }
    }
    if (depth === 0) {
      for (const s of inst.signalsList) s.top = true;
    }
    sim.hasDepth = Math.max(sim.hasDepth || 0, depth);

    const implicit = (name, line) => {
      if (inst.sigs.has(name) || inst.params.has(name)) return;
      declare(name, 1, false, line);
    };
    // implicit nets: lhs of assign, gate terminals, instance connections
    const scanImplicit = (e) => {
      if (!e) return;
      if (e.k === 'id') implicit(e.name, e.line);
      else if (e.k === 'cat') e.parts.forEach(scanImplicit);
      else if (e.k === 'idx' || e.k === 'rng') scanImplicit(e.base);
    };

    /* items */
    const drivers = []; // {sig, lo, hi, kind, line}
    const noteDriver = (lv, kind, line, proc) => { if (lv.parts) lv.parts.forEach((p) => noteDriver(p, kind, line, proc)); else if (lv.sig) drivers.push({ sig: lv.sig, lo: lv.lo, hi: lv.hi, kind, line, proc }); };

    for (const it of mod.items) {
      if (it.k === 'assignc') {
        for (const a of it.list) {
          scanImplicit(a.lhs);
          const lhs = compileLvalue(a.lhs, sc, 'net', it.line);
          const rhs = compileExpr(a.rhs, sc);
          noteDriver(lhs, 'assign', it.line);
          makeContAssign(sim, sc, lhs, rhs, it.delay ? Number(evalConst(it.delay)) : 0);
        }
      } else if (it.k === 'gates') {
        for (const g of it.list) {
          g.terms.forEach(scanImplicit);
          const delay = g.delay ? Number(evalConst(g.delay)) : 0;
          const outs = (g.type === 'not' || g.type === 'buf') ? g.terms.slice(0, -1) : [g.terms[0]];
          const ins = (g.type === 'not' || g.type === 'buf') ? [g.terms[g.terms.length - 1]] : g.terms.slice(1);
          const inC = ins.map((e) => compileExpr(e, sc));
          const gateFn = (vals) => {
            const bits = vals.map((x) => x & 1n);
            let r;
            switch (g.type) {
              case 'and': r = bits.reduce((a, b) => a & b); break;
              case 'nand': r = bits.reduce((a, b) => a & b) ^ 1n; break;
              case 'or': r = bits.reduce((a, b) => a | b); break;
              case 'nor': r = bits.reduce((a, b) => a | b) ^ 1n; break;
              case 'xor': r = bits.reduce((a, b) => a ^ b); break;
              case 'xnor': r = bits.reduce((a, b) => a ^ b) ^ 1n; break;
              case 'not': r = bits[0] ^ 1n; break;
              default: r = bits[0];
            }
            return r;
          };
          const rhs = { w: 1, s: false, sigs: new Set(inC.flatMap((c) => [...c.sigs])), ev: () => gateFn(inC.map((c) => c.ev(c.w, false))) };
          for (const o of outs) {
            const lhs = compileLvalue(o, sc, 'net', g.line);
            noteDriver(lhs, 'gate', g.line);
            makeContAssign(sim, sc, lhs, rhs, delay);
          }
        }
      } else if (it.k === 'inst') {
        const child = mods[it.mod];
        if (!child) throw new VError(`module '${it.mod}' is not defined (instantiated here)`, it.line);
        for (const ins of it.insts) {
          const ov = {};
          const paramNames = [...child.params.map((q) => q.name), ...child.items.filter((x) => x.k === 'param' && !x.local).flatMap((x) => x.list.map((q) => q.name))];
          it.params.forEach((pp, i) => {
            const nm = pp.name || paramNames[i];
            if (!nm) throw new VError(`too many parameter overrides for '${it.mod}'`, it.line);
            ov[nm] = evalConst(pp.expr);
          });
          const ch = instantiate(sim, mods, it.mod, instPath + '.' + ins.name, ov, inst, depth + 1);
          inst.children.push(ch);
          const named = ins.conns.some((c) => c.name);
          if (named && ins.conns.some((c) => !c.name)) throw new VError('cannot mix named and positional port connections', it.line);
          ins.conns.forEach((c, i) => {
            const port = named ? child.ports.find((q) => q.name === c.name) : child.ports[i];
            if (!port) throw new VError(named ? `module '${it.mod}' has no port named '${c.name}'` : `too many port connections for module '${it.mod}' (it has ${child.ports.length} ports)`, it.line);
            if (!c.expr) return;
            const psig = ch.sigs.get(port.name);
            scanImplicit(c.expr);
            if (port.dir === 'input') {
              const rhs = compileExpr(c.expr, sc);
              const lhs = { w: psig.w, sig: psig, lo: 0, hi: psig.w - 1, bind: () => (v) => sim.setSig(psig, v) };
              makeContAssign(sim, sc, lhs, rhs, 0);
            } else {
              const lhs = compileLvalue(c.expr, sc, 'net', it.line);
              noteDriver(lhs, 'port', it.line);
              const rhs = { w: psig.w, s: false, sigs: new Set([psig]), ev: (cw) => psig.v & mask(cw) };
              makeContAssign(sim, sc, lhs, rhs, 0);
            }
          });
          if (!named && ins.conns.length < child.ports.length) sim.warn(`instance '${ins.name}' leaves ports unconnected`, it.line);
          if (named) {
            for (const pt of child.ports) if (pt.dir === 'input' && !ins.conns.find((c) => c.name === pt.name && c.expr))
              sim.warn(`input '${pt.name}' of instance '${ins.name}' is not connected`, it.line);
          }
        }
      } else if (it.k === 'always' || it.k === 'initial') {
        compileProcess(sim, sc, it, noteDriver);
      }
    }
    for (const mi of memInit) {
      const c = compileExpr(mi.init, sc);
      if (mi.isReg) { mi.s.v = c.ev(Math.max(c.w, mi.s.w), c.s) & mask(mi.s.w); mi.s.trace = [[0, mi.s.v]]; }
      else makeContAssign(sim, sc, { w: mi.s.w, sig: mi.s, lo: 0, hi: mi.s.w - 1, bind: () => (v) => sim.setSig(mi.s, v) }, c, 0);
    }

    /* driver lint */
    const byS = new Map();
    for (const d of drivers) { if (!byS.has(d.sig)) byS.set(d.sig, []); byS.get(d.sig).push(d); }
    for (const [s, list] of byS) {
      if (s.isReg && list.some((d) => d.kind === 'assign' || d.kind === 'gate')) {
        throw new VError(`'${s.name}' is a reg, so it cannot be driven by 'assign' or a gate; declare it as a wire`, list.find((d) => d.kind === 'assign' || d.kind === 'gate').line);
      }
      if (list.length > 1) {
        const ks = new Set();
        for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
          const a = list[i], b = list[j];
          if (a.lo <= b.hi && b.lo <= a.hi && !(a.proc && a.proc === b.proc)) ks.add(s.name);
        }
        if (ks.size) sim.warn(`'${s.name}' has multiple drivers (it is assigned from more than one place); this does not synthesize into a single circuit`, list[1].line);
      }
    }
    for (const pt of mod.ports) {
      const s = inst.sigs.get(pt.name);
      if (pt.dir === 'output' && !byS.has(s) && depth === 0 && !mod.items.some((x) => x.k === 'inst'))
        sim.warn(`output '${pt.name}' is never assigned`, pt.line);
    }
    return inst;
  }

  /* ------------------------------------------------ continuous assigns */
  function makeContAssign(sim, sc, lhs, rhs, delay) {
    const w = Math.max(lhs.w, rhs.w);
    const a = {
      kind: 'assign', q: false,
      run() {
        const v = rhs.ev(w, rhs.s) & mask(lhs.w);
        if (delay > 0) {
          const wr = lhs.bind();
          sim.schedule(sim.time + delay, () => wr(v));
        } else lhs.bind()(v);
      },
    };
    for (const s of rhs.sigs) s.fanout.push(a);
    if (lhs.idxSigs) for (const s of lhs.idxSigs) s.fanout.push(a);
    sim.assigns.push(a);
  }

  /* ------------------------------------------------------- expressions */
  function lookup(sc, name, line) {
    if (name.includes('.')) {
      const parts = name.split('.'); let inst = sc.inst;
      for (let i = 0; i < parts.length - 1; i++) {
        inst = inst.children.find((c) => c.path.endsWith('.' + parts[i]));
        if (!inst) throw new VError(`no instance '${parts[i]}' for hierarchical name ${name}`, line);
      }
      const hs = inst.sigs.get(parts[parts.length - 1]);
      if (!hs) throw new VError(`'${name}' not found`, line);
      return { sig: hs };
    }
    const s = sc.inst.sigs.get(name);
    if (s) return { sig: s };
    const p = sc.inst.params.get(name);
    if (p) return { param: p };
    throw new VError(`'${name}' is not declared in module ${sc.mod.name}`, line);
  }

  function compileExpr(n, sc) {
    const sigs = new Set();
    const rd = (s) => { sigs.add(s); if (sc.reads) sc.reads.add(s); };
    const sub = (e) => { const c = compileExpr(e, sc); for (const s of c.sigs) sigs.add(s); return c; };
    switch (n.k) {
      case 'num': {
        const v = n.v, w = n.w, s = n.s;
        return { w, s, sigs, isNum: true, node: n, ev: (cw, sx) => ext(v, w, cw, sx && s) & mask(cw) };
      }
      case 'str': return { w: 8 * Math.max(1, n.v.length), s: false, sigs, isStr: true, str: n.v, ev: () => 0n };
      case 'id': {
        const r = lookup(sc, n.name, n.line);
        if (r.param) { const p = r.param; return { w: p.w, s: p.s, sigs, ev: (cw, sx) => ext(p.v, p.w, cw, sx && p.s) & mask(cw) }; }
        const s = r.sig;
        if (s.mem) throw new VError(`'${s.name}' is a memory; use ${s.name}[index]`, n.line);
        rd(s);
        return { w: s.w, s: s.signed, sigs, sig: s, ev: (cw, sx) => ext(s.v, s.w, cw, sx && s.signed) & mask(cw) };
      }
      case 'idx': {
        if (n.base.k !== 'id') throw new VError('only simple names can be indexed', n.line);
        const r = lookup(sc, n.base.name, n.line);
        const i = sub(n.i);
        if (r.param) { const p = r.param; return { w: 1, s: false, sigs, ev: (cw) => (p.v >> i.ev(32, false)) & 1n }; }
        const s = r.sig; rd(s);
        if (s.mem) return { w: s.w, s: s.signed, sigs, ev: (cw, sx) => { const ix = Number(i.ev(32, false)) - s.memLo; return ext(s.mem[ix] === undefined ? 0n : s.mem[ix], s.w, cw, sx && s.signed) & mask(cw); } };
        return { w: 1, s: false, sigs, ev: () => { const ix = i.ev(32, false); return ix >= BigInt(s.w) ? 0n : (s.v >> ix) & 1n; } };
      }
      case 'rng': {
        if (n.base.k !== 'id') throw new VError('only simple names can be sliced', n.line);
        const r = lookup(sc, n.base.name, n.line);
        const m = Number(constVal(n.msb, sc)), l = Number(constVal(n.lsb, sc));
        const hi = Math.max(m, l), lo = Math.min(m, l), w = hi - lo + 1;
        if (r.param) { const p = r.param; return { w, s: false, sigs, ev: (cw) => ((p.v >> BigInt(lo)) & mask(w)) & mask(cw) }; }
        const s = r.sig; rd(s);
        if (hi >= s.w) sc.sim.warn(`part-select [${m}:${l}] is outside '${s.name}' (width ${s.w})`, n.line);
        return { w, s: false, sigs, ev: (cw) => ((s.v >> BigInt(lo)) & mask(w)) & mask(cw) };
      }
      case 'ipart': {
        const r = lookup(sc, n.base.name, n.line);
        const st = sub(n.start); const w = Number(constVal(n.width, sc));
        const s = r.sig; rd(s);
        return { w, s: false, sigs, ev: (cw) => { let lo = Number(st.ev(32, false)); if (!n.up) lo = lo - w + 1; return lo < 0 ? 0n : ((s.v >> BigInt(lo)) & mask(w)) & mask(cw); } };
      }
      case 'cat': {
        const parts = n.parts.map(sub);
        const w = parts.reduce((a, c) => a + c.w, 0);
        return { w, s: false, sigs, ev: (cw) => { let v = 0n; for (const c of parts) v = (v << BigInt(c.w)) | c.ev(c.w, false); return v & mask(cw); } };
      }
      case 'rep': {
        const cnt = Number(constVal(n.n, sc));
        const parts = n.parts.map(sub);
        const pw = parts.reduce((a, c) => a + c.w, 0);
        return { w: pw * cnt, s: false, sigs, ev: (cw) => { let one = 0n; for (const c of parts) one = (one << BigInt(c.w)) | c.ev(c.w, false); let v = 0n; for (let i = 0; i < cnt; i++) v = (v << BigInt(pw)) | one; return v & mask(cw); } };
      }
      case 'un': {
        const a = sub(n.a);
        switch (n.op) {
          case '~': return { w: a.w, s: a.s, sigs, ev: (cw, sx) => (~a.ev(cw, sx && a.s)) & mask(cw) };
          case '-': return { w: a.w, s: a.s, sigs, ev: (cw, sx) => (-a.ev(cw, sx && a.s)) & mask(cw) };
          case '+': return a;
          case '!': return { w: 1, s: false, sigs, ev: () => (a.ev(a.w, false) === 0n ? 1n : 0n) };
          case '&': return { w: 1, s: false, sigs, ev: () => (a.ev(a.w, false) === mask(a.w) ? 1n : 0n) };
          case '~&': return { w: 1, s: false, sigs, ev: () => (a.ev(a.w, false) === mask(a.w) ? 0n : 1n) };
          case '|': return { w: 1, s: false, sigs, ev: () => (a.ev(a.w, false) !== 0n ? 1n : 0n) };
          case '~|': return { w: 1, s: false, sigs, ev: () => (a.ev(a.w, false) !== 0n ? 0n : 1n) };
          case '^': return { w: 1, s: false, sigs, ev: () => popParity(a.ev(a.w, false)) };
          case '~^': return { w: 1, s: false, sigs, ev: () => popParity(a.ev(a.w, false)) ^ 1n };
        }
        break;
      }
      case 'bin': {
        const a = sub(n.a), b = sub(n.b);
        const op = n.op;
        if (['==', '!=', '===', '!==', '<', '<=', '>', '>='].includes(op)) {
          const ow = Math.max(a.w, b.w), s = a.s && b.s;
          return { w: 1, s: false, sigs, ev: () => {
            let x = a.ev(ow, s), y = b.ev(ow, s);
            if (s) { x = toS(x, ow); y = toS(y, ow); }
            let r;
            switch (op) {
              case '==': case '===': r = x === y; break;
              case '!=': case '!==': r = x !== y; break;
              case '<': r = x < y; break; case '<=': r = x <= y; break;
              case '>': r = x > y; break; default: r = x >= y;
            }
            return r ? 1n : 0n;
          } };
        }
        if (op === '&&') return { w: 1, s: false, sigs, ev: () => (a.ev(a.w, false) !== 0n && b.ev(b.w, false) !== 0n ? 1n : 0n) };
        if (op === '||') return { w: 1, s: false, sigs, ev: () => (a.ev(a.w, false) !== 0n || b.ev(b.w, false) !== 0n ? 1n : 0n) };
        if (['<<', '>>', '<<<', '>>>'].includes(op)) {
          return { w: a.w, s: a.s, sigs, ev: (cw, sx) => {
            const l = a.ev(cw, sx && a.s); const amt = b.ev(b.w, false);
            if (amt > 4096n) return 0n;
            const k = BigInt(amt);
            if (op === '<<' || op === '<<<') return (l << k) & mask(cw);
            if (op === '>>' || !(a.s && sx)) return l >> k;
            return (toS(l, cw) >> k) & mask(cw);
          } };
        }
        const w = Math.max(a.w, b.w), s = a.s && b.s;
        return { w, s, sigs, ev: (cw, sx) => {
          const sg = sx && s;
          let x = a.ev(cw, sg), y = b.ev(cw, sg), r;
          switch (op) {
            case '+': r = x + y; break;
            case '-': r = x - y; break;
            case '*': r = x * y; break;
            case '/': if (y === 0n) return 0n; r = sg ? toS(x, cw) / toS(y, cw) : x / y; break;
            case '%': if (y === 0n) return 0n; r = sg ? toS(x, cw) % toS(y, cw) : x % y; break;
            case '&': r = x & y; break;
            case '|': r = x | y; break;
            case '^': r = x ^ y; break;
            case '~^': r = ~(x ^ y); break;
            case '**': r = x ** (y > 4096n ? 4096n : y); break;
            default: throw new VError(`operator ${op} not supported`, n.line);
          }
          return r & mask(cw);
        } };
      }
      case 'tern': {
        const c = sub(n.c), a = sub(n.a), b = sub(n.b);
        const w = Math.max(a.w, b.w), s = a.s && b.s;
        return { w, s, sigs, ev: (cw, sx) => (c.ev(c.w, false) !== 0n ? a.ev(cw, sx && s) : b.ev(cw, sx && s)) };
      }
      case 'call': {
        const args = n.args.map(sub);
        switch (n.name) {
          case '$time': case '$stime': return { w: 64, isTime: true, s: false, sigs, ev: (cw) => BigInt(sc.sim.time) & mask(cw) };
          case '$random': case '$urandom': return { w: 32, s: n.name === '$random', sigs, ev: (cw) => { const S = sc.sim; S.seed = (Math.imul(S.seed, 1103515245) + 12345) >>> 0; return BigInt(S.seed) & mask(cw); } };
          case '$signed': return { w: args[0].w, s: true, sigs, ev: (cw, sx) => ext(args[0].ev(args[0].w, false), args[0].w, cw, sx) & mask(cw) };
          case '$unsigned': return { w: args[0].w, s: false, sigs, ev: (cw) => args[0].ev(args[0].w, false) & mask(cw) };
          case '$clog2': return { w: 32, s: true, sigs, ev: (cw) => BigInt(clog2(args[0].ev(args[0].w, false))) & mask(cw) };
          default: throw new VError(`system function ${n.name} is not supported`, n.line);
        }
      }
    }
    throw new VError('unsupported expression', n.line);
  }
  function constVal(e, sc) { const c = compileExpr(e, sc); return c.ev(c.w, c.s); }

  /* --------------------------------------------------------- lvalues */
  function compileLvalue(n, sc, ctx, line) {
    const sim = sc.sim;
    const mk = (name) => {
      const s = sc.inst.sigs.get(name);
      if (!s) throw new VError(`'${name}' is not declared in module ${sc.mod.name}`, n.line || line);
      return s;
    };
    const check = (s) => {
      if (ctx === 'proc' && !s.isReg) throw new VError(`'${s.name}' is a wire/input and cannot be assigned inside always/initial; declare it as 'reg' (e.g. 'output reg ${s.name}')`, n.line || line);
      if (ctx === 'proc' && s.dir === 'input') throw new VError(`'${s.name}' is an input and cannot be assigned`, n.line || line);
    };
    switch (n.k) {
      case 'id': {
        const s = mk(n.name); check(s);
        if (s.mem) throw new VError(`'${s.name}' is a memory; use ${s.name}[index]`, n.line);
        return { w: s.w, sig: s, lo: 0, hi: s.w - 1, bind: () => (v) => sim.setSig(s, v) };
      }
      case 'idx': {
        const s = mk(n.base.name); check(s);
        const ic = compileExpr(n.i, sc);
        const idxSigs = ic.sigs;
        if (s.mem) return { w: s.w, sig: s, lo: 0, hi: s.w - 1, idxSigs, bind: () => { const ix = Number(ic.ev(32, false)) - s.memLo; return (v) => sim.setMem(s, ix, v); } };
        const dyn = !ic.isNum;
        const cl = dyn ? 0 : Number(ic.ev(32, false));
        return { w: 1, sig: s, lo: dyn ? 0 : cl, hi: dyn ? s.w - 1 : cl, idxSigs, bind: () => {
          const ix = Number(ic.ev(32, false));
          return (v) => { if (ix < 0 || ix >= s.w) return; const m = 1n << BigInt(ix); sim.setSig(s, (s.v & ~m) | ((v & 1n) << BigInt(ix))); };
        } };
      }
      case 'rng': {
        const s = mk(n.base.name); check(s);
        const m = Number(constVal(n.msb, sc)), l = Number(constVal(n.lsb, sc));
        const hi = Math.max(m, l), lo = Math.min(m, l), w = hi - lo + 1;
        return { w, sig: s, lo, hi, bind: () => (v) => { const mm = mask(w) << BigInt(lo); sim.setSig(s, (s.v & ~mm) | ((v & mask(w)) << BigInt(lo))); } };
      }
      case 'cat': {
        const parts = n.parts.map((p) => compileLvalue(p, sc, ctx, line));
        const w = parts.reduce((a, c) => a + c.w, 0);
        return { w, parts, idxSigs: parts.flatMap((p) => p.idxSigs ? [...p.idxSigs] : []), bind: () => {
          const ws = parts.map((p) => p.bind());
          return (v) => { let sh = 0n; for (let i = parts.length - 1; i >= 0; i--) { ws[i]((v >> sh) & mask(parts[i].w)); sh += BigInt(parts[i].w); } };
        } };
      }
    }
    throw new VError('left-hand side of an assignment must be a signal, bit/part-select or concatenation', n.line || line);
  }

  /* ------------------------------------------------------- processes */
  function collectAssigned(stmt, out) {
    // names assigned anywhere in a statement tree
    if (!stmt) return;
    switch (stmt.k) {
      case 'assign': addLhsNames(stmt.lhs, out); break;
      case 'block': stmt.stmts.forEach((s) => collectAssigned(s, out)); break;
      case 'if': collectAssigned(stmt.a, out); collectAssigned(stmt.b, out); break;
      case 'case': stmt.items.forEach((i) => collectAssigned(i.s, out)); break;
      case 'for': collectAssigned(stmt.init, out); collectAssigned(stmt.body, out); collectAssigned(stmt.step, out); break;
      case 'while': case 'repeat': case 'forever': collectAssigned(stmt.body, out); break;
      case 'delay': case 'event': case 'wait': collectAssigned(stmt.s, out); break;
    }
  }
  function addLhsNames(l, out) {
    if (l.k === 'id') out.add(l.name); else if (l.k === 'idx' || l.k === 'rng' || l.k === 'ipart') out.add(l.base.name);
    else if (l.k === 'cat') l.parts.forEach((p) => addLhsNames(p, out));
  }
  // definitely-assigned analysis (for latch inference warnings)
  function definite(stmt, sc) {
    const out = new Set();
    if (!stmt) return out;
    switch (stmt.k) {
      case 'assign': addLhsNames(stmt.lhs, out); return out;
      case 'block': stmt.stmts.forEach((s) => definite(s, sc).forEach((x) => out.add(x))); return out;
      case 'if': {
        if (!stmt.b) return out;
        const a = definite(stmt.a, sc), b = definite(stmt.b, sc);
        a.forEach((x) => { if (b.has(x)) out.add(x); });
        return out;
      }
      case 'case': {
        const hasDefault = stmt.items.some((i) => !i.labels);
        let full = hasDefault;
        if (!full) {
          try {
            const sel = compileExpr(stmt.e, sc);
            if (sel.w <= 8) {
              const seen = new Set(); let wild = false;
              for (const it of stmt.items) for (const l of it.labels) { if (l.k === 'num') { if (l.wz || l.wx) wild = true; seen.add(l.v.toString()); } else wild = true; }
              if (!wild && seen.size >= 2 ** sel.w) full = true;
            }
          } catch (e) { /* ignore */ }
        }
        if (!full) return out;
        let acc = null;
        for (const it of stmt.items) {
          const d = definite(it.s, sc);
          acc = acc ? new Set([...acc].filter((x) => d.has(x))) : d;
        }
        return acc || out;
      }
      case 'event': case 'delay': return definite(stmt.s, sc);
      case 'for': case 'while': case 'repeat': case 'forever': return out;
    }
    return out;
  }
  function stmtUses(stmt, f) {
    if (!stmt) return;
    f(stmt);
    switch (stmt.k) {
      case 'block': stmt.stmts.forEach((s) => stmtUses(s, f)); break;
      case 'if': stmtUses(stmt.a, f); stmtUses(stmt.b, f); break;
      case 'case': stmt.items.forEach((i) => stmtUses(i.s, f)); break;
      case 'for': stmtUses(stmt.body, f); break;
      case 'while': case 'repeat': case 'forever': stmtUses(stmt.body, f); break;
      case 'delay': case 'event': case 'wait': stmtUses(stmt.s, f); break;
    }
  }

  function compileProcess(sim, sc, it, noteDriver) {
    const reads = new Set();
    sc.reads = reads;
    const procKey = {};
    let kind = 'comb'; // comb | seq | init | other
    let st = it.s, evlist = null;
    if (it.k === 'initial') kind = 'init';
    else if (st.k === 'event') {
      if (st.ev === '*') kind = 'star';
      else if (st.ev.some((e) => e.edge !== 'any')) kind = 'seq';
      else kind = 'list';
      evlist = st.ev;
    } else kind = 'other';

    const procInfo = { kind, writes: new Set() };
    const ctx = { sc, procKey, noteDriver, kind };
    const lineOf = it.line;
    let bodyStmt = st;
    if ((kind === 'star' || kind === 'list' || kind === 'seq') && it.k === 'always') bodyStmt = st.s;

    const body = compileStmt(bodyStmt, ctx);
    const proc = { kind: 'proc', done: false, gen: null, line: lineOf };

    // lint
    const asg = new Set(); collectAssigned(bodyStmt, asg);
    if (kind === 'seq') {
      stmtUses(bodyStmt, (s) => { if (s.k === 'assign' && !s.nb && !isLoopVar(s, sc)) sim.warn(`blocking assignment '=' in a clocked always block; use non-blocking '<=' for registers`, s.line); });
    }
    if (kind === 'star' || kind === 'list') {
      stmtUses(bodyStmt, (s) => { if (s.k === 'assign' && s.nb) sim.warn(`non-blocking '<=' in a combinational always block; use blocking '=' for combinational logic`, s.line); });
      const d = definite(bodyStmt, sc);
      const latch = [...asg].filter((x) => !d.has(x) && !(sc.inst.sigs.get(x) && sc.inst.sigs.get(x).signed && sc.inst.sigs.get(x).w === 32 && !sc.inst.sigs.get(x).isPort));
      if (latch.length) sim.warn(`combinational always block does not assign ${latch.join(', ')} in every branch: this infers a latch (add an 'else' / 'default' or give it a default value first)`, lineOf);
    }
    if (kind === 'list') {
      const listed = new Set(); evlist.forEach((e) => { compileExpr(e.e, sc).sigs.forEach((s) => listed.add(s)); });
      const missing = [...reads].filter((s) => !listed.has(s) && !asg.has(s.name) && !s.signed).map((s) => s.name);
      if (missing.length) sim.warn(`sensitivity list is missing: ${missing.join(', ')} (the output will not update when they change; use always @*)`, lineOf);
    }

    if (kind === 'init') {
      proc.gen = (function* () { yield* body(); })();
    } else if (kind === 'star') {
      const sens = [...reads].map((s) => [s, 'any']);
      proc.gen = (function* () { for (;;) { yield* body(); if (sim.finished) return; yield { w: sens.length ? sens : [[{ wany: [] }, 'any']] }; } })();
    } else if (kind === 'list' || kind === 'seq') {
      const waits = [];
      for (const e of evlist) {
        const c = compileExpr(e.e, sc);
        for (const s of c.sigs) waits.push([s, e.edge]);
      }
      proc.gen = (function* () { for (;;) { yield { w: waits }; if (sim.finished) return; sim.ops++; yield* body(); } })();
    } else { // always with its own leading delay/other
      proc.gen = (function* () { for (;;) { sim.ops++; if (sim.ops > 3000000) throw new VError('always block runs forever without a delay or event control (add #delay or @(...))', lineOf); yield* body(); if (sim.finished) return; } })();
    }
    sc.reads = null;
    sim.procs.push(proc);
  }
  function isLoopVar(s, sc) {
    if (s.lhs.k !== 'id') return false;
    const sig = sc.inst.sigs.get(s.lhs.name);
    return sig && sig.signed && sig.w === 32 && !sig.isPort; // integer loop counters
  }

  function compileStmt(n, ctx) {
    const { sc } = ctx, sim = sc.sim;
    switch (n.k) {
      case 'null': return function* () {};
      case 'block': {
        const parts = [];
        for (const s of n.stmts) {
          if (s.k === 'decl') { /* local decl: declare */
            for (const nm of s.names) if (!sc.inst.sigs.has(nm.name)) {
              const w = s.kind === 'integer' ? 32 : (s.range ? Math.abs(Number(constVal(s.range.msb, sc)) - Number(constVal(s.range.lsb, sc))) + 1 : 1);
              const sg = new Sig(nm.name, sc.inst.path + '.' + nm.name, w, s.signed); sg.isReg = true;
              sc.inst.sigs.set(nm.name, sg); sim.sigs.push(sg);
            }
            continue;
          }
          parts.push(compileStmt(s, ctx));
        }
        return function* () { for (const p of parts) { yield* p(); if (sim.finished) return; } };
      }
      case 'if': {
        const c = compileExpr(n.c, sc), a = compileStmt(n.a, ctx), b = n.b ? compileStmt(n.b, ctx) : null;
        return function* () { if (c.ev(c.w, false) !== 0n) yield* a(); else if (b) yield* b(); };
      }
      case 'case': {
        const sel = compileExpr(n.e, sc);
        const items = n.items.map((it) => ({
          labels: it.labels ? it.labels.map((l) => ({ c: compileExpr(l, sc), node: l })) : null,
          body: compileStmt(it.s, ctx),
        }));
        const kind = n.kind;
        return function* () {
          let chosen = null;
          outer: for (const it of items) {
            if (!it.labels) continue;
            for (const l of it.labels) {
              const ow = Math.max(sel.w, l.c.w);
              const sv = sel.ev(ow, false), lv = l.c.ev(ow, false);
              let m = mask(ow);
              if (l.node.k === 'num') {
                if (kind === 'casez') m &= ~l.node.wz;
                else if (kind === 'casex') m &= ~(l.node.wz | l.node.wx);
              }
              if ((sv & m) === (lv & m)) { chosen = it; break outer; }
            }
          }
          if (!chosen) chosen = items.find((i) => !i.labels);
          if (chosen) yield* chosen.body();
        };
      }
      case 'for': {
        const init = compileStmt(n.init, ctx), step = compileStmt(n.step, ctx), c = compileExpr(n.cond, sc), body = compileStmt(n.body, ctx);
        return function* () {
          let g = 0;
          for (yield* init(); c.ev(c.w, c.s) !== 0n; yield* step()) {
            if (++g > 1000000) throw new VError('for loop ran more than 1,000,000 iterations (infinite loop?)', n.line);
            yield* body(); if (sim.finished) return;
          }
        };
      }
      case 'while': {
        const c = compileExpr(n.c, sc), body = compileStmt(n.body, ctx);
        return function* () { let g = 0; while (c.ev(c.w, false) !== 0n) { if (++g > 1000000) throw new VError('while loop ran more than 1,000,000 iterations', n.line); yield* body(); if (sim.finished) return; } };
      }
      case 'repeat': {
        const c = compileExpr(n.c, sc), body = compileStmt(n.body, ctx);
        return function* () { const k = Number(c.ev(c.w, false)); for (let i = 0; i < k; i++) { yield* body(); if (sim.finished) return; } };
      }
      case 'forever': {
        const body = compileStmt(n.body, ctx);
        return function* () {
          for (;;) {
            sim.ops++; if (sim.ops > 3000000) throw new VError("'forever' loop without a delay or event control never lets time advance", n.line);
            yield* body(); if (sim.finished) return;
          }
        };
      }
      case 'wait': {
        const c = compileExpr(n.c, sc), body = compileStmt(n.s, ctx);
        return function* () { while (c.ev(c.w, false) === 0n) yield { w: [...c.sigs].map((s) => [s, 'any']) }; yield* body(); };
      }
      case 'delay': {
        const d = compileExpr(n.d, sc), body = compileStmt(n.s, ctx);
        return function* () { yield { d: d.ev(32, false) }; yield* body(); };
      }
      case 'event': {
        const body = compileStmt(n.s, ctx);
        let waits;
        if (n.ev === '*') throw new VError("'@*' is only supported at the start of an always block", n.line);
        if (false) { waits = null; }
        else { waits = []; for (const e of n.ev) { const c = compileExpr(e.e, sc); for (const s of c.sigs) waits.push([s, e.edge]); } }
        return function* () { yield { w: waits }; yield* body(); };
      }
      case 'assign': {
        const lhs = compileLvalue(n.lhs, sc, 'proc', n.line);
        const rhs = compileExpr(n.rhs, sc);
        const w = Math.max(lhs.w, rhs.w);
        const delay = n.delay ? compileExpr(n.delay, sc) : null;
        ctx.noteDriver(lhs, 'proc', n.line, ctx.procKey);
        if (n.nb) {
          return function* () {
            const v = rhs.ev(w, rhs.s) & mask(lhs.w);
            const wr = lhs.bind();
            if (delay) sim.schedule(sim.time + Number(delay.ev(32, false)), () => wr(v));
            else sim.nba.push(() => wr(v));
          };
        }
        return function* () {
          const v = rhs.ev(w, rhs.s) & mask(lhs.w);
          if (delay) yield { d: delay.ev(32, false) };
          lhs.bind()(v);
        };
      }
      case 'sys': return compileSys(n, ctx);
    }
    throw new VError(`unsupported statement '${n.k}'`, n.line);
  }
  function compileSys(n, ctx) {
    const { sc } = ctx, sim = sc.sim;
    const args = n.args.map((a) => (a.k === 'str' ? { isStr: true, str: a.v, w: 8, s: false, ev: () => 0n } : compileExpr(a, sc)));
    switch (n.name) {
      case '$display': case '$write': {
        const nl = n.name === '$display';
        return function* () {
          const txt = sim.fmtArgs(args);
          if (nl) { sim.log.push((sim.pend || '') + txt); sim.pend = ''; } else sim.pend = (sim.pend || '') + txt;
        };
      }
      case '$strobe': return function* () { sim.strobes.push({ fmt: args[0] && args[0].str, args: args.slice(1) }); };
      case '$monitor': return function* () { sim.monitor = { args, last: null }; };
      case '$finish': case '$stop': return function* () { sim.finished = true; };
      case '$dumpfile': case '$dumpvars': case '$monitoron': case '$monitoroff': case '$timeformat': return function* () {};
      default: throw new VError(`system task ${n.name} is not supported`, n.line);
    }
  }

  V.build = build;
  V.mask = mask;
})(typeof window !== 'undefined' ? window : globalThis);
