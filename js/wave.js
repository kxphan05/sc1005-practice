/* SVG waveform renderer.  W.render(signals, tEnd, opts) -> SVG string.
 * signals: [{name, w, trace:[[t,BigInt],...], kind?:'clk'}]
 */
(function (root) {
  'use strict';
  const W = (root.W = {});
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function niceStep(tEnd, pxPerUnit) {
    const target = 70 / pxPerUnit; // ~70px between ticks
    const mag = Math.pow(10, Math.floor(Math.log10(Math.max(target, 1e-9))));
    for (const m of [1, 2, 5, 10]) if (m * mag >= target) return Math.max(1, m * mag);
    return 10 * mag;
  }

  W.render = function (signals, tEnd, opts) {
    opts = opts || {};
    tEnd = Math.max(tEnd, 1);
    const rowH = 34, labelW = opts.labelW || 130, padR = 14, top = 26;
    const width = opts.width || 900;
    const plotW = width - labelW - padR;
    const px = plotW / tEnd;
    const H = top + signals.length * rowH + 10;
    const x = (t) => labelW + t * px;
    let s = `<svg class="wave" viewBox="0 0 ${width} ${H}" width="100%" role="img" aria-label="waveform">`;
    // grid + axis
    const step = niceStep(tEnd, px);
    for (let t = 0; t <= tEnd + 1e-9; t += step) {
      s += `<line class="grid" x1="${x(t)}" y1="${top - 6}" x2="${x(t)}" y2="${H - 6}"/>`;
      s += `<text class="tick" x="${x(t)}" y="14" text-anchor="middle">${t}</text>`;
    }
    signals.forEach((sg, i) => {
      const y0 = top + i * rowH, yh = y0 + 6, yl = y0 + rowH - 8, ym = (yh + yl) / 2;
      s += `<text class="lbl" x="${labelW - 8}" y="${ym + 4}" text-anchor="end">${esc(sg.name)}${sg.w > 1 ? `<tspan class="wd">[${sg.w - 1}:0]</tspan>` : ''}</text>`;
      const tr = sg.trace.filter((e) => e[0] <= tEnd);
      if (!tr.length) tr.push([0, 0n]);
      if (sg.w === 1) {
        let d = '';
        let prevY = null;
        tr.forEach(([t, v], k) => {
          const yy = v ? yh : yl;
          if (k === 0) d += `M${x(Math.max(0, t))},${yy}`; else d += `L${x(t)},${prevY}L${x(t)},${yy}`;
          prevY = yy;
        });
        d += `L${x(tEnd)},${prevY}`;
        s += `<path class="sig${sg.kind === 'clk' ? ' clk' : ''}" d="${d}"/>`;
      } else {
        const hex = opts.radix === 'bin' ? (v) => v.toString(2).padStart(sg.w, '0') : opts.radix === 'dec' ? (v) => v.toString(10) : (v) => v.toString(16).toUpperCase().padStart(Math.ceil(sg.w / 4), '0');
        for (let k = 0; k < tr.length; k++) {
          const t0 = tr[k][0], t1 = k + 1 < tr.length ? tr[k + 1][0] : tEnd;
          const xa = x(t0), xb = x(t1), c = 3;
          if (xb - xa < 1) continue;
          const lab = hex(tr[k][1]);
          s += `<path class="bus" d="M${xa + c},${yh}L${xb - c},${yh}L${xb},${ym}L${xb - c},${yl}L${xa + c},${yl}L${xa},${ym}Z"/>`;
          if (xb - xa > lab.length * 7 + 10) s += `<text class="busv" x="${(xa + xb) / 2}" y="${ym + 4}" text-anchor="middle">${lab}</text>`;
        }
      }
    });
    return s + '</svg>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
