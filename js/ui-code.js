/* Verilog UI: simulation panel, Playground, coding practice. */
(function () {
  'use strict';
  const SC = window.SC;
  const { esc, $, $$ } = SC;

  /* ------------------------------------------------------------------ examples */
  SC.examples = [
    { name: 'Half adder (truth table)', code: `module half_adder (input a, b, output s, c);
  assign s = a ^ b;
  assign c = a & b;
endmodule` },
    { name: 'Full adder (gate level)', code: `module full_adder (input a, b, cin, output s, cout);
  wire x1, a1, a2;
  xor g1 (x1, a, b);
  xor g2 (s, x1, cin);
  and g3 (a1, a, b);
  and g4 (a2, x1, cin);
  or  g5 (cout, a1, a2);
endmodule` },
    { name: '4-bit adder + testbench', code: `module add4 (input [3:0] a, b, input cin, output [3:0] s, output cout);
  assign {cout, s} = a + b + cin;
endmodule

module tb;
  reg [3:0] a, b; reg cin;
  wire [3:0] s; wire cout;
  add4 dut (.a(a), .b(b), .cin(cin), .s(s), .cout(cout));
  initial begin
    $monitor("t=%0t  %d + %d + %b = %d carry %b", $time, a, b, cin, s, cout);
    a = 4'd3;  b = 4'd4;  cin = 0;
    #10 a = 4'd9;  b = 4'd8;  cin = 1;
    #10 a = 4'd15; b = 4'd1;  cin = 0;
    #10 $finish;
  end
endmodule` },
    { name: '4:1 mux (case)', code: `module mux4 (input [3:0] d, input [1:0] s, output reg y);
  always @* begin
    case (s)
      2'b00: y = d[0];
      2'b01: y = d[1];
      2'b10: y = d[2];
      default: y = d[3];
    endcase
  end
endmodule` },
    { name: 'Latch warning demo (missing else)', code: `// The simulator warns about the inferred latch on y
module bad (input en, d, output reg y);
  always @* begin
    if (en) y = d;      // no else -> latch!
  end
endmodule` },
    { name: 'D flip-flop, sync reset (stepper)', code: `module dff (input clk, rst, d, output reg q);
  always @(posedge clk) begin
    if (rst) q <= 1'b0;
    else     q <= d;
  end
endmodule` },
    { name: 'Exam Q4: ABC registers + testbench', code: `module mod1 (input clk, rst, output reg A, B, C);
  always @(posedge clk) begin
    if (rst) begin
      A <= 1'b0; B <= 1'b0; C <= 1'b0;
    end else begin
      C <= B;
      B <= A;
      A <= A ^ ~(B ^ C);
    end
  end
endmodule

module tb;
  reg clk = 0, rst = 1;
  wire A, B, C;
  mod1 dut (.clk(clk), .rst(rst), .A(A), .B(B), .C(C));
  always #5 clk = ~clk;                // period 10
  initial begin
    #12 rst = 0;                        // release reset after first edge
    #80 $finish;
  end
endmodule` },
    { name: '4-bit counter + testbench', code: `module counter (input clk, rst, output reg [3:0] q);
  always @(posedge clk)
    if (rst) q <= 4'd0;
    else     q <= q + 4'd1;
endmodule

module tb;
  reg clk = 0, rst = 1;
  wire [3:0] q;
  counter dut (clk, rst, q);
  always #5 clk = ~clk;
  initial begin
    #12 rst = 0;
    #170 $finish;
  end
  initial $monitor("t=%0t q=%d", $time, q);
endmodule` },
    { name: 'Shift register (pipeline) + testbench', code: `module shift3 (input clk, d, output reg q1, q2, q3);
  always @(posedge clk) begin
    q1 <= d;       // non-blocking: each stage takes the OLD value of the previous stage
    q2 <= q1;
    q3 <= q2;
  end
endmodule

module tb;
  reg clk = 0, d = 0;
  wire q1, q2, q3;
  shift3 dut (clk, d, q1, q2, q3);
  always #5 clk = ~clk;
  initial begin
    #2  d = 1;
    #10 d = 0;
    #10 d = 1;
    #10 d = 1;
    #10 d = 0;
    #40 $finish;
  end
endmodule` },
    { name: 'FSM: consecutive-ones detector + tb', code: `module seq11 (input clk, rst, in, output out);
  localparam S0 = 2'd0, S1 = 2'd1, S2 = 2'd2, S3 = 2'd3;
  reg [1:0] state, next;
  always @(posedge clk)
    if (rst) state <= S0;
    else     state <= next;
  always @* begin
    next = state;
    case (state)
      S0: if (in)  next = S1;
      S1: if (in)  next = S2; else next = S0;
      S2: if (!in) next = S3;
      S3: if (in)  next = S2; else next = S0;
      default: next = S0;
    endcase
  end
  assign out = (state == S2) || (state == S3);
endmodule

module tb;
  reg clk = 0, rst = 1, in = 0;
  wire out;
  seq11 dut (.clk(clk), .rst(rst), .in(in), .out(out));
  always #5 clk = ~clk;
  reg [14:0] pattern = 15'b010110110001011;
  integer i;
  initial begin
    #12 rst = 0;
    for (i = 14; i >= 0; i = i - 1) begin
      in = pattern[i];
      #10;
    end
    $finish;
  end
endmodule` },
  ];

  /* ------------------------------------------------------------------ sim panel */
  function bitsName(p, k) { return p.w === 1 ? p.name : p.name + k; }
  function pickTop(src) { // mirrors elaborate()'s choice, used for the dropdown default
    const d = V.parse(src);
    const used = new Set();
    for (const m of Object.values(d.modules)) for (const it of m.items) if (it.k === 'inst') used.add(it.mod);
    const cands = d.order.filter((n) => !used.has(n));
    const tb = cands.filter((n) => d.modules[n].ports.length === 0);
    return { order: d.order, def: (tb.length ? tb[tb.length - 1] : cands[cands.length - 1]) || d.order[d.order.length - 1] };
  }
  const radixFmt = { hex: 'hex', bin: 'bin', dec: 'dec' };

  SC.simPanel = function (host, o) {
    host.classList.add('simpanel');
    host.innerHTML = `<div class="sp-bar">
  <label class="sp-top" hidden>Top module <select class="topsel"></select></label>
  <label>Radix <select class="radix"><option value="hex">hex</option><option value="bin">bin</option><option value="dec">dec</option></select></label>
  <label class="sp-tb">Run until <input class="maxt" type="number" value="2000" min="10" step="100"> time units</label>
  <label class="sp-tb"><input type="checkbox" class="internals"> show internal signals</label>
</div>
<div class="sp-out"><p class="muted">Press <b>Run</b> (Ctrl+Enter). Modules with no ports run as a <b>testbench</b> (console + waveform); modules with ports get a <b>truth table</b> (combinational) or a <b>clock stepper</b> (sequential).</p></div>`;
    const out = $('.sp-out', host), topsel = $('.topsel', host);
    let stepper = null, lastTop = null, userPickedTop = false;
    topsel.onchange = () => { userPickedTop = true; lastTop = topsel.value; api.run(); };
    $('.radix', host).onchange = () => stepper ? stepper.render() : (api.lastWave && api.lastWave());
    $('.internals', host).onchange = () => api.run();
    $('.maxt', host).onchange = () => api.run();

    function diag(items) {
      if (!items.length) return '';
      return `<div class="diags">${items.map((d) => `<div class="diag ${d.kind}" data-line="${d.line || 0}">${d.kind === 'err' ? '⛔' : '⚠'} ${d.line ? `<a href="#" class="ln">line ${d.line}</a>: ` : ''}${esc(d.msg)}</div>`).join('')}</div>`;
    }
    function bindDiag() {
      $$('.diag a.ln', out).forEach((a) => { a.onclick = (e) => { e.preventDefault(); const l = +a.closest('.diag').dataset.line; if (o.goto) o.goto(l); }; });
    }
    function showError(e) {
      out.innerHTML = diag([{ kind: 'err', line: e.line, msg: e.message }]);
      bindDiag();
      o.mark && o.mark([{ line: e.line, kind: 'err' }]);
    }
    function sigWave(sim, topName, internals, tEnd) {
      const list = sim.sigs.filter((s) => (internals ? !s.name.includes('.') : s.top));
      const arr = list.filter((s) => internals || s.top).map((s) => ({
        name: internals && !s.top ? s.full.slice(topName.length + 1) : s.name, w: s.w, trace: s.trace,
        kind: /^(clk|clock|ck)$/i.test(s.name) ? 'clk' : undefined, isPort: s.isPort, dir: s.dir,
      }));
      arr.sort((a, b) => (b.kind === 'clk') - (a.kind === 'clk') || (b.isPort ? 1 : 0) - (a.isPort ? 1 : 0));
      return arr;
    }
    function waveHTML(sim, topName, tEnd) {
      const radix = $('.radix', host).value;
      const internals = $('.internals', host).checked;
      const sigs = sigWave(sim, topName, internals);
      if (!sigs.length) return '';
      return `<div class="wavebox">${W.render(sigs, tEnd, { radix })}</div>`;
    }

    const api = {
      destroy() { stepper = null; },
      run() {
        stepper = null; api.lastWave = null;
        const src = o.getSrc();
        let design;
        try { design = V.parse(src); } catch (e) { if (e instanceof V.VError) return showError(e); throw e; }
        if (!design.order.length) { out.innerHTML = diag([{ kind: 'err', msg: 'No module found. Write module ... endmodule.' }]); return; }
        const pt = pickTop(src);
        const sp = $('.sp-top', host);
        sp.hidden = design.order.length < 2 || !!o.top;
        const top = o.top || (userPickedTop && design.order.includes(lastTop) ? lastTop : pt.def);
        topsel.innerHTML = design.order.map((n) => `<option>${esc(n)}</option>`).join('');
        topsel.value = top; lastTop = top;
        let info;
        try { info = V.analyze(src, top); } catch (e) { if (e instanceof V.VError) return showError(e); throw e; }
        $$('.sp-tb', host).forEach((el) => { el.style.display = info.isTb ? '' : 'none'; });
        const warns = info.warnings.map((w) => ({ kind: 'warn', line: w.line, msg: w.msg }));
        o.mark && o.mark(warns.map((w) => ({ line: w.line, kind: 'warn' })));
        try {
          if (info.isTb) api.testbench(src, top);
          else if (info.sequential) api.stepper(src, info, warns);
          else api.table(src, info, warns);
        } catch (e) {
          if (e instanceof V.VError) return showError(e);
          out.innerHTML = `<div class="diag err">⛔ ${esc(e.message)}</div>`;
        }
      },
      testbench(src, top) {
        const sim = V.build(src, { top });
        const maxT = +$('.maxt', host).value || 2000;
        sim.run(maxT);
        const warns = sim.warnings.map((w) => ({ kind: 'warn', line: w.line, msg: w.msg }));
        const tEnd = Math.max(10, sim.time);
        const note = sim.finished ? `Simulation finished at time ${sim.time} ($finish).` : sim.limitHit ? `Stopped at the ${maxT} time-unit limit (no $finish reached). Increase “Run until” or add $finish.` : `Simulation ended at time ${sim.time} (no more events).`;
        const render = () => {
          out.innerHTML = `${diag(warns)}<h4>Console</h4><pre class="console">${sim.log.length ? esc(sim.log.join('\n')) : '<span class="muted">(no output: add $display / $monitor to print values)</span>'}</pre><p class="muted">${esc(note)}</p><h4>Waveform</h4>${waveHTML(sim, top, tEnd)}`;
          bindDiag();
        };
        api.lastWave = render; render();
      },
      table(src, info, warns) {
        const bits = info.ports.filter((p) => p.dir === 'input').reduce((a, p) => a + p.w, 0);
        if (bits === 0) { out.innerHTML = diag(warns) + '<p class="muted">This module has no inputs.</p>'; bindDiag(); return; }
        if (bits > 12) { out.innerHTML = diag(warns) + `<p class="muted">${bits} input bits: too many for an automatic truth table (max 12). Write a testbench to explore it.</p>`; bindDiag(); return; }
        const tt = V.truthTable(src, info.name);
        const radix = $('.radix', host).value;
        const f = (v, w) => (w === 1 ? String(v) : radix === 'bin' ? v.toString(2).padStart(w, '0') : radix === 'dec' ? v.toString(10) : v.toString(16).toUpperCase());
        const head = `<tr>${tt.ins.map((p) => `<th>${esc(p.name)}${p.w > 1 ? `[${p.w - 1}:0]` : ''}</th>`).join('')}${tt.outs.map((p) => `<th class="out">${esc(p.name)}${p.w > 1 ? `[${p.w - 1}:0]` : ''}</th>`).join('')}</tr>`;
        const rows = tt.rows.slice(0, 256).map((r) => `<tr>${tt.ins.map((p) => `<td>${f(r.in[p.name], p.w)}</td>`).join('')}${tt.outs.map((p) => `<td class="out">${f(r.out[p.name], p.w)}</td>`).join('')}</tr>`).join('');
        // minimal expressions for small single-bit-output functions
        let expr = '';
        if (bits <= 6 && tt.outs.every((p) => p.w === 1)) {
          const vars = []; tt.ins.forEach((p) => { for (let k = p.w - 1; k >= 0; k--) vars.push(bitsName(p, k)); });
          expr = '<h4>Minimal expressions (Quine–McCluskey)</h4><div class="exprs">' + tt.outs.map((p) => {
            const ones = []; tt.rows.forEach((r, i) => { if (r.out[p.name] === 1n) ones.push(i); });
            const sop = B.minSOP(vars, ones), pos = B.minPOS(vars, ones);
            const km = vars.length >= 2 && vars.length <= 5 ? B.kmapHTML(vars, ones) : '';
            return `<div class="ex"><b>${esc(p.name)}</b> SOP = <code>${esc(sop.str)}</code><br><b>${esc(p.name)}</b> POS = <code>${esc(pos.str)}</code>${km ? `<div>${km}</div>` : ''}</div>`;
          }).join('') + '</div>';
        }
        out.innerHTML = `${diag(warns)}<h4>Truth table</h4><div class="tw"><table class="tt">${head}${rows}</table></div>${tt.rows.length > 256 ? '<p class="muted">Showing the first 256 rows.</p>' : ''}${expr}`;
        bindDiag();
        api.lastWave = () => api.table(src, info, warns);
      },
      stepper(src, info, warns0) {
        const sim = V.build(src, { top: info.name });
        sim.start(); sim.settle();
        const ins = info.ports.filter((p) => p.dir === 'input' && p.name !== info.clk);
        const outs = info.ports.filter((p) => p.dir === 'output');
        const rstP = ins.find((p) => /^(rst|reset|rst_n|reset_n|rstn|resetn|clear|clr)$/i.test(p.name));
        const rstActive = rstP ? (/n$/i.test(rstP.name) && /rst_?n|reset_?n/i.test(rstP.name) ? 0 : 1) : 1;
        sim.time = 0; let cycles = 0;
        stepper = {
          render() {
            const radix = $('.radix', host).value;
            const f = (v, w) => (w === 1 ? String(v) : radix === 'bin' ? v.toString(2).padStart(w, '0') : radix === 'dec' ? v.toString(10) : v.toString(16).toUpperCase());
            const outEls = $$('.so-val', out);
            outs.forEach((p, i) => { if (outEls[i]) outEls[i].textContent = f(sim.peek(p.name), p.w); });
            const wv = $('.stwave', out); if (wv) wv.innerHTML = waveHTML(sim, info.name, Math.max(10, sim.time));
            const cy = $('.cycles', out); if (cy) cy.textContent = cycles;
          },
        };
        const tick = (n) => {
          for (let i = 0; i < n; i++) {
            sim.time += 5; sim.poke(info.clk, 1); sim.settle();
            sim.time += 5; sim.poke(info.clk, 0); sim.settle(); cycles++;
          }
          stepper.render();
        };
        out.innerHTML = `${diag(warns0)}<div class="stepper">
<div class="st-in"><h4>Inputs</h4>${ins.length ? ins.map((p) => `<label class="inp"><span>${esc(p.name)}${p.w > 1 ? `[${p.w - 1}:0]` : ''}</span>${p.w === 1 ? `<input type="checkbox" data-n="${esc(p.name)}">` : `<input type="number" min="0" max="${2 ** p.w - 1}" value="0" data-n="${esc(p.name)}" data-w="${p.w}">`}</label>`).join('') : '<p class="muted">no inputs besides the clock</p>'}</div>
<div class="st-out"><h4>Outputs</h4>${outs.map((p) => `<div class="outv"><span>${esc(p.name)}${p.w > 1 ? `[${p.w - 1}:0]` : ''}</span><b class="so-val">0</b></div>`).join('')}<div class="outv"><span>clock cycles</span><b class="cycles">0</b></div></div>
<div class="st-btn"><button class="btn primary" data-a="tick">Clock cycle ↑↓</button><button class="btn" data-a="t5">×5</button><button class="btn" data-a="t20">×20</button>${rstP ? '<button class="btn" data-a="rst">Reset pulse</button>' : ''}<button class="btn ghost" data-a="restart">Restart</button></div></div>
<p class="muted">Set the inputs, then press <b>Clock cycle</b>. Inputs change while the clock is low; registers update on the rising edge (outputs change just after it).</p>
<div class="stwave"></div>`;
        bindDiag();
        $$('input[data-n]', out).forEach((inp) => {
          inp.onchange = () => {
            const v = inp.type === 'checkbox' ? (inp.checked ? 1 : 0) : Math.max(0, Math.min(2 ** (+inp.dataset.w) - 1, parseInt(inp.value || '0', 10) || 0));
            sim.poke(inp.dataset.n, v); sim.settle(); stepper.render();
          };
        });
        $$('button[data-a]', out).forEach((b) => {
          b.onclick = () => {
            const a = b.dataset.a;
            if (a === 'tick') tick(1); else if (a === 't5') tick(5); else if (a === 't20') tick(20);
            else if (a === 'restart') api.run();
            else if (a === 'rst') {
              sim.poke(rstP.name, rstActive); sim.settle(); tick(1); sim.poke(rstP.name, 1 - rstActive); sim.settle();
              const cb = $(`input[data-n="${rstP.name}"]`, out); if (cb) cb.checked = false;
              stepper.render();
            }
          };
        });
        stepper.render();
      },
    };
    return api;
  };

  /* ------------------------------------------------------------------ playground */
  SC.route('/playground', (app) => {
    SC.pageTitle = 'Playground';
    const saved = SC.store.get('pg:code', null);
    const start = saved || SC.examples[6].code;
    app.innerHTML = `<section class="page wide"><div class="pg-head"><h1>Verilog Playground</h1>
<div class="pg-tools"><select id="ex"><option value="">Load an example…</option>${SC.examples.map((e, i) => `<option value="${i}">${esc(e.name)}</option>`).join('')}</select>
<button class="btn primary" id="run">▶ Run <kbd>Ctrl</kbd>+<kbd>Enter</kbd></button></div></div>
<div class="pg-grid"><div class="pg-ed"><div id="ed"></div></div><div class="pg-out" id="out"></div></div>
<details class="card help"><summary>What can the simulator do?</summary><div class="prose">${md(`
- **Supported:** modules, ports, \`wire\`/\`reg\`/\`integer\`, vectors, memories, parameters, gate primitives, \`assign\`, \`always @*\`, \`always @(posedge clk ...)\`, \`initial\`, \`if/case/casez/for/while/repeat/forever\`, \`#delays\`, blocking and non-blocking assignment, module instances, \`$display/$write/$monitor/$strobe/$finish/$time\`.
- **Modes:** a module with **no ports** is a *testbench* (console + waveform). A module **with ports** and no clock gets a *truth table* with minimal SOP/POS and K-maps. With a **clock** input it gets a *step-by-step clock stepper*.
- **Warnings** flag the exam favourites: inferred latches, incomplete sensitivity lists, blocking assignment in clocked blocks, multiple drivers.
- **Limits:** two-valued logic only (no X/Z, so no tri-state); no functions/tasks/generate.`)}</div></details></section>`;
    const panel = SC.simPanel($('#out'), { getSrc: () => cm.getValue(), mark: (l) => cm.markLines(l), goto: (l) => { cm.focus(); cm.setCursor({ line: Math.max(0, l - 1), ch: 0 }); } });
    const cm = SC.makeEditor($('#ed'), start, { onRun: () => $('#run').click(), onChange: () => { SC.store.set('pg:code', cm.getValue()); cm.markLines([]); } });
    $('#run').onclick = () => panel.run();
    $('#ex').onchange = (e) => { if (e.target.value === '') return; cm.setValue(SC.examples[+e.target.value].code); e.target.value = ''; panel.run(); };
    panel.run();
  });

  /* ------------------------------------------------------------------ practice list */
  SC.route('/practice', (app, { query }) => {
    SC.pageTitle = 'Coding practice';
    const solved = SC.store.get('solved', {});
    const topic = query.topic || '';
    const topics = [...new Set(SC.problems.map((p) => p.topic))];
    const list = SC.problems.filter((p) => !topic || p.topic === topic);
    app.innerHTML = `<section class="page"><h1>Verilog coding practice</h1>
<p class="lead">${SC.problems.length} problems from the tutorials, labs and past papers. Your code is simulated against a hidden reference on exhaustive (combinational) or random clocked (sequential) tests. <strong>${Object.keys(solved).length}/${SC.problems.length}</strong> solved.</p>
<div class="chips filter"><a class="chip ${!topic ? 'on' : ''}" href="#/practice">All</a>${topics.map((t) => `<a class="chip ${topic === t ? 'on' : ''}" href="#/practice?topic=${t}">${esc(SC.topicById[t].title)}</a>`).join('')}</div>
<div class="tw"><table class="plisttable"><thead><tr><th></th><th>Problem</th><th>Topic</th><th>Level</th><th>Source</th></tr></thead><tbody>${list.map((p) => `<tr><td>${solved[p.id] ? '<span class="ok">✓</span>' : ''}</td><td><a href="#/practice/${p.id}">${esc(p.title)}</a></td><td>${esc(SC.topicById[p.topic].title)}</td><td><span class="lv l${p.level}">${'●'.repeat(p.level)}</span></td><td class="muted">${esc(p.source)}</td></tr>`).join('')}</tbody></table></div></section>`;
  });

  /* ------------------------------------------------------------------ practice problem */
  SC.route('/practice/:id', (app, { id }) => {
    const p = SC.problemById[id];
    if (!p) { app.innerHTML = '<div class="card"><h2>Unknown problem</h2><a href="#/practice">Back</a></div>'; return; }
    SC.pageTitle = p.title;
    const idx = SC.problems.indexOf(p);
    const next = SC.problems[idx + 1], prev = SC.problems[idx - 1];
    const solved = SC.store.get('solved', {});
    const saved = SC.store.get('code:' + id, null);
    const modName = /module\s+(\w+)/.exec(p.ref)[1];
    let hintsShown = SC.store.get('hints:' + id, 0), attempts = 0;
    app.innerHTML = `<section class="page wide">
<div class="crumbs"><a href="#/practice">Coding practice</a> › ${esc(SC.topicById[p.topic].title)}</div>
<div class="prob-grid">
<div class="prob-left">
  <h1>${esc(p.title)} ${solved[id] ? '<span class="ok badge">solved</span>' : ''}</h1>
  <div class="chips"><span class="lv l${p.level}">${'●'.repeat(p.level)}</span><span class="chip">${esc(p.source)}</span>${p.must || p.forbid ? '<span class="chip warn">construct restrictions</span>' : ''}</div>
  <div class="prose">${md(p.statement)}</div>
  ${p.provided ? `<details open class="prov"><summary>Provided module (already available, do not redefine)</summary><pre class="code"><code>${esc(p.provided)}</code></pre></details>` : ''}
  <div class="hints"><button class="btn ghost" id="hint">Hint</button> <button class="btn ghost" id="sol">Show solution</button><div id="hintbox"></div></div>
  <div class="pager">${prev ? `<a href="#/practice/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/practice/${next.id}">${esc(next.title)} →</a>` : '<span></span>'}</div>
</div>
<div class="prob-right">
  <div class="ed-head"><b>Your Verilog</b><span class="muted">module <code>${esc(modName)}</code></span><span class="sp"></span><button class="btn ghost" id="reset">Reset</button></div>
  <div id="ed"></div>
  <div class="ed-actions"><button class="btn primary" id="check">✔ Check solution <kbd>Ctrl</kbd>+<kbd>Enter</kbd></button><button class="btn" id="try">▶ Try it (simulate)</button></div>
  <div id="result"></div>
  <div id="simhost"></div>
</div></div></section>`;
    const cm = SC.makeEditor($('#ed'), saved != null ? saved : p.starter, { onRun: () => $('#check').click(), onChange: () => { SC.store.set('code:' + id, cm.getValue()); } });
    const panel = SC.simPanel($('#simhost'), { top: modName, getSrc: () => cm.getValue() + '\n' + (p.provided || ''), mark: (l) => cm.markLines(l), goto: (l) => { cm.focus(); cm.setCursor({ line: Math.max(0, l - 1), ch: 0 }); } });
    $('#simhost').hidden = true;
    const showHints = () => {
      $('#hintbox').innerHTML = p.hints.slice(0, hintsShown).map((h, i) => `<div class="hint"><b>Hint ${i + 1}.</b> ${mdInline(h)}</div>`).join('');
      $('#hint').textContent = hintsShown >= p.hints.length ? 'No more hints' : `Hint (${hintsShown}/${p.hints.length})`;
      $('#hint').disabled = hintsShown >= p.hints.length;
    };
    showHints();
    $('#hint').onclick = () => { hintsShown++; SC.store.set('hints:' + id, hintsShown); showHints(); };
    $('#sol').onclick = () => {
      if (!attempts && !confirm('Try the problem first! Show the reference solution anyway?')) return;
      $('#hintbox').innerHTML += `<div class="hint sol"><b>Reference solution</b><pre class="code"><code>${esc(p.ref)}</code></pre><button class="mini" id="use">Copy into editor</button></div>`;
      $('#use').onclick = () => { cm.setValue(p.ref); };
    };
    $('#reset').onclick = () => { if (confirm('Reset to the starter code?')) cm.setValue(p.starter); $('#result').innerHTML = ''; cm.markLines([]); };
    $('#try').onclick = () => { $('#simhost').hidden = false; panel.run(); $('#simhost').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
    $('#check').onclick = () => {
      attempts++;
      const res = V.judge(cm.getValue(), { module: modName, ref: p.ref, provided: p.provided, must: p.must, forbid: p.forbid, vectors: p.vectors, biasHigh: p.biasHigh });
      cm.markLines(res.compileError ? [{ line: res.line, kind: 'err' }] : (res.warnings || []).map((w) => ({ line: w.line, kind: 'warn' })));
      const warns = (res.warnings || []).map((w) => `<div class="diag warn">⚠ ${w.line ? `line ${w.line}: ` : ''}${esc(w.msg)}</div>`).join('');
      if (res.ok) {
        SC.store.update('solved', {}, (s) => { s[id] = Date.now(); });
        $('#result').innerHTML = `<div class="result pass"><b>✔ Passed.</b> ${esc(res.message)}${next ? ` <a href="#/practice/${next.id}">Next problem →</a>` : ''}</div>${warns ? '<p class="muted">Style notes (the exam may ask about these):</p>' + warns : ''}`;
        SC.toast('Problem solved', 'ok');
      } else {
        $('#result').innerHTML = `<div class="result fail"><b>✘ Not yet.</b><pre>${esc(res.message)}</pre></div>${warns}`;
      }
    };
  });
})();
