/* Unlimited generated drills. Each drill: {id, title, desc, gen(rnd) -> {html, fields:[{key,label,type?,options?}], check(vals)->{ok,msg,partial?}, solution}}
 * rnd = seeded PRNG () => [0,1).  Answers are verified with real arithmetic / the Verilog simulator, so they are trustworthy.
 */
window.SC = window.SC || {};
(function () {
  const ri = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
  const hex = (v, w) => v.toString(16).toUpperCase().padStart(w, '0');
  const bin = (v, w) => v.toString(2).padStart(w, '0');
  const cleanNum = (s) => s.trim().replace(/\s+/g, '').replace(/^0x/i, '').replace(/_/g, '').toUpperCase();
  const stripZeros = (s) => { const t = s.replace(/^0+(?=.)/, ''); return t === '' ? '0' : t; };
  SC.rng = (seed) => { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

  const D = [];

  /* ---------------------------------------------------------- base conversion */
  D.push({
    id: 'base', title: 'Number base conversion', desc: 'Binary / octal / decimal / hex, integers and fractions.',
    gen(rnd, opts) {
      const kind = opts && opts.kind != null ? opts.kind : ri(rnd, 0, 5);
      let q, ans, steps, label;
      if (kind === 0) { const n = ri(rnd, 20, 250); q = `Convert decimal **${n}** to binary.`; ans = n.toString(2); label = 'binary'; steps = `${n} ÷ 2 repeatedly, remainders bottom→top = ${ans}`; }
      else if (kind === 1) { const n = ri(rnd, 32, 255); q = `Convert binary **${bin(n, 8)}** to hexadecimal.`; ans = hex(n, 1); label = 'hex'; steps = `${bin(n, 8).slice(0, 4)} | ${bin(n, 8).slice(4)} → ${ans}`; }
      else if (kind === 2) { const n = ri(rnd, 100, 4000); q = `Convert hexadecimal **${hex(n, 1)}** to decimal.`; ans = String(n); label = 'decimal'; steps = hex(n, 1).split('').map((c, i, a) => `${parseInt(c, 16)}×16^${a.length - 1 - i}`).join(' + ') + ` = ${n}`; }
      else if (kind === 3) { const n = ri(rnd, 30, 500); q = `Convert octal **${n.toString(8)}** to decimal.`; ans = String(n); label = 'decimal'; steps = n.toString(8).split('').map((c, i, a) => `${c}×8^${a.length - 1 - i}`).join(' + ') + ` = ${n}`; }
      else if (kind === 4) {
        const ip = ri(rnd, 10, 250), fnum = ri(rnd, 1, 999); const frac = fnum / 1000;
        let f = frac, s = '', st = [];
        for (let i = 0; i < 4; i++) { f *= 16; const d = Math.floor(f + 1e-12); st.push(`${(f).toFixed(3)} → ${d.toString(16).toUpperCase()}`); s += d.toString(16).toUpperCase(); f -= d; }
        q = `Convert decimal **${ip}.${String(fnum).padStart(3, '0')}** to hexadecimal with **4 hex digits after the point** (truncate, don't round).`;
        ans = hex(ip, 1) + '.' + s; label = 'hex'; steps = `integer part ${ip} = ${hex(ip, 1)}; fraction: ×16 repeatedly: ${st.join(', ')}`;
      }
      else { const n = ri(rnd, 16, 63); q = `Convert decimal **${n}** to octal and hexadecimal. Enter the **octal** value.`; ans = n.toString(8); label = 'octal'; steps = `${n} = ${n.toString(8)}₈ = ${hex(n, 1)}₁₆`; }
      return {
        html: `<p>${q}</p>`, fields: [{ key: 'a', label: `Answer (${label})` }],
        check: (v) => {
          let g = cleanNum(v.a || '');
          const want = ans.toUpperCase();
          const same = g.includes('.') ? g === want : stripZeros(g) === stripZeros(want);
          return { ok: same, msg: same ? 'Correct.' : `Not quite. Expected **${want}**.` };
        },
        solution: `**${ans}**: ${steps}`,
      };
    },
  });

  /* ------------------------------------------------------ 2's complement ops */
  D.push({
    id: 'twos', title: '8-bit 2’s complement add/subtract', desc: 'Exam-style: result in hex and overflow?',
    gen(rnd) {
      const a = ri(rnd, 0, 255), b = ri(rnd, 0, 255), sub = rnd() < 0.5;
      const sa = a > 127 ? a - 256 : a, sb = b > 127 ? b - 256 : b;
      const b2 = sub ? ((~b + 1) & 255) : b;
      const r = (a + b2) & 255, sr = r > 127 ? r - 256 : r;
      const trueVal = sub ? sa - sb : sa + sb;
      const ovf = trueVal < -128 || trueVal > 127;
      return {
        html: `<p>Perform the 8-bit signed 2’s complement operation below (values in hexadecimal) and state whether there is an overflow.</p><p class="big">${hex(a, 2)} ${sub ? '−' : '+'} ${hex(b, 2)}</p>`,
        fields: [{ key: 'r', label: 'Result (hex, 2 digits)' }, { key: 'o', label: 'Overflow?', type: 'select', options: ['', 'Yes', 'No'] }],
        check: (v) => {
          const rr = stripZeros(cleanNum(v.r || '')) === stripZeros(hex(r, 2));
          const oo = (v.o === 'Yes') === ovf && v.o;
          return { ok: rr && !!oo, msg: `${rr ? 'Result ✓' : 'Result ✗ (expected ' + hex(r, 2) + ')'}; ${oo ? 'overflow ✓' : 'overflow ✗ (expected ' + (ovf ? 'Yes' : 'No') + ')'}.` };
        },
        solution: `${hex(a, 2)} = ${sa}, ${hex(b, 2)} = ${sb}. ${sub ? `Subtraction: ${hex(a, 2)} + ~${hex(b, 2)} + 1 = ${hex(a, 2)} + ${hex(b2, 2)}.` : ''} 8-bit result = **${hex(r, 2)}** (${sr}). True value ${trueVal} ${ovf ? 'is outside −128…127: **overflow**' : 'fits in −128…127: **no overflow**'}.`,
      };
    },
  });

  /* ------------------------------------------------------------------- kmap */
  D.push({
    id: 'kmap', title: 'K-map simplification', desc: 'Minimum SOP or POS of a 4-variable function (any equivalent minimal answer accepted).',
    gen(rnd, opts) {
      const vars = ['A', 'B', 'C', 'D'];
      for (let tries = 0; ; tries++) {
        const ones = [], dcs = [];
        const k = ri(rnd, 6, 10), nd = rnd() < 0.4 ? ri(rnd, 1, 3) : 0;
        while (ones.length < k) { const m = ri(rnd, 0, 15); if (!ones.includes(m)) ones.push(m); }
        while (dcs.length < nd) { const m = ri(rnd, 0, 15); if (!ones.includes(m) && !dcs.includes(m)) dcs.push(m); }
        ones.sort((x, y) => x - y); dcs.sort((x, y) => x - y);
        const pos = opts && opts.form ? opts.form === 'pos' : rnd() < 0.4;
        const best = pos ? B.minPOS(vars, ones, dcs) : B.minSOP(vars, ones, dcs);
        if (best.literals < 3 || best.literals > 9) continue;
        const spec = `F(A,B,C,D) = Σ m(${ones.join(', ')})${dcs.length ? ' + d(' + dcs.join(', ') + ')' : ''}`;
        return {
          html: `<p>Using a Karnaugh map, obtain the minimum-cost <strong>${pos ? 'product-of-sums (POS)' : 'sum-of-products (SOP)'}</strong> expression for</p><p class="big">${spec}</p>
<details class="inl"><summary>Show a blank K-map with the minterms</summary>${B.kmapHTML(vars, ones, dcs)}</details>
<p class="muted">Write e.g. <code>A'B + CD'</code> (SOP) or <code>(A+B')(C+D)</code> (POS). Use ' for NOT.</p>`,
          fields: [{ key: 'e', label: `F = (${pos ? 'POS' : 'SOP'})`, wide: true }],
          check: (v) => {
            const r = B.checkExpr(v.e || '', vars, ones, dcs);
            if (r.parseError) return { ok: false, msg: 'Could not read your expression: ' + r.parseError };
            if (!r.ok) return { ok: false, msg: `Not equivalent: it is wrong for minterm ${r.wrongAt} (${bin(r.wrongAt, 4)}).` };
            if (r.literals <= best.literals) return { ok: true, msg: `Correct and minimal (${r.literals} literals).` };
            return { ok: false, partial: true, msg: `Equivalent, but not minimal: you used ${r.literals} literals, the minimum is ${best.literals}. Look for bigger groups.` };
          },
          solution: `Minimum ${pos ? 'POS' : 'SOP'}: **${best.str}** (${best.literals} literals).`,
        };
      }
    },
  });

  /* --------------------------------------------------------------- gray / bcd */
  D.push({
    id: 'codes', title: 'Gray code & BCD', desc: 'Binary ↔ Gray, decimal ↔ BCD.',
    gen(rnd, opts) {
      const kind = opts && opts.kind != null ? opts.kind : ri(rnd, 0, 3);
      if (kind === 0) { const n = ri(rnd, 1, 15); const g = n ^ (n >> 1); return { html: `<p>Convert binary <strong>${bin(n, 4)}</strong> to 4-bit Gray code.</p>`, fields: [{ key: 'a', label: 'Gray code' }], check: (v) => { const ok = cleanNum(v.a || '') === bin(g, 4); return { ok, msg: ok ? 'Correct.' : `Expected ${bin(g, 4)}.` }; }, solution: `g = b ⊕ (b>>1) = ${bin(n, 4)} ⊕ ${bin(n >> 1, 4)} = **${bin(g, 4)}**` }; }
      if (kind === 1) { const n = ri(rnd, 1, 15); const g = n ^ (n >> 1); return { html: `<p>Convert the 4-bit Gray code <strong>${bin(g, 4)}</strong> to straight binary.</p>`, fields: [{ key: 'a', label: 'Binary' }], check: (v) => { const ok = cleanNum(v.a || '') === bin(n, 4); return { ok, msg: ok ? 'Correct.' : `Expected ${bin(n, 4)}.` }; }, solution: `b₃ = g₃; bᵢ = bᵢ₊₁ ⊕ gᵢ → **${bin(n, 4)}**` }; }
      if (kind === 2) { const n = ri(rnd, 10, 99); const s = String(n).split('').map((d) => bin(+d, 4)).join(' '); return { html: `<p>Write decimal <strong>${n}</strong> in BCD (8421).</p>`, fields: [{ key: 'a', label: 'BCD' }], check: (v) => { const ok = cleanNum(v.a || '') === s.replace(/ /g, ''); return { ok, msg: ok ? 'Correct.' : `Expected ${s}.` }; }, solution: `Each digit separately: **${s}**` }; }
      const n = ri(rnd, 10, 99); const s = String(n).split('').map((d) => bin(+d, 4)).join(' ');
      return { html: `<p>Convert the BCD number <strong>${s}</strong> to decimal.</p>`, fields: [{ key: 'a', label: 'Decimal' }], check: (v) => { const ok = (v.a || '').trim() === String(n); return { ok, msg: ok ? 'Correct.' : `Expected ${n}.` }; }, solution: `**${n}**` };
    },
  });

  /* -------------------------------------------------- verilog: predict output */
  D.push({
    id: 'predict', title: 'Verilog: predict the register contents', desc: 'Exam-style: A, B, C after each clock edge (checked with the simulator).',
    gen(rnd) {
      const exprs = ['A ^ B', 'A ^ ~(B ^ C)', 'B & C', 'A | C', '~A', 'A ^ B ^ C', '(A & B) | C', '~(B ^ C)', 'A & ~C', 'B ^ C'];
      const ea = pick(rnd, exprs);
      const shape = ri(rnd, 0, 1);
      const body = shape === 0 ? `C <= B;\n    B <= A;\n    A <= ${ea};` : `C <= ${pick(rnd, ['B ^ C', 'A', 'B & A'])};\n    B <= A ^ C;\n    A <= ${ea};`;
      const code = `module mod1 (input clk, rst, output reg A, B, C);
  always @(posedge clk) begin
    if (rst) begin A <= 1'b0; B <= 1'b0; C <= 1'b0; end
    else begin
    ${body}
    end
  end
endmodule`;
      const init = [ri(rnd, 0, 1), ri(rnd, 0, 1), ri(rnd, 0, 1)];
      if (!init.some((x) => x)) init[ri(rnd, 0, 2)] = 1;
      // compute with the simulator: preload state through a testbench-free interactive run
      const sim = V.build(code, { top: 'mod1' });
      sim.start(); sim.settle();
      sim.find('A').v = BigInt(init[0]); sim.find('B').v = BigInt(init[1]); sim.find('C').v = BigInt(init[2]);
      const seq = [];
      for (let i = 0; i < 4; i++) { sim.poke('clk', 1); sim.settle(); sim.poke('clk', 0); sim.settle(); seq.push('' + sim.peek('A') + sim.peek('B') + sim.peek('C')); }
      return {
        html: `<p>For the Verilog module below, <code>rst = 0</code> and the initial state is <strong>ABC = ${init.join('')}</strong>. Give ABC after each of the next four rising clock edges (three bits each, e.g. <code>100</code>).</p><pre class="code"><code>${escHtml(code)}</code></pre>`,
        fields: [1, 2, 3, 4].map((i) => ({ key: 'e' + i, label: `After edge ${i}`, short: true })),
        check: (v) => {
          let good = 0; const bad = [];
          seq.forEach((s, i) => { if (cleanNum(v['e' + (i + 1)] || '') === s) good++; else bad.push(i + 1); });
          return { ok: good === 4, partial: good > 0 && good < 4, msg: good === 4 ? 'All four correct.' : `${good}/4 correct. Check edge${bad.length > 1 ? 's' : ''} ${bad.join(', ')}. Remember: right-hand sides use the OLD values.` };
        },
        solution: `ABC: ${init.join('')} → ${seq.join(' → ')}`,
      };
    },
  });

  /* ------------------------------------------------------- fsm output trace */
  D.push({
    id: 'fsm-trace', title: 'FSM: trace the output', desc: 'Moore FSM from tutorial 10; give the output for a random input sequence.',
    gen(rnd) {
      const next = { S0: ['S0', 'S1'], S1: ['S0', 'S2'], S2: ['S3', 'S2'], S3: ['S0', 'S2'] };
      const out = { S0: 0, S1: 0, S2: 1, S3: 1 };
      const n = ri(rnd, 8, 12); const ins = []; for (let i = 0; i < n; i++) ins.push(rnd() < 0.55 ? 1 : 0);
      let s = 'S0'; const states = [], outs = [];
      for (const i of ins) { s = next[s][i]; states.push(s); outs.push(out[s]); }
      return {
        html: `<p>A Moore FSM (reset state S0, output shown per state): S0 → (in=0: S0, in=1: S1); S1 → (0: S0, 1: S2); S2 → (0: S3, 1: S2); S3 → (0: S0, 1: S2). Outputs: S0 = 0, S1 = 0, S2 = 1, S3 = 1.</p>
<p>Starting in S0, the inputs on successive clock edges are <strong>${ins.join(' ')}</strong>. Give the output <em>after</em> each edge as a string of ${n} bits.</p>`,
        fields: [{ key: 'o', label: 'Outputs', wide: true }],
        check: (v) => { const g = (v.o || '').replace(/[^01]/g, ''); const ok = g === outs.join(''); return { ok, msg: ok ? 'Correct.' : `Expected ${outs.join('')}.` }; },
        solution: `States: ${states.join(' ')} → outputs **${outs.join('')}**`,
      };
    },
  });

  /* ---------------------------------------------------------- bcd adder step */
  D.push({
    id: 'bcdadd', title: 'BCD digit addition with correction', desc: 'Add two BCD digits; give the BCD result.',
    gen(rnd) {
      const a = ri(rnd, 0, 9), b = ri(rnd, 0, 9), c = ri(rnd, 0, 1);
      const t = a + b + c; const x = t > 9; const res = x ? t + 6 : t;
      const dig = (res & 15), carry = x ? 1 : 0;
      return {
        html: `<p>A BCD adder adds the digits <strong>${bin(a, 4)}</strong> and <strong>${bin(b, 4)}</strong> with carry-in <strong>${c}</strong>. Give the final BCD digit (4 bits) and the BCD carry-out.</p>`,
        fields: [{ key: 's', label: 'Sum digit (4 bits)', short: true }, { key: 'c', label: 'Carry-out', short: true }],
        check: (v) => { const ok = cleanNum(v.s || '') === bin(dig, 4) && (v.c || '').trim() === String(carry); return { ok, msg: ok ? 'Correct.' : `Expected sum ${bin(dig, 4)}, carry ${carry}.` }; },
        solution: `Binary sum = ${a} + ${b} + ${c} = ${t} = ${bin(t, 5)}. ${x ? 'Greater than 9: add 0110 → ' + bin(res, 5) + `. Digit = **${bin(dig, 4)}**, carry = **1**.` : `Not greater than 9: digit = **${bin(dig, 4)}**, carry = **0**.`}`,
      };
    },
  });

  SC.drills = D;
  SC.drillById = Object.fromEntries(D.map((d) => [d.id, d]));
})();
