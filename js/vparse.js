/* Verilog lexer + parser (the subset taught in SC1005).
 * Exposes globalThis.V.parse(src) -> { modules: {name: moduleAST}, order: [names] }
 * Errors are thrown as VError { line, message }.
 */
(function (root) {
  'use strict';
  const V = (root.V = root.V || {});

  class VError extends Error {
    constructor(message, line) { super(message); this.line = line || 0; this.name = 'VError'; }
  }
  V.VError = VError;

  /* ---------------------------------------------------------- preprocess */
  function preprocess(src) {
    const defs = {};
    const out = [];
    for (const raw of src.split('\n')) {
      const t = raw.trim();
      let m;
      if (/^`timescale/.test(t) || /^`include/.test(t) || /^`default_nettype/.test(t) ||
          /^`(ifdef|ifndef|else|endif|undef|resetall)\b/.test(t)) { out.push(''); continue; }
      if ((m = /^`define\s+(\w+)\s*(.*)$/.exec(t))) { defs[m[1]] = m[2].replace(/\/\/.*$/, '').trim(); out.push(''); continue; }
      out.push(raw);
    }
    let s = out.join('\n');
    // macro use (non-recursive, 3 passes)
    for (let i = 0; i < 3; i++) s = s.replace(/`(\w+)/g, (all, n) => (n in defs ? defs[n] : all));
    return s;
  }

  /* ---------------------------------------------------------------- lexer */
  const KEYWORDS = new Set(['module', 'endmodule', 'input', 'output', 'inout', 'wire', 'reg', 'integer', 'parameter',
    'localparam', 'assign', 'always', 'initial', 'begin', 'end', 'if', 'else', 'case', 'casez', 'casex', 'endcase',
    'default', 'for', 'while', 'repeat', 'forever', 'posedge', 'negedge', 'or', 'signed', 'unsigned', 'genvar',
    'generate', 'endgenerate', 'function', 'endfunction', 'task', 'endtask', 'tri', 'supply0', 'supply1', 'wait',
    'real', 'time', 'fork', 'join', 'deassign', 'force', 'release', 'specify', 'endspecify']);
  const GATES = new Set(['and', 'or', 'nand', 'nor', 'xor', 'xnor', 'not', 'buf']);
  const OPS3 = ['<<<', '>>>', '===', '!=='];
  const OPS2 = ['<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '~&', '~|', '~^', '^~', '**', '+:', '-:', '->'];

  function parseBased(sizeStr, signed, baseCh, digits, line) {
    const base = { b: 2, o: 8, d: 10, h: 16 }[baseCh.toLowerCase()];
    const bitsPer = { 2: 1, 8: 3, 16: 4, 10: 0 }[base];
    digits = digits.replace(/_/g, '');
    let v = 0n, wz = 0n, wx = 0n;
    if (base === 10) {
      if (/[xXzZ?]/.test(digits)) { wx = -1n; v = 0n; } else v = BigInt(digits);
    } else {
      for (const ch of digits) {
        v <<= BigInt(bitsPer); wz <<= BigInt(bitsPer); wx <<= BigInt(bitsPer);
        const all = (1n << BigInt(bitsPer)) - 1n;
        if (ch === 'x' || ch === 'X') wx |= all;
        else if (ch === 'z' || ch === 'Z' || ch === '?') wz |= all;
        else {
          const d = parseInt(ch, base);
          if (Number.isNaN(d)) throw new VError(`bad digit '${ch}' in ${base}-based literal`, line);
          v |= BigInt(d);
        }
      }
    }
    let w = sizeStr ? parseInt(sizeStr.replace(/_/g, ''), 10) : 32;
    if (w <= 0) throw new VError('literal width must be positive', line);
    const m = (1n << BigInt(w)) - 1n;
    // x/z extension of a leading x/z digit is rarely used; keep simple
    return { k: 'num', v: v & m, w, wz: wz & m, wx: wx & m, s: !!signed, sized: !!sizeStr, line };
  }

  function lex(src) {
    const toks = [];
    let i = 0, line = 1;
    const n = src.length;
    const push = (t, v, extra) => toks.push(Object.assign({ t, v, line }, extra || {}));
    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') {
        i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
        if (i >= n) throw new VError('unterminated /* comment', line);
        i += 2; continue;
      }
      if (c === '"') {
        let j = i + 1, s = '';
        while (j < n && src[j] !== '"') {
          if (src[j] === '\\' && j + 1 < n) {
            const e = src[j + 1];
            s += e === 'n' ? '\n' : e === 't' ? '\t' : e;
            j += 2;
          } else { if (src[j] === '\n') line++; s += src[j++]; }
        }
        if (j >= n) throw new VError('unterminated string', line);
        push('str', s); i = j + 1; continue;
      }
      // numbers: 4'b1010, 'hFF, 12, 8'sd5
      if (/[0-9]/.test(c) || (c === "'" && /[sSbBoOdDhH]/.test(src[i + 1] || ''))) {
        const m = /^([0-9][0-9_]*)?\s*'([sS])?([bBoOdDhH])\s*([0-9a-fA-FxXzZ?_]+)/.exec(src.slice(i, i + 120));
        if (m) {
          const num = parseBased(m[1], m[2], m[3], m[4], line);
          toks.push(Object.assign({ t: 'num', v: null }, num));
          i += m[0].length; continue;
        }
        const d = /^[0-9][0-9_]*/.exec(src.slice(i, i + 40))[0];
        if (src[i + d.length] === '.') throw new VError('real numbers are not supported', line);
        toks.push({ t: 'num', v: null, k: 'num', val: null, line, ...{ v: BigInt(d.replace(/_/g, '')), w: 32, wz: 0n, wx: 0n, s: true, sized: false } });
        i += d.length; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i + 1;
        while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
        const w = src.slice(i, j);
        push(KEYWORDS.has(w) ? 'kw' : 'id', w); i = j; continue;
      }
      if (c === '$') {
        let j = i + 1;
        while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        push('sys', src.slice(i, j)); i = j; continue;
      }
      if (c === '\\') { // escaped identifier
        let j = i + 1; while (j < n && !/\s/.test(src[j])) j++;
        push('id', src.slice(i + 1, j)); i = j; continue;
      }
      const s3 = src.substr(i, 3), s2 = src.substr(i, 2);
      if (OPS3.includes(s3)) { push('op', s3); i += 3; continue; }
      if (OPS2.includes(s2)) { push('op', s2); i += 2; continue; }
      if ('+-*/%&|^~!<>=?:;,.()[]{}#@'.includes(c)) { push('op', c); i++; continue; }
      throw new VError(`unexpected character '${c}'`, line);
    }
    toks.push({ t: 'eof', v: '<end of file>', line });
    return toks;
  }

  /* --------------------------------------------------------------- parser */
  function parse(source) {
    const toks = lex(preprocess(source));
    let p = 0;
    const peek = (o = 0) => toks[Math.min(p + o, toks.length - 1)];
    const isOp = (v, o = 0) => { const t = peek(o); return t.t === 'op' && t.v === v; };
    const isKw = (v, o = 0) => { const t = peek(o); return t.t === 'kw' && t.v === v; };
    const err = (msg, tok) => { throw new VError(msg, (tok || peek()).line); };
    const next = () => toks[p++];
    const describe = (t) => (t.t === 'eof' ? 'end of file' : t.t === 'num' ? 'a number' : `'${t.v}'`);
    function expectOp(v, ctx) {
      if (!isOp(v)) err(`expected '${v}'${ctx ? ' ' + ctx : ''} but found ${describe(peek())}`);
      return next();
    }
    function expectKw(v) { if (!isKw(v)) err(`expected '${v}' but found ${describe(peek())}`); return next(); }
    function acceptOp(v) { if (isOp(v)) { p++; return true; } return false; }
    function acceptKw(v) { if (isKw(v)) { p++; return true; } return false; }
    function ident(ctx) {
      const t = peek();
      if (t.t !== 'id') err(`expected a name${ctx ? ' ' + ctx : ''} but found ${describe(t)}`);
      p++; return t.v;
    }

    /* ---- expressions ---- */
    function parseExpr() { return parseTernary(); }
    function parseTernary() {
      const c = parseBin(0);
      if (isOp('?')) {
        const line = next().line;
        const a = parseTernary(); expectOp(':', 'in ?: expression'); const b = parseTernary();
        return { k: 'tern', c, a, b, line };
      }
      return c;
    }
    const LEVELS = [['||'], ['&&'], ['|'], ['^', '~^', '^~'], ['&'], ['==', '!=', '===', '!=='],
      ['<', '<=', '>', '>='], ['<<', '>>', '<<<', '>>>'], ['+', '-'], ['*', '/', '%'], ['**']];
    function parseBin(lv) {
      if (lv >= LEVELS.length) return parseUnary();
      let l = parseBin(lv + 1);
      for (;;) {
        const t = peek();
        if (t.t === 'op' && LEVELS[lv].includes(t.v)) {
          p++;
          const r = parseBin(lv + 1);
          l = { k: 'bin', op: t.v === '^~' ? '~^' : t.v, a: l, b: r, line: t.line };
        } else return l;
      }
    }
    function parseUnary() {
      const t = peek();
      if (t.t === 'op' && ['+', '-', '!', '~', '&', '|', '^', '~&', '~|', '~^', '^~'].includes(t.v)) {
        p++;
        return { k: 'un', op: t.v === '^~' ? '~^' : t.v, a: parseUnary(), line: t.line };
      }
      return parsePostfix();
    }
    function parsePostfix() {
      let e = parsePrimary();
      while (isOp('[')) {
        const line = next().line;
        const i = parseExpr();
        if (acceptOp(':')) { const lsb = parseExpr(); expectOp(']'); e = { k: 'rng', base: e, msb: i, lsb, line }; }
        else if (isOp('+:') || isOp('-:')) {
          const up = next().v === '+:'; const w = parseExpr(); expectOp(']');
          e = { k: 'ipart', base: e, start: i, width: w, up, line };
        } else { expectOp(']'); e = { k: 'idx', base: e, i, line }; }
      }
      return e;
    }
    function parsePrimary() {
      const t = peek();
      if (t.t === 'num') { p++; return { k: 'num', v: t.v, w: t.w, wz: t.wz, wx: t.wx, s: t.s, sized: t.sized, line: t.line }; }
      if (t.t === 'str') { p++; return { k: 'str', v: t.v, line: t.line }; }
      if (t.t === 'id') {
        p++;
        let nm = t.v;
        while (isOp('.') && peek(1).t === 'id') { p++; nm += '.' + next().v; }
        return { k: 'id', name: nm, line: t.line };
      }
      if (t.t === 'sys') {
        p++;
        const args = [];
        if (acceptOp('(')) {
          if (!isOp(')')) { do args.push(parseExpr()); while (acceptOp(',')); }
          expectOp(')');
        }
        return { k: 'call', name: t.v, args, line: t.line };
      }
      if (isOp('(')) { p++; const e = parseExpr(); expectOp(')', 'to close the parenthesis'); return e; }
      if (isOp('{')) {
        const line = next().line;
        const first = parseExpr();
        if (isOp('{')) { // replication {n{...}}
          p++;
          const parts = [];
          do parts.push(parseExpr()); while (acceptOp(','));
          expectOp('}'); expectOp('}');
          return { k: 'rep', n: first, parts, line };
        }
        const parts = [first];
        while (acceptOp(',')) parts.push(parseExpr());
        expectOp('}', 'to close the concatenation');
        return { k: 'cat', parts, line };
      }
      err(`expected an expression but found ${describe(t)}`);
    }

    /* ---- statements ---- */
    function parseDelayValue() {
      // after '#': number | identifier | (expr)
      const t = peek();
      if (t.t === 'num') { p++; return { k: 'num', v: t.v, w: 32, wz: 0n, wx: 0n, s: true, line: t.line }; }
      if (t.t === 'id') { p++; return { k: 'id', name: t.v, line: t.line }; }
      if (isOp('(')) { p++; const e = parseExpr(); expectOp(')'); return e; }
      err("expected a delay value after '#'");
    }
    function parseEventControl() {
      // after '@'
      if (acceptOp('*')) return '*';
      expectOp('(', "after '@'");
      if (acceptOp('*')) { expectOp(')'); return '*'; }
      const evs = [];
      for (;;) {
        let edge = 'any';
        if (acceptKw('posedge')) edge = 'pos'; else if (acceptKw('negedge')) edge = 'neg';
        const e = parseExpr();
        evs.push({ edge, e });
        if (acceptKw('or') || acceptOp(',')) continue;
        break;
      }
      expectOp(')', 'to close the sensitivity list');
      return evs;
    }
    function isLvalueStart() { return peek().t === 'id' || isOp('{'); }
    function parseStmt() {
      const t = peek();
      const line = t.line;
      if (acceptOp(';')) return { k: 'null', line };
      if (t.t === 'kw') {
        switch (t.v) {
          case 'begin': {
            p++;
            if (acceptOp(':')) ident();
            const stmts = [];
            while (!isKw('end')) {
              if (peek().t === 'eof') err("missing 'end' for this 'begin'", t);
              // local declarations inside named blocks (integer i; reg x;)
              if (isKw('integer') || isKw('reg')) { stmts.push(parseDecl()); continue; }
              stmts.push(parseStmt());
            }
            p++;
            return { k: 'block', stmts, line };
          }
          case 'if': {
            p++; expectOp('(', "after 'if'");
            const c = parseExpr(); expectOp(')');
            const a = parseStmt();
            let b = null;
            if (acceptKw('else')) b = parseStmt();
            return { k: 'if', c, a, b, line };
          }
          case 'case': case 'casez': case 'casex': {
            p++; expectOp('(');
            const e = parseExpr(); expectOp(')');
            const items = [];
            while (!isKw('endcase')) {
              if (peek().t === 'eof') err("missing 'endcase'", t);
              let labels = null;
              if (acceptKw('default')) { acceptOp(':'); }
              else {
                labels = [];
                do labels.push(parseExpr()); while (acceptOp(','));
                expectOp(':', 'after the case label');
              }
              items.push({ labels, s: parseStmt() });
            }
            p++;
            return { k: 'case', kind: t.v, e, items, line };
          }
          case 'for': {
            p++; expectOp('(');
            const init = parseSimpleAssign(); expectOp(';');
            const cond = parseExpr(); expectOp(';');
            const step = parseSimpleAssign(); expectOp(')');
            return { k: 'for', init, cond, step, body: parseStmt(), line };
          }
          case 'while': { p++; expectOp('('); const c = parseExpr(); expectOp(')'); return { k: 'while', c, body: parseStmt(), line }; }
          case 'repeat': { p++; expectOp('('); const c = parseExpr(); expectOp(')'); return { k: 'repeat', c, body: parseStmt(), line }; }
          case 'forever': { p++; return { k: 'forever', body: parseStmt(), line }; }
          case 'wait': { p++; expectOp('('); const c = parseExpr(); expectOp(')'); return { k: 'wait', c, s: parseStmt(), line }; }
          case 'function': case 'task': case 'fork':
            err(`'${t.v}' is not supported by this simulator`);
            break;
          default: err(`unexpected '${t.v}'`);
        }
      }
      if (isOp('#')) { p++; const d = parseDelayValue(); return { k: 'delay', d, s: parseStmt(), line }; }
      if (isOp('@')) { p++; const ev = parseEventControl(); return { k: 'event', ev, s: parseStmt(), line }; }
      if (t.t === 'sys') {
        p++;
        const args = [];
        if (acceptOp('(')) {
          if (!isOp(')')) { do args.push(parseExpr()); while (acceptOp(',')); }
          expectOp(')');
        }
        expectOp(';', `after ${t.v}(...)`);
        return { k: 'sys', name: t.v, args, line };
      }
      if (isLvalueStart()) {
        const a = parseSimpleAssign();
        expectOp(';', 'at the end of the assignment');
        return a;
      }
      err(`unexpected ${describe(t)}`);
    }
    function parseSimpleAssign() {
      const line = peek().line;
      const lhs = parsePostfix();
      let nb;
      if (acceptOp('=')) nb = false;
      else if (acceptOp('<=')) nb = true;
      else err(`expected '=' or '<=' in assignment but found ${describe(peek())}`);
      let delay = null;
      if (acceptOp('#')) delay = parseDelayValue();
      const rhs = parseExpr();
      return { k: 'assign', lhs, rhs, nb, delay, line };
    }

    /* ---- declarations / items ---- */
    function parseRange() {
      if (!isOp('[')) return null;
      p++;
      const msb = parseExpr(); expectOp(':'); const lsb = parseExpr(); expectOp(']');
      return { msb, lsb };
    }
    function parseDecl() {
      const t = next(); // wire|reg|integer|tri|supply0|supply1
      const line = t.line;
      let kind = t.v === 'integer' ? 'integer' : t.v === 'reg' ? 'reg' : 'wire';
      let signed = false;
      if (acceptKw('signed')) signed = true; else acceptKw('unsigned');
      if (kind === 'integer') signed = true;
      const range = parseRange();
      const names = [];
      do {
        const nm = ident('in declaration');
        let dims = null, init = null;
        if (isOp('[')) { dims = parseRange(); }
        if (acceptOp('=')) init = parseExpr();
        names.push({ name: nm, dims, init });
      } while (acceptOp(','));
      expectOp(';', 'at the end of the declaration');
      return { k: 'decl', kind, signed, range, names, line };
    }

    function parsePortDecl(dirTok) { // input/output/inout ... ;   (body style)
      const dir = dirTok.v;
      let isReg = false, signed = false;
      if (acceptKw('wire')) { /* noop */ }
      if (acceptKw('reg')) isReg = true;
      if (acceptKw('signed')) signed = true;
      const range = parseRange();
      const names = [];
      do names.push(ident('in port declaration')); while (acceptOp(','));
      expectOp(';');
      return { k: 'portdecl', dir, isReg, signed, range, names, line: dirTok.line };
    }

    function parseParamItem(local) {
      const line = peek().line;
      parseRange(); acceptKw('signed');
      const list = [];
      do {
        const name = ident('in parameter declaration'); expectOp('=');
        list.push({ name, expr: parseExpr() });
      } while (acceptOp(','));
      expectOp(';');
      return { k: 'param', local, list, line };
    }

    function parseModule() {
      const mt = expectKw('module');
      const name = ident('after module');
      const mod = { name, params: [], ports: [], items: [], line: mt.line, ansi: false };
      if (isOp('#')) {
        p++; expectOp('(');
        do {
          acceptKw('parameter'); parseRange(); acceptKw('signed');
          const pn = ident('in parameter list'); expectOp('=');
          mod.params.push({ name: pn, expr: parseExpr() });
        } while (acceptOp(','));
        expectOp(')');
      }
      if (acceptOp('(')) {
        if (!isOp(')')) {
          if (isKw('input') || isKw('output') || isKw('inout')) {
            mod.ansi = true;
            let cur = null;
            do {
              if (isKw('input') || isKw('output') || isKw('inout')) {
                const d = next().v;
                let isReg = false, signed = false;
                acceptKw('wire');
                if (acceptKw('reg')) isReg = true;
                if (acceptKw('signed')) signed = true;
                cur = { dir: d, isReg, signed, range: parseRange() };
              } else if (!cur) err('expected input/output in port list');
              const pn = ident('in port list');
              mod.ports.push({ name: pn, dir: cur.dir, isReg: cur.isReg, signed: cur.signed, range: cur.range, line: toks[p - 1].line });
            } while (acceptOp(','));
          } else {
            do { const pn = ident('in port list'); mod.ports.push({ name: pn, dir: null, line: toks[p - 1].line }); } while (acceptOp(','));
          }
        }
        expectOp(')', 'to close the port list');
      }
      acceptOp(';') || err("expected ';' after the module header");
      while (!isKw('endmodule')) {
        if (peek().t === 'eof') err(`missing 'endmodule' for module ${name}`, mt);
        const it = parseItem(mod);
        if (it) mod.items.push(it);
      }
      p++;
      // merge non-ANSI port declarations into mod.ports
      if (!mod.ansi) {
        for (const it of mod.items) {
          if (it.k === 'portdecl') {
            for (const nm of it.names) {
              const port = mod.ports.find(q => q.name === nm);
              if (!port) throw new VError(`'${nm}' is declared ${it.dir} but is not in the port list of module ${name}`, it.line);
              Object.assign(port, { dir: it.dir, isReg: it.isReg || port.isReg, signed: it.signed, range: it.range });
            }
          }
        }
        for (const q of mod.ports) if (!q.dir) throw new VError(`port '${q.name}' of module ${name} has no direction (input/output)`, q.line);
      }
      return mod;
    }

    function parseItem(mod) {
      const t = peek();
      const line = t.line;
      if (t.t === 'kw') {
        switch (t.v) {
          case 'input': case 'output': case 'inout': p++; return parsePortDecl(t);
          case 'wire': case 'reg': case 'integer': case 'tri': case 'supply0': case 'supply1': return parseDecl();
          case 'real': case 'time': err(`'${t.v}' variables are not supported`); break;
          case 'genvar': case 'generate': case 'endgenerate': err(`'${t.v}' (generate blocks) is not supported by this simulator`); break;
          case 'function': case 'task': err(`'${t.v}' is not supported by this simulator`); break;
          case 'parameter': p++; return parseParamItem(false);
          case 'localparam': p++; return parseParamItem(true);
          case 'assign': {
            p++;
            let delay = null;
            if (acceptOp('#')) delay = parseDelayValue();
            const list = [];
            do {
              const lhs = parsePostfix(); expectOp('=', "in 'assign'");
              list.push({ lhs, rhs: parseExpr() });
            } while (acceptOp(','));
            expectOp(';', "at the end of 'assign'");
            return { k: 'assignc', list, delay, line };
          }
          case 'or': break;
          case 'always': { p++; return { k: 'always', s: parseStmt(), line }; }
          case 'initial': { p++; return { k: 'initial', s: parseStmt(), line }; }
          default: err(`unexpected '${t.v}' in module body`);
        }
      }
      if (t.t === 'id' || t.t === 'kw') {
        // gate primitive?
        if (t.t === 'kw' ? GATES.has(t.v) : false) { /* 'or' keyword handled below */ }
      }
      if ((t.t === 'id' && GATES.has(t.v)) || (t.t === 'kw' && t.v === 'or')) {
        p++;
        let delay = null;
        if (acceptOp('#')) delay = parseDelayValue();
        const gates = [];
        do {
          let gname = null;
          if (peek().t === 'id') gname = next().v;
          expectOp('(', 'in gate instance');
          const terms = [];
          do terms.push(parseExpr()); while (acceptOp(','));
          expectOp(')');
          if (terms.length < 2 && t.v !== 'not' && t.v !== 'buf') err(`gate '${t.v}' needs an output and at least one input`, t);
          gates.push({ type: t.v === 'or' ? 'or' : t.v, name: gname, terms, delay, line });
        } while (acceptOp(','));
        expectOp(';', 'at the end of the gate instance');
        return { k: 'gates', list: gates, line };
      }
      if (t.t === 'id') {
        // module instance: Type [#(params)] name (conns);
        p++;
        const modName = t.v;
        const params = [];
        if (acceptOp('#')) {
          expectOp('(');
          if (!isOp(')')) {
            do {
              if (acceptOp('.')) { const pn = ident(); expectOp('('); const e = parseExpr(); expectOp(')'); params.push({ name: pn, expr: e }); }
              else params.push({ name: null, expr: parseExpr() });
            } while (acceptOp(','));
          }
          expectOp(')');
        }
        const insts = [];
        do {
          const iname = ident(`(instance name after module '${modName}')`);
          expectOp('(', 'in module instance');
          const conns = [];
          if (!isOp(')')) {
            do {
              if (acceptOp('.')) {
                const pn = ident(); expectOp('(');
                const e = isOp(')') ? null : parseExpr();
                expectOp(')'); conns.push({ name: pn, expr: e });
              } else conns.push({ name: null, expr: parseExpr() });
            } while (acceptOp(','));
          }
          expectOp(')');
          insts.push({ name: iname, conns });
        } while (acceptOp(','));
        expectOp(';', 'at the end of the module instance');
        return { k: 'inst', mod: modName, params, insts, line };
      }
      err(`unexpected ${describe(t)} in module body`);
    }

    const modules = {}, order = [];
    while (peek().t !== 'eof') {
      if (!isKw('module')) err(`expected 'module' but found ${describe(peek())}`);
      const m = parseModule();
      if (modules[m.name]) throw new VError(`module '${m.name}' is defined twice`, m.line);
      modules[m.name] = m; order.push(m.name);
    }
    return { modules, order };
  }

  V.parse = parse;
})(typeof window !== 'undefined' ? window : globalThis);
