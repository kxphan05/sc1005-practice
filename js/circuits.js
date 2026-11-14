/* Circuit figures for the Learn notes: gate-level schematics (most of them interactive), timing diagrams
 * and block diagrams, drawn to match the lecture slides.
 *
 * In a topic's notes markdown put a line   <div class="cfig" data-fig="NAME"></div>   with blank lines around it.
 * ui-learn.js calls SC.mountFigures(root) after rendering the page. Figure names are the keys of FIG below.
 */
window.SC = window.SC || {};
(function () {
  'use strict';
  const SC = window.SC;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const mdI = (s) => (window.mdInline ? window.mdInline(s) : esc(s));
  const P = (pts) => 'M' + pts.map((p) => p[0] + ',' + p[1]).join('L');

  /* ---------- schematic builder ---------- */
  function sch() {
    const wires = [], parts = [], text = [];
    const api = {
      wire(net, pts) { wires.push(`<path class="w"${net ? ` data-n="${net}"` : ''} d="${P(pts)}"/>`); return api; },
      dot(net, x, y) { wires.push(`<circle class="dot"${net ? ` data-n="${net}"` : ''} cx="${x}" cy="${y}" r="3.2"/>`); return api; },
      text(s, x, y, o = {}) { text.push(`<text x="${x}" y="${y}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.c ? ` class="${o.c}"` : ''}>${s}</text>`); return api; },
      /* "Q = <value>" label whose value is filled in by paint() */
      val(label, net, x, y, a) { return api.text(`${label} = <tspan class="v" data-v="${net}"></tspan>`, x, y, { a }); },
      raw(s) { parts.push(s); return api; },
      box(x, y, w, h, cls) { parts.push(`<rect class="${cls || 'g'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`); return api; },
      /* gates face right. Returns pins: i = input points, o = output point. */
      gate(type, x, y, o = {}) {
        const W = 44, h = 18, n = o.n || 2;
        const dy = n === 1 ? [0] : n === 2 ? [-10, 10] : [-12, 0, 12];
        const bubble = /^(nand|nor|xnor|not)$/.test(type);
        let d, ox, ix = 0;
        if (type === 'not') {
          d = `M${x},${y - 12}L${x + 26},${y}L${x},${y + 12}Z`; ox = x + 26;
          parts.push(`<path class="g" d="${d}"/>`);
          parts.push(`<circle class="g" cx="${ox + 4}" cy="${y}" r="4"/>`);
          return { i: [[x, y]], o: [ox + 8, y] };
        }
        let bx = x;
        if (/xn?or/.test(type)) { parts.push(`<path class="g nf" d="M${x},${y + h}Q${x + 12},${y} ${x},${y - h}"/>`); bx = x + 6; ix = 3; }
        if (/and/.test(type)) d = `M${bx},${y - h}H${bx + W - h}A${h},${h} 0 0 1 ${bx + W - h},${y + h}H${bx}Z`;
        else { d = `M${bx},${y - h}Q${bx + W * 0.6},${y - h} ${bx + W},${y}Q${bx + W * 0.6},${y + h} ${bx},${y + h}Q${bx + 12},${y} ${bx},${y - h}Z`; if (!ix) ix = 4; }
        parts.push(`<path class="g" d="${d}"/>`);
        ox = bx + W;
        if (bubble) { parts.push(`<circle class="g" cx="${ox + 4}" cy="${y}" r="4"/>`); ox += 8; }
        return { i: dy.map((k) => [x + ix, y + k]), o: [ox, y] };
      },
      /* MOSFET, vertical. Terminals: d (top), s (bottom), g (gate input point on the left). net: ON when nets[net] = 1 */
      mos(type, x, y, net) {
        const g = type === 'p' ? x - 14 : x - 6;
        parts.push(`<g class="mos" data-n="${net}"><path class="t" d="M${x + 10},${y - 24}V${y - 12}H${x}M${x},${y - 15}V${y + 15}M${x},${y + 12}H${x + 10}V${y + 24}M${x - 6},${y - 12}V${y + 12}"/>` +
          (type === 'p' ? `<circle class="tb" cx="${x - 10}" cy="${y}" r="4"/>` : '') + '</g>');
        return { d: [x + 10, y - 24], s: [x + 10, y + 24], g: [g, y] };
      },
      gnd(x, y) { parts.push(`<path class="w" d="M${x - 11},${y}H${x + 11}M${x - 7},${y + 4}H${x + 7}M${x - 3},${y + 8}H${x + 3}"/>`); return api; },
      /* pad: extra room on the left for "S = 0" style input labels */
      svg(W, H, label, pad = 48) {
        return `<svg class="sch" viewBox="${-pad} 0 ${W + pad} ${H}" width="${W + pad}" role="img" aria-label="${esc(label)}">${wires.join('')}${parts.join('')}${text.join('')}</svg>`;
      },
    };
    return api;
  }

  /* colour wires by value: 1 = highlighted, 0 = plain, 'x' = unknown */
  function paint(el, nets) {
    el.querySelectorAll('[data-n]').forEach((e) => {
      const v = nets[e.dataset.n];
      e.classList.toggle('on', v === 1);
      e.classList.toggle('x', v === 'x');
    });
    el.querySelectorAll('[data-v]').forEach((e) => {
      const v = nets[e.dataset.v];
      e.textContent = v === undefined ? '' : v === 'x' ? '?' : String(v);
    });
  }

  /* step waveform: rows [{k, n}], hist [{k: 0|1|'x', _edge?}] */
  function waveSVG(rows, hist, o = {}) {
    const cw = o.cw || 26, rh = 28, lw = o.lw || 44, N = Math.max(hist.length, o.min || 0);
    const W = lw + N * cw + 8, H = rows.length * rh + 6;
    let s = `<svg class="sw" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc(o.label || 'timing diagram')}">`;
    hist.forEach((h, i) => { if (h._edge) s += `<line class="edge" x1="${lw + i * cw}" y1="2" x2="${lw + i * cw}" y2="${H - 2}"/>`; });
    rows.forEach((r, j) => {
      const yh = 6 + j * rh, yl = yh + rh - 12;
      s += `<text class="lbl" x="${lw - 6}" y="${(yh + yl) / 2 + 4}" text-anchor="end">${r.n}</text>`;
      let d = '', prev;
      hist.forEach((h, i) => {
        const v = h[r.k], x = lw + i * cw;
        if (v === undefined) { prev = undefined; return; }
        if (v === 'x') {
          s += `<rect class="xb" x="${x}" y="${yh}" width="${cw}" height="${yl - yh}"/><text class="xq" x="${x + cw / 2}" y="${(yh + yl) / 2 + 4}" text-anchor="middle">?</text>`;
          prev = 'x'; return;
        }
        const y = v ? yh : yl;
        if (prev === 0 || prev === 1) { if (prev !== v) d += `M${x},${yl}V${yh}`; }
        d += `M${x},${y}H${x + cw}`;
        prev = v;
      });
      s += `<path class="ln${r.clk ? ' clk' : ''}" d="${d}"/>`;
    });
    return s + '</svg>';
  }

  /* ---------- interactive figure scaffold ---------- */
  function interactive(el, cfg) {
    const inp = Object.assign({}, cfg.init);
    const max = cfg.max || 18;
    let hist = [];
    const lab = (k) => (cfg.labels && cfg.labels[k]) || k;
    el.innerHTML = `<div class="cfig-row"><div class="cfig-sch">${cfg.svg}</div>${cfg.table ? `<div class="tw cfig-tt"><table><thead><tr>${cfg.table.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${cfg.table.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}</div>
<div class="cfig-ctl">${cfg.inputs.map((k) => `<button type="button" class="btn tg" data-k="${k}"></button>`).join('')}${(cfg.buttons || []).map((b, i) => `<button type="button" class="btn${b.primary ? ' primary' : ''}" data-b="${i}">${b.label}</button>`).join('')}</div>
<div class="cfig-msg" aria-live="polite"></div>
${cfg.rows ? `<div class="cfig-wave"><div class="cfig-wh"><span>Trace (one step per click)</span><button type="button" class="mini" data-clear>Clear</button></div><div class="tw"></div></div>` : ''}
<div class="cfig-cap">${mdI(cfg.cap)}</div>`;
    const $ = (s) => el.querySelector(s);
    function update(prev, act) {
      const r = cfg.compute(inp, prev, act);
      const nets = Object.assign({}, inp, r.nets);
      paint($('.cfig-sch'), nets);
      if (cfg.rows) {
        (r.pre || []).forEach((c) => hist.push(Object.assign({}, nets, c)));
        hist.push(Object.assign({}, nets, r.col || {}));
        (r.post || []).forEach((c) => hist.push(Object.assign({}, nets, c)));
        if (hist.length > max) hist = hist.slice(-max);
        $('.cfig-wave .tw').innerHTML = waveSVG(cfg.rows, hist, { min: max, lw: cfg.lw });
      }
      el.querySelectorAll('.tg').forEach((b) => {
        const k = b.dataset.k;
        b.innerHTML = `${lab(k)} = <b>${inp[k]}</b>`;
        b.setAttribute('aria-pressed', inp[k] ? 'true' : 'false');
      });
      (cfg.buttons || []).forEach((b, i) => { if (b.enabled) el.querySelector(`[data-b="${i}"]`).disabled = !b.enabled(inp); });
      $('.cfig-msg').innerHTML = mdI(r.msg || '');
      if (cfg.table) {
        const cur = cfg.table.cur(inp, r);
        el.querySelectorAll('.cfig-tt tbody tr').forEach((tr, i) => tr.classList.toggle('cur', i === cur));
      }
    }
    el.querySelectorAll('.tg').forEach((b) => { b.onclick = () => { const prev = Object.assign({}, inp); inp[b.dataset.k] ^= 1; update(prev, null); }; });
    (cfg.buttons || []).forEach((b, i) => { el.querySelector(`[data-b="${i}"]`).onclick = () => { const prev = Object.assign({}, inp); b.act(inp); update(prev, i); }; });
    if (cfg.rows) $('[data-clear]').onclick = () => { hist = []; update(Object.assign({}, inp), 'clear'); };
    update(null, null);
  }

  /* ---------- the NOR SR-latch core used by the three latch figures (slides 09 p6-15 layout) ---------- */
  function latchCore(s, x0) {
    const top = s.gate('nor', x0, 60), bot = s.gate('nor', x0, 160);
    const xl = x0 - 20, xr = x0 + 75, xe = x0 + 125;
    s.wire('Qn', [top.o, [xe, 60]]).dot('Qn', xr, 60).wire('Qn', [[xr, 60], [xr, 92], [xl, 128], [xl, 150], bot.i[0]]);
    s.wire('Q', [bot.o, [xe, 160]]).dot('Q', xr, 160).wire('Q', [[xr, 160], [xr, 128], [xl, 92], [xl, 70], top.i[1]]);
    s.val('Q′', 'Qn', xe + 6, 65).val('Q', 'Q', xe + 6, 165);
    return { top, bot };
  }
  /* SR behaviour on the (gated) S1/R1 lines. st.Q holds the stored bit. */
  function srStep(st, s1, r1, ps1, pr1) {
    if (s1 && r1) return { Q: 0, Qn: 0, both: true };
    if (s1) st.Q = 1;
    else if (r1) st.Q = 0;
    else if (ps1 && pr1) { st.Q = Math.random() < 0.5 ? 0 : 1; return { Q: st.Q, Qn: 1 - st.Q, undef: true }; }
    return { Q: st.Q, Qn: 1 - st.Q };
  }
  const UNDEF_MSG = (q) => `**S and R were released together.** Both NOR gates see 0, 0 and both outputs try to go to 1, which feeds back and pushes both to 0 again: the output may **oscillate**. One gate is usually a little faster so it settles, but which way is impossible to know. This time it settled to **Q = ${q}** (try again: it is random). [src:09 p8]`;

  const FIG = {};

  /* ---- SR latch ---- */
  FIG['sr-latch'] = (el) => {
    const s = sch(), c = latchCore(s, 160);
    s.wire('S', [[34, 50], c.top.i[0]]).wire('R', [[34, 170], c.bot.i[1]]);
    s.val('S', 'S', 28, 54, 'end').val('R', 'R', 28, 174, 'end');
    s.text('(set)', 40, 42, { c: 'sm' }).text('(reset)', 40, 187, { c: 'sm' });
    const st = { Q: 0 };
    interactive(el, {
      svg: s.svg(340, 200, 'SR latch: two cross-coupled NOR gates'),
      inputs: ['S', 'R'], init: { S: 0, R: 0 },
      buttons: [{ label: 'Release S and R together', enabled: (i) => i.S && i.R, act: (i) => { i.S = 0; i.R = 0; } }],
      rows: [{ k: 'S', n: 'S' }, { k: 'R', n: 'R' }, { k: 'Q', n: 'Q' }, { k: 'Qn', n: 'Q′' }],
      table: { head: ['S', 'R', 'Q<sup>+</sup>', 'Function'], rows: [['0', '0', 'Q', 'Store'], ['0', '1', '0', 'Reset'], ['1', '0', '1', 'Set'], ['1', '1', '?', 'Undefined']], cur: (i) => i.S * 2 + i.R },
      compute(i, p) {
        const r = srStep(st, i.S, i.R, p && p.S, p && p.R);
        const nets = { Q: r.Q, Qn: r.Qn };
        if (r.undef) return { nets, msg: UNDEF_MSG(r.Q), pre: [{ Q: 'x', Qn: 'x' }] };
        let msg;
        if (r.both) msg = '**S = R = 1**: both NOR outputs are forced to 0, so Q = Q′ = 0 and they are no longer complements. Release one input at a time and the latch behaves; release both together and see what happens.';
        else if (i.S) msg = '**Set**: S = 1 forces the top NOR output Q′ to 0, so the bottom NOR sees 0, 0 and Q = 1.';
        else if (i.R) msg = '**Reset**: R = 1 forces Q to 0, so the top NOR sees 0, 0 and Q′ = 1.';
        else msg = `**Store**: S = R = 0. Each NOR just inverts the other's output, so the loop keeps Q = ${r.Q}. Like the flight-attendant light, Q stays on after "call" is released. [src:09 p7]`;
        return { nets, msg };
      },
      cap: 'SR latch built from two cross-coupled NOR gates, drawn as on the slides: S into the top gate, Q from the bottom gate. Click S and R; highlighted wires are at logic 1. [src:09 p6-8]',
    });
  };

  /* ---- enabled (gated) SR latch ---- */
  FIG['sr-enabled'] = (el) => {
    const s = sch(), c = latchCore(s, 260);
    const a1 = s.gate('and', 120, 50), a2 = s.gate('and', 120, 170);
    s.wire('S', [[34, 40], a1.i[0]]).wire('R', [[34, 180], a2.i[1]]);
    s.wire('E', [[34, 110], [100, 110]]).dot('E', 100, 110).wire('E', [[100, 110], [100, 60], a1.i[1]]).wire('E', [[100, 110], [100, 160], a2.i[0]]);
    s.wire('S1', [a1.o, c.top.i[0]]).wire('R1', [a2.o, c.bot.i[1]]);
    s.text('S1', 190, 44, { c: 'sm' }).text('R1', 190, 186, { c: 'sm' });
    s.val('S', 'S', 28, 44, 'end').val('E', 'E', 28, 114, 'end').val('R', 'R', 28, 184, 'end');
    const st = { Q: 0 };
    interactive(el, {
      svg: s.svg(440, 200, 'Enabled SR latch: AND gates gate S and R with E'),
      inputs: ['E', 'S', 'R'], init: { E: 0, S: 0, R: 0 },
      rows: [{ k: 'E', n: 'E' }, { k: 'S', n: 'S' }, { k: 'R', n: 'R' }, { k: 'Q', n: 'Q' }],
      table: { head: ['E', 'S', 'R', 'Q<sup>+</sup>', 'Function'], rows: [['0', 'X', 'X', 'Q', 'Store'], ['1', '0', '0', 'Q', 'Store'], ['1', '0', '1', '0', 'Reset'], ['1', '1', '0', '1', 'Set'], ['1', '1', '1', '?', 'Undefined']], cur: (i) => (i.E ? 1 + i.S * 2 + i.R : 0) },
      compute(i, p) {
        const s1 = i.S & i.E, r1 = i.R & i.E, ps1 = p ? p.S & p.E : 0, pr1 = p ? p.R & p.E : 0;
        const r = srStep(st, s1, r1, ps1, pr1);
        const nets = { S1: s1, R1: r1, Q: r.Q, Qn: r.Qn };
        if (r.undef) return { nets, msg: UNDEF_MSG(r.Q).replace('S and R were released together', p.E && !i.E ? 'E fell while S = R = 1, so S1 and R1 dropped together' : 'S1 and R1 dropped together'), pre: [{ Q: 'x', Qn: 'x' }] };
        let msg;
        if (!i.E) msg = '**E = 0**: both AND outputs are 0, so the latch ignores S and R and stores Q. Glitches on S and R while E is low don\'t matter. [src:09 p11]';
        else if (r.both) msg = '**E = 1, S = R = 1**: S1 = R1 = 1, the undefined input. Now try dropping E: S1 and R1 fall together.';
        else msg = `**E = 1**: S and R pass through (S1 = ${s1}, R1 = ${r1}); the latch is **level-sensitive**.`;
        return { nets, msg };
      },
      cap: 'Enabled (gated) SR latch: the latch only responds to S and R while E is high. [src:09 p11-12]',
    });
  };

  /* ---- D latch ---- */
  FIG['d-latch'] = (el) => {
    const s = sch(), c = latchCore(s, 260);
    const a1 = s.gate('and', 120, 50), a2 = s.gate('and', 120, 170), inv = s.gate('not', 56, 180);
    s.wire('D', [[34, 40], a1.i[0]]).dot('D', 46, 40).wire('D', [[46, 40], [46, 180], inv.i[0]]).wire('Dn', [inv.o, a2.i[1]]);
    s.wire('E', [[34, 110], [100, 110]]).dot('E', 100, 110).wire('E', [[100, 110], [100, 60], a1.i[1]]).wire('E', [[100, 110], [100, 160], a2.i[0]]);
    s.wire('S1', [a1.o, c.top.i[0]]).wire('R1', [a2.o, c.bot.i[1]]);
    s.text('S1', 190, 44, { c: 'sm' }).text('R1', 190, 186, { c: 'sm' });
    s.val('D', 'D', 28, 44, 'end').val('E', 'E', 28, 114, 'end');
    const st = { Q: 0 };
    interactive(el, {
      svg: s.svg(440, 200, 'D latch: enabled SR latch with R = NOT D'),
      inputs: ['E', 'D'], init: { E: 0, D: 0 },
      rows: [{ k: 'E', n: 'E' }, { k: 'D', n: 'D' }, { k: 'Q', n: 'Q' }],
      table: { head: ['E', 'D', 'Q<sup>+</sup>', 'Function'], rows: [['0', 'X', 'Q', 'Store'], ['1', '0', '0', 'Transparent'], ['1', '1', '1', 'Transparent']], cur: (i) => (i.E ? 1 + i.D : 0) },
      compute(i) {
        const s1 = i.D & i.E, r1 = (1 - i.D) & i.E;
        const r = srStep(st, s1, r1, 0, 0);
        const msg = i.E ? `**E = 1: transparent.** Q follows D (Q = ${r.Q}). The inverter makes R1 the opposite of S1, so the undefined input can't happen. [src:09 p13-15]`
          : `**E = 0: hold.** Q stays ${r.Q} whatever D does.`;
        return { nets: { Dn: 1 - i.D, S1: s1, R1: r1, Q: r.Q, Qn: r.Qn }, msg };
      },
      cap: 'Transparent D latch: one input D drives both S and R. [src:09 p13-15]',
    });
  };

  /* ---- master–slave D flip-flop ---- */
  FIG['dff-ms'] = (el) => {
    const s = sch();
    s.box(120, 36, 80, 88).box(280, 36, 80, 88);
    s.text('master', 160, 28, { a: 'middle', c: 'sm' }).text('slave', 320, 28, { a: 'middle', c: 'sm' });
    s.text('D latch', 160, 82, { a: 'middle', c: 'sm' }).text('D latch', 320, 82, { a: 'middle', c: 'sm' });
    s.text('D', 126, 64).text('E', 126, 104).text('Q', 194, 64, { a: 'end' });
    s.text('D', 286, 64).text('E', 286, 104).text('Q', 354, 64, { a: 'end' });
    const inv = s.gate('not', 76, 100);
    s.wire('D', [[44, 60], [120, 60]]).wire('Qm', [[200, 60], [280, 60]]).wire('Q', [[360, 60], [410, 60]]);
    s.wire('Clk', [[44, 170], [255, 170], [255, 100], [280, 100]]).dot('Clk', 60, 170).wire('Clk', [[60, 170], [60, 100], inv.i[0]]).wire('Cm', [inv.o, [120, 100]]);
    s.text('Cm', 112, 116, { c: 'sm', a: 'end' }).text('Cs', 274, 116, { c: 'sm', a: 'end' });
    s.val('D', 'D', 38, 64, 'end').val('Clk', 'Clk', 38, 174, 'end').val('Qm', 'Qm', 240, 52, 'middle').val('Q', 'Q', 416, 64);
    const st = { Qm: 0, Q: 0 };
    interactive(el, {
      svg: s.svg(470, 190, 'Master-slave D flip-flop built from two D latches'),
      inputs: ['D', 'Clk'], init: { D: 0, Clk: 0 },
      rows: [{ k: 'Clk', n: 'Clk', clk: 1 }, { k: 'D', n: 'D' }, { k: 'Qm', n: 'Qm' }, { k: 'Q', n: 'Q' }],
      compute(i, p) {
        if (!i.Clk) st.Qm = i.D; else st.Q = st.Qm;
        const rise = p && !p.Clk && i.Clk;
        let msg;
        if (rise) msg = `**Rising edge.** The master locks the value D had just before the edge (Qm = ${st.Qm}) and the slave becomes transparent, so **Q = ${st.Q}**. This is the only moment Q can change.`;
        else if (i.Clk) msg = `**Clk = 1**: master disabled (holds Qm = ${st.Qm}), slave transparent. Changing D now does **nothing** to Q.`;
        else msg = `**Clk = 0**: master transparent (Qm follows D = ${i.D}), slave disabled, so Q holds ${st.Q}.`;
        return { nets: { Cm: 1 - i.Clk, Qm: st.Qm, Q: st.Q }, msg, col: rise ? { _edge: 1 } : {} };
      },
      cap: 'Positive-edge-triggered D flip-flop, master–slave: the master is enabled while the clock is low, the slave while it is high. Toggle D while Clk = 1 and see that Q ignores it. [src:09 p27-29]',
    });
  };

  /* ---- D / JK / T flip-flop stepper ---- */
  FIG['ff-step'] = (el) => {
    const types = {
      D: { ins: ['D'], rule: (q, i) => [i.D, `D = ${i.D} → Q = ${i.D}`] },
      JK: { ins: ['J', 'K'], rule: (q, i) => i.J && i.K ? [1 - q, 'J = K = 1 → **toggle**'] : i.J ? [1, 'J = 1 → Q = 1'] : i.K ? [0, 'K = 1 → Q = 0'] : [q, 'J = K = 0 → hold'] },
      T: { ins: ['T'], rule: (q, i) => i.T ? [1 - q, 'T = 1 → **toggle**'] : [q, 'T = 0 → hold'] },
    };
    el.innerHTML = '<div class="cfig-tabs" role="tablist"></div><div class="cfig-in"></div>';
    const tabs = el.querySelector('.cfig-tabs'), inner = el.querySelector('.cfig-in');
    function show(tn) {
      tabs.innerHTML = Object.keys(types).map((k) => `<button type="button" class="mini${k === tn ? ' sel' : ''}" role="tab" aria-selected="${k === tn}" data-t="${k}">${k} flip-flop</button>`).join('');
      tabs.querySelectorAll('button').forEach((b) => { b.onclick = () => show(b.dataset.t); });
      const t = types[tn], s = sch();
      s.box(140, 26, 80, 110);
      const ys = t.ins.length === 1 ? [50] : [46, 116];
      t.ins.forEach((k, j) => { s.wire(k, [[60, ys[j]], [140, ys[j]]]).text(k, 146, ys[j] + 5).val(k, k, 54, ys[j] + 5, 'end'); });
      const cy = t.ins.length === 1 ? 110 : 81;
      s.wire('clk', [[60, cy], [140, cy]]).raw(`<path class="g nf" d="M140,${cy - 7}L152,${cy}L140,${cy + 7}"/>`).text('clk', 54, cy + 5, { a: 'end' });
      s.wire('Q', [[220, 50], [280, 50]]).wire('Qn', [[220, 110], [280, 110]]).text('Q', 214, 55, { a: 'end' }).text('Q′', 214, 115, { a: 'end' });
      s.val('Q', 'Q', 286, 55).val('Q′', 'Qn', 286, 115);
      const st = { Q: 0, last: '' };
      const init = {}; t.ins.forEach((k) => { init[k] = 0; });
      interactive(inner, {
        svg: s.svg(360, 150, tn + ' flip-flop symbol'),
        inputs: t.ins, init,
        buttons: [{ label: 'Rising clock edge ↑', primary: 1, act: () => {} }],
        rows: [{ k: 'clk', n: 'clk', clk: 1 }].concat(t.ins.map((k) => ({ k, n: k })), [{ k: 'Q', n: 'Q' }]),
        compute(i, p, act) {
          if (act === 0) {
            const [q, why] = t.rule(st.Q, i);
            st.Q = q; st.last = why;
            return { nets: { clk: 0, Q: q, Qn: 1 - q }, msg: `Edge: ${why}.`, col: { clk: 1, _edge: 1 }, post: [{ clk: 0 }] };
          }
          return { nets: { clk: 0, Q: st.Q, Qn: 1 - st.Q }, msg: p ? `Inputs changed, but Q only changes at a rising edge (Q = ${st.Q}). Press the clock button.` : 'Set the inputs, then press the clock button.' };
        },
        cap: 'Edge-triggered flip-flops (the triangle marks the clock input). D: Q takes D. JK: J sets, K resets, both toggle. T: toggle when T = 1. [src:09 p32-33]',
      });
    }
    show('D');
  };

  /* ---- 4-stage shift register ---- */
  FIG['shift-reg'] = (el) => {
    const s = sch(), xs = [90, 190, 290, 390];
    s.wire('y', [[34, 60], [90, 60]]).val('y', 'y', 28, 64, 'end');
    s.wire('', [[34, 130], [375, 130]]).text('clk', 28, 134, { a: 'end' });
    xs.forEach((x, j) => {
      const q = 'q' + (j + 1);
      s.box(x, 40, 60, 62);
      s.text('D', x + 5, 64, { c: 'sm' }).raw(`<path class="g nf" d="M${x},${78}L${x + 10},${85}L${x},${92}"/>`);
      s.text(`<tspan class="v" data-v="${q}"></tspan>`, x + 38, 78, { a: 'middle', c: 'big' });
      s.wire('', [[x - 15, 130], [x - 15, 85], [x, 85]]).dot('', x - 15, 130);
      s.wire(q, [[x + 60, 60], [x + 100, 60]]).text(q, x + 80, 52, { a: 'middle', c: 'sm' });
    });
    const st = { q: [0, 0, 0, 0] };
    interactive(el, {
      svg: s.svg(500, 145, 'Four D flip-flops in a chain'),
      inputs: ['y'], init: { y: 0 },
      buttons: [{ label: 'Rising clock edge ↑', primary: 1, act: () => {} }],
      rows: [{ k: 'y', n: 'y' }, { k: 'q1', n: 'q1' }, { k: 'q2', n: 'q2' }, { k: 'q3', n: 'q3' }, { k: 'q4', n: 'q4' }],
      compute(i, p, act) {
        let msg = 'Set y, then clock. Each stage copies the stage before it.';
        if (act === 0) {
          const old = st.q.slice();
          st.q = [i.y, old[0], old[1], old[2]];
          msg = `Edge: every flip-flop loads the **old** value of its D input at the same moment (q1 ← y = ${i.y}, q2 ← ${old[0]}, q3 ← ${old[1]}, q4 ← ${old[2]}). That is exactly what non-blocking \`<=\` describes.`;
        }
        const nets = {}; st.q.forEach((v, j) => { nets['q' + (j + 1)] = v; });
        return { nets, msg, col: act === 0 ? { _edge: 1 } : {} };
      },
      cap: 'Shift register: `q1 <= y; q2 <= q1; q3 <= q2; q4 <= q3;` An input takes 4 clock edges to reach q4. [src:10 p24-29]',
    });
  };

  /* ---- full adder (two half adders + OR) ---- */
  FIG['full-adder'] = (el) => {
    const s = sch();
    const x1 = s.gate('xor', 100, 50), a1 = s.gate('and', 100, 110), x2 = s.gate('xor', 220, 60), a2 = s.gate('and', 220, 150), o = s.gate('or', 320, 150);
    s.wire('A', [[44, 40], x1.i[0]]).dot('A', 62, 40).wire('A', [[62, 40], [62, 100], a1.i[0]]);
    s.wire('B', [[44, 80], [78, 80]]).dot('B', 78, 80).wire('B', [[78, 80], [78, 60], x1.i[1]]).wire('B', [[78, 80], [78, 120], a1.i[1]]);
    s.wire('S1', [x1.o, x2.i[0]]).dot('S1', 180, 50).wire('S1', [[180, 50], [180, 140], a2.i[0]]);
    s.wire('Cin', [[44, 190], [200, 190], [200, 160], a2.i[1]]).dot('Cin', 200, 160).wire('Cin', [[200, 160], [200, 70], x2.i[1]]);
    s.wire('C1', [a1.o, [300, 110], [300, 140], o.i[0]]).wire('C2', [a2.o, [290, 150], [290, 160], o.i[1]]);
    s.wire('Sum', [x2.o, [400, 60]]).wire('Cout', [o.o, [400, 150]]);
    s.text('S1', 156, 42, { c: 'sm' }).text('C1', 150, 104, { c: 'sm' }).text('C2', 268, 144, { c: 'sm' });
    s.text('half adder 1', 122, 20, { a: 'middle', c: 'sm' }).text('half adder 2', 245, 20, { a: 'middle', c: 'sm' });
    s.val('A', 'A', 38, 44, 'end').val('B', 'B', 38, 84, 'end').val('Cin', 'Cin', 38, 194, 'end').val('Sum', 'Sum', 406, 65).val('Cout', 'Cout', 406, 155);
    const rows = []; for (let k = 0; k < 8; k++) { const A = k >> 2, B = (k >> 1) & 1, C = k & 1, t = A + B + C; rows.push([A, B, C, t >> 1, t & 1]); }
    interactive(el, {
      svg: s.svg(490, 205, 'Full adder from two half adders and an OR gate'),
      inputs: ['A', 'B', 'Cin'], init: { A: 0, B: 0, Cin: 0 },
      labels: { Cin: 'C<sub>in</sub>' },
      table: { head: ['A', 'B', 'C<sub>in</sub>', 'C<sub>out</sub>', 'Sum'], rows, cur: (i) => i.A * 4 + i.B * 2 + i.Cin },
      compute(i) {
        const S1 = i.A ^ i.B, C1 = i.A & i.B, Sum = S1 ^ i.Cin, C2 = S1 & i.Cin, Cout = C1 | C2;
        return { nets: { S1, C1, Sum, C2, Cout }, msg: `${i.A} + ${i.B} + ${i.Cin} = ${i.A + i.B + i.Cin} = binary ${Cout}${Sum}: Sum = ${Sum}, C<sub>out</sub> = ${Cout}.` };
      },
      cap: 'Full adder = two half adders and an OR gate: S1 = A ⊕ B, C1 = A·B, Sum = S1 ⊕ C<sub>in</sub>, C2 = C<sub>in</sub>·S1, C<sub>out</sub> = C1 + C2. [src:4 p10]',
    });
  };

  /* ---- 2:1 mux, gate level ---- */
  FIG['mux2'] = (el) => {
    const s = sch();
    const g0 = s.gate('and', 150, 50), g1 = s.gate('and', 150, 130), inv = s.gate('not', 72, 90), o = s.gate('or', 250, 90);
    s.wire('i0', [[44, 40], g0.i[0]]).wire('i1', [[44, 120], g1.i[0]]);
    s.wire('s', [[44, 180], [125, 180], [125, 140], g1.i[1]]).dot('s', 60, 180).wire('s', [[60, 180], [60, 90], inv.i[0]]);
    s.wire('sn', [inv.o, [130, 90], [130, 60], g0.i[1]]);
    s.wire('a0', [g0.o, [225, 50], [225, 80], o.i[0]]).wire('a1', [g1.o, [225, 130], [225, 100], o.i[1]]);
    s.wire('d', [o.o, [340, 90]]);
    s.val('i0', 'i0', 38, 44, 'end').val('i1', 'i1', 38, 124, 'end').val('s', 's', 38, 184, 'end').val('d', 'd', 346, 95);
    s.text('s′·i0', 196, 40, { c: 'sm' }).text('s·i1', 196, 148, { c: 'sm' });
    interactive(el, {
      svg: s.svg(420, 200, '2-to-1 multiplexer from AND, OR and NOT gates'),
      inputs: ['s', 'i0', 'i1'], init: { s: 0, i0: 0, i1: 1 },
      compute(i) {
        const a0 = (1 - i.s) & i.i0, a1 = i.s & i.i1;
        return { nets: { sn: 1 - i.s, a0, a1, d: a0 | a1 }, msg: `s = ${i.s} selects **i${i.s}**, so d = i${i.s} = ${a0 | a1}. The other AND gate is held at 0.` };
      },
      cap: 'Internal design of a 2×1 mux: d = s′·i0 + s·i1. [src:07 p24]',
    });
  };

  /* ---- CMOS NAND and NOR ---- */
  FIG['cmos'] = (el) => {
    const nand = sch();
    {
      const s = nand, pa = s.mos('p', 60, 60, 'pA'), pb = s.mos('p', 140, 60, 'pB'), na = s.mos('n', 100, 140, 'nA'), nb = s.mos('n', 100, 188, 'nB');
      s.wire('vdd', [pa.d, [70, 30], [150, 30], pb.d]).text('V<tspan dy="3" font-size="9">DD</tspan>', 110, 22, { a: 'middle' });
      s.wire('X1', [pa.s, [70, 96], [150, 96], pb.s]).wire('X1', [[110, 96], na.d]).wire('X1', [[150, 96], [200, 96]]).dot('X1', 110, 96).dot('X1', 150, 96);
      s.wire('', [na.s, nb.d]).wire('', [nb.s, [110, 222]]).gnd(110, 222);
      s.wire('A', [[26, 60], pa.g]).wire('B', [[104, 60], pb.g]).wire('A', [[44, 140], na.g]).wire('B', [[44, 188], nb.g]);
      s.text('A', 20, 65, { a: 'end' }).text('B', 100, 65, { a: 'end' }).text('A', 38, 145, { a: 'end' }).text('B', 38, 193, { a: 'end' });
      s.val('X', 'X1', 160, 88).text('NAND', 200, 230, { a: 'end', c: 'sm' });
    }
    const nor = sch();
    {
      const s = nor, pa = s.mos('p', 100, 60, 'pA'), pb = s.mos('p', 100, 108, 'pB'), na = s.mos('n', 60, 188, 'nA'), nb = s.mos('n', 140, 188, 'nB');
      s.wire('vdd', [pa.d, [110, 30]]).wire('vdd', [[90, 30], [130, 30]]).text('V<tspan dy="3" font-size="9">DD</tspan>', 110, 22, { a: 'middle' });
      s.wire('', [pa.s, pb.d]).wire('X2', [pb.s, [110, 150]]).wire('X2', [na.d, [70, 150], [200, 150]]).wire('X2', [[150, 150], nb.d]).dot('X2', 110, 150).dot('X2', 150, 150);
      s.wire('', [na.s, [70, 222], [150, 222], nb.s]).gnd(110, 222);
      s.wire('A', [[44, 60], pa.g]).wire('B', [[44, 108], pb.g]).wire('A', [[26, 188], na.g]).wire('B', [[104, 188], nb.g]);
      s.text('A', 38, 65, { a: 'end' }).text('B', 38, 113, { a: 'end' }).text('A', 20, 193, { a: 'end' }).text('B', 100, 193, { a: 'end' });
      s.val('X', 'X2', 160, 142).text('NOR', 200, 240, { a: 'end', c: 'sm' });
    }
    interactive(el, {
      svg: nand.svg(230, 240, 'CMOS NAND gate', 0) + nor.svg(230, 245, 'CMOS NOR gate', 0),
      inputs: ['A', 'B'], init: { A: 0, B: 0 },
      compute(i) {
        const pA = 1 - i.A, pB = 1 - i.B, nA = i.A, nB = i.B;
        const X1 = i.A && i.B ? 0 : 1, X2 = i.A || i.B ? 0 : 1;
        const on = (v) => (v ? 'ON' : 'off');
        const msg = `pMOS conduct when their gate is 0, nMOS when it is 1. **NAND**: pull-up (parallel) ${pA || pB ? 'has a path to V<sub>DD</sub>' : 'is open'}, pull-down (series) ${nA && nB ? 'has a path to GND' : 'is open'} → X = ${X1}. **NOR**: pull-up (series) ${pA && pB ? 'has a path to V<sub>DD</sub>' : 'is open'}, pull-down (parallel) ${nA || nB ? 'has a path to GND' : 'is open'} → X = ${X2}. <span class="sm">(nMOS A ${on(nA)}, nMOS B ${on(nB)}, pMOS A ${on(pA)}, pMOS B ${on(pB)})</span>`;
        return { nets: { pA, pB, nA, nB, X1, X2, vdd: 1 }, msg };
      },
      cap: 'CMOS NAND (left) and NOR (right). Highlighted transistors are conducting. NAND: pMOS in parallel, nMOS in series. NOR: the other way round. [src:6 p37-38]',
    });
  };

  /* ---------- static figures ---------- */
  function staticFig(el, svg, cap) { el.innerHTML = `<div class="cfig-sch">${svg}</div><div class="cfig-cap">${mdI(cap)}</div>`; }

  /* D latch vs D flip-flop on the same inputs */
  FIG['latch-vs-ff'] = (el) => {
    const T = 44, per = 10, clk = (t) => (t % per >= 5 ? 1 : 0);
    const dChanges = [3, 8, 12, 18, 21, 23, 28, 33, 39];
    const D = (t) => dChanges.filter((c) => c <= t).length % 2;
    const hist = []; let ql = 0, qf = 0;
    for (let t = 0; t < T; t++) {
      const edge = t > 0 && !clk(t - 1) && clk(t);
      if (edge) qf = D(t - 1);
      if (clk(t)) ql = D(t);
      hist.push({ clk: clk(t), D: D(t), QL: ql, QF: qf, _edge: edge ? 1 : 0 });
    }
    staticFig(el, waveSVG([{ k: 'clk', n: 'clk / E', clk: 1 }, { k: 'D', n: 'D' }, { k: 'QL', n: 'Q latch' }, { k: 'QF', n: 'Q flip-flop' }], hist, { cw: 13, lw: 92, label: 'D latch versus D flip-flop timing' }),
      'Same clk and D into a D latch (E = clk) and a D flip-flop. The **latch** follows D whenever clk is high (look at the changes in the middle of the high phases). The **flip-flop** only changes at the dashed rising edges, to the value D had just before the edge. A short pulse on D while clk is low is ignored by both. [src:09 p14-15; 09 p30-31]');
  };

  FIG['clock'] = (el) => {
    let d = 'M40,70', x = 40;
    for (let k = 0; k < 5; k++) { d += `H${x + 40}V30H${x + 80}V70`; x += 80; }
    const svg = `<svg class="sch" viewBox="0 0 470 110" width="470" role="img" aria-label="clock waveform"><defs><marker id="cfa2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="ah"/></marker></defs>
<text x="32" y="56" text-anchor="end">clk</text><path class="w on" d="${d}"/>
<path class="w" d="M120,86H200" marker-start="url(#cfa2)" marker-end="url(#cfa2)"/><line class="edge" x1="120" y1="24" x2="120" y2="92"/><line class="edge" x1="200" y1="24" x2="200" y2="92"/>
<text x="160" y="104" text-anchor="middle" class="sm">one period T</text><text x="300" y="104" class="sm">frequency f = 1/T</text></svg>`;
    staticFig(el, svg, 'The clock toggles at a fixed rate. One period is one complete cycle; f = 1/T (10 ns → 100 MHz, 1 ns → 1 GHz, 4 ns → 250 MHz). [src:09 p21-22]');
  };

  FIG['ff-symbols'] = (el) => {
    const s = sch();
    const sym = (x, title, ins, clkY, edge) => {
      s.box(x, 30, 64, 80);
      ins.forEach(([n, y]) => { s.wire('', [[x - 16, y], [x, y]]).text(n, x + 5, y + 5, { c: 'sm' }); });
      if (clkY) {
        s.wire('', [[x - 16, clkY], [x, clkY]]);
        if (edge) s.raw(`<path class="g nf" d="M${x},${clkY - 7}L${x + 11},${clkY}L${x},${clkY + 7}"/>`).text('C', x + 14, clkY + 5, { c: 'sm' });
        else s.text('E', x + 5, clkY + 5, { c: 'sm' });
      }
      s.wire('', [[x + 64, 50], [x + 80, 50]]).wire('', [[x + 64, 92], [x + 80, 92]]).text('Q', x + 59, 55, { a: 'end', c: 'sm' }).text('Q′', x + 59, 97, { a: 'end', c: 'sm' });
      s.text(title, x + 32, 130, { a: 'middle', c: 'sm' });
    };
    sym(26, 'SR latch', [['S', 50], ['R', 92]], 0, 0);
    sym(136, 'D latch', [['D', 50]], 92, 0);
    sym(246, 'D flip-flop', [['D', 50]], 92, 1);
    sym(356, 'JK flip-flop', [['J', 46], ['K', 100]], 73, 1);
    sym(466, 'T flip-flop', [['T', 50]], 92, 1);
    s.raw('<line class="edge" x1="221" y1="20" x2="221" y2="138"/>').text('latches: level-sensitive', 110, 16, { a: 'middle', c: 'sm' }).text('flip-flops: edge-triggered (triangle)', 400, 16, { a: 'middle', c: 'sm' });
    staticFig(el, s.svg(560, 140, 'latch and flip-flop symbols', 0), 'Symbols. An edge-triggered clock input always has the small triangle. [src:09 p32-33]');
  };

  FIG['ripple'] = (el) => {
    const s = sch();
    [0, 1, 2, 3].forEach((k) => {
      const i = 3 - k, x = 70 + k * 110;
      s.box(x, 60, 60, 40).text('FA', x + 30, 85, { a: 'middle' });
      s.wire('', [[x + 15, 30], [x + 15, 60]]).wire('', [[x + 45, 30], [x + 45, 60]]).text(`B${i}`, x + 15, 24, { a: 'middle', c: 'sm' }).text(`A${i}`, x + 45, 24, { a: 'middle', c: 'sm' });
      s.wire('', [[x + 30, 100], [x + 30, 126]]).text(`S${i}`, x + 30, 140, { a: 'middle', c: 'sm' });
      s.wire('', [[x + 110, 80], [x + 60, 80]]).raw(`<path class="g nf" d="M${x + 66},${76}L${x + 60},80L${x + 66},84"/>`);
    });
    s.text('C<tspan dy="3" font-size="9">in</tspan>', 496, 76, { c: 'sm' });
    s.wire('', [[70, 80], [30, 80], [30, 126]]).text('C<tspan dy="3" font-size="9">out</tspan>', 30, 140, { a: 'middle', c: 'sm' });
    staticFig(el, s.svg(530, 148, '4-bit ripple-carry adder', 0), '4-bit ripple (parallel) adder: each carry-out feeds the next stage’s carry-in, so the result is only ready once the carry has rippled through all four FAs. [src:4 p13]');
  };

  FIG['addsub'] = (el) => {
    const s = sch();
    s.wire('', [[500, 34], [40, 34]]).text('Add/Sub', 504, 38, { c: 'sm' });
    s.wire('', [[470, 34], [470, 150], [445, 150]]).dot('', 470, 34).text('C<tspan dy="3" font-size="9">0</tspan>', 476, 140, { c: 'sm' });
    [0, 1, 2, 3].forEach((k) => {
      const i = 3 - k, x = 60 + k * 100;
      s.wire('', [[x + 46, 34], [x + 46, 80]]).dot('', x + 46, 34).wire('', [[x + 66, 14], [x + 66, 80]]).text(`y${i}`, x + 72, 18, { c: 'sm' });
      s.box(x + 40, 80, 32, 26).text('=1', x + 56, 98, { a: 'middle', c: 'sm' });
      s.wire('', [[x + 56, 106], [x + 56, 130]]).wire('', [[x + 20, 14], [x + 20, 130]]).text(`x${i}`, x + 14, 18, { a: 'end', c: 'sm' });
      s.box(x + 10, 130, 60, 40).text('FA', x + 40, 155, { a: 'middle' });
      s.wire('', [[x + 40, 170], [x + 40, 192]]).text(`S${i}`, x + 40, 206, { a: 'middle', c: 'sm' });
      if (k < 3) s.wire('', [[x + 110, 150], [x + 70, 150]]);
    });
    s.wire('', [[445, 150], [430, 150]]).wire('', [[70, 150], [34, 150]]).text('C<tspan dy="3" font-size="9">4</tspan>', 30, 146, { a: 'end', c: 'sm' });
    staticFig(el, s.svg(560, 212, 'Combined adder/subtractor', 0), 'Combined add/subtract circuit (Fig 6-12). Each y bit passes through an XOR ("=1") controlled by Add/Sub, which also drives C<sub>0</sub>. Add/Sub = 0: X + Y. Add/Sub = 1: X + Y′ + 1 = X − Y. [src:4 p46]');
  };

  FIG['fsm-structure'] = (el) => {
    const svg = `<svg class="sch" viewBox="0 0 660 190" width="660" role="img" aria-label="FSM hardware structure"><defs><marker id="cfa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" class="ah"/></marker></defs>
<rect class="g" x="110" y="50" width="130" height="64" rx="4"/><text x="175" y="78" text-anchor="middle">next-state</text><text x="175" y="96" text-anchor="middle">logic</text>
<rect class="g" x="290" y="50" width="120" height="64" rx="4"/><text x="350" y="78" text-anchor="middle">state register</text><text x="350" y="96" text-anchor="middle" class="sm">D flip-flops</text>
<path class="g nf" d="M335,114L350,104L365,114"/>
<rect class="g" x="470" y="50" width="110" height="64" rx="4"/><text x="525" y="78" text-anchor="middle">output</text><text x="525" y="96" text-anchor="middle">logic</text>
<path class="w" d="M20,70H110" marker-end="url(#cfa)"/><text x="20" y="62" class="sm">inputs</text>
<path class="w" d="M240,82H290" marker-end="url(#cfa)"/><text x="265" y="74" text-anchor="middle" class="sm">next</text>
<path class="w" d="M410,82H470" marker-end="url(#cfa)"/><text x="440" y="74" text-anchor="middle" class="sm">state</text>
<path class="w" d="M580,82H645" marker-end="url(#cfa)"/><text x="612" y="74" text-anchor="middle" class="sm">outputs</text>
<path class="w" d="M440,82V150H80V96H110" marker-end="url(#cfa)"/><circle class="dot" cx="440" cy="82" r="3.2"/><text x="260" y="166" text-anchor="middle" class="sm">current state fed back</text>
<path class="w" d="M350,184V114" marker-end="url(#cfa)"/><text x="358" y="182" class="sm">clk</text>
<path class="w dash" d="M88,70V22H525V50" marker-end="url(#cfa)"/><circle class="dot" cx="88" cy="70" r="3.2"/><text x="290" y="16" text-anchor="middle" class="sm">Mealy only: outputs also depend on the current inputs</text>
</svg>`;
    staticFig(el, svg, 'FSM hardware: a state register (D flip-flops) plus combinational logic that computes the next state and the outputs from the current state and inputs. In a **Moore** machine the outputs depend on the state only; in a **Mealy** machine (dashed path) they also depend on the inputs. [src:12 p4; 11 p35-36]');
  };

  FIG['tut10-fsm'] = (el) => {
    const st = [{ id: 'S0', label: 'S0\nout 0', x: 70, y: 110, start: 1 }, { id: 'S1', label: 'S1\nout 0', x: 230, y: 110 }, { id: 'S2', label: 'S2\nout 1', x: 390, y: 110 }, { id: 'S3', label: 'S3\nout 1', x: 550, y: 110 }];
    const ed = [{ from: 'S0', to: 'S0', label: '0' }, { from: 'S0', to: 'S1', label: '1' }, { from: 'S1', to: 'S0', label: '0' }, { from: 'S1', to: 'S2', label: '1' },
      { from: 'S2', to: 'S2', label: '1' }, { from: 'S2', to: 'S3', label: '0' }, { from: 'S3', to: 'S2', label: '1' }, { from: 'S3', to: 'S0', label: '0', bend: -150 }];
    staticFig(el, SC.fsmSVG(st, ed, { w: 620, h: 225, r: 30 }), 'Moore state diagram for Tutorial 10 Q1 (arrow labels are the input bit). [src:tut10 Q1]');
  };

  SC.circuitFigures = FIG;
  SC.mountFigures = function (root) {
    root.querySelectorAll('.cfig[data-fig]').forEach((el) => {
      const f = FIG[el.dataset.fig];
      if (!f) { el.textContent = 'Unknown figure: ' + el.dataset.fig; return; }
      try { f(el); } catch (e) { el.textContent = 'Figure failed to draw: ' + e.message; console.error(e); }
    });
  };
})();
