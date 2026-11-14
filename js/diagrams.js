/* SVG diagram helpers: FSM state diagrams. */
window.SC = window.SC || {};
(function () {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  /**
   * states: [{id,label:'name\ncode', x, y, sub:'x=1'}]
   * edges:  [{from,to,label, bend?:number, curve?:'bottom'|'top'}]
   */
  SC.fsmSVG = function (states, edges, o) {
    o = o || {};
    const W = o.w || 520, H = o.h || 260, R = o.r || 28;
    const byId = Object.fromEntries(states.map((s) => [s.id, s]));
    let svg = `<svg class="fsm" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img" aria-label="state diagram">
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="ah"/></marker></defs>`;
    const hasRev = (e) => edges.some((f) => f !== e && f.from === e.to && f.to === e.from);
    for (const e of edges) {
      const a = byId[e.from], b = byId[e.to];
      if (!a || !b) continue;
      if (a === b) {
        const dir = e.curve === 'bottom' ? 1 : -1;
        const y = a.y + dir * R;
        svg += `<path class="arc" d="M${a.x - 14},${y - dir * 2}C${a.x - 44},${y + dir * 48} ${a.x + 44},${y + dir * 48} ${a.x + 14},${y - dir * 2}" marker-end="url(#ah)"/>`;
        svg += `<text class="elab" x="${a.x}" y="${y + dir * 46 + (dir > 0 ? 8 : -2)}" text-anchor="middle">${esc(e.label || '')}</text>`;
        continue;
      }
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      const nx = -dy / d, ny = dx / d;
      let off = e.bend || 0;
      if (!off && e.curve) off = (e.curve === 'bottom' ? 1 : -1) * (dx >= 0 ? 1 : -1) * 70;
      if (!off && hasRev(e)) off = 34;
      if (!off) {
        const ux = dx / d, uy = dy / d;
        const x1 = a.x + ux * R, y1 = a.y + uy * R, x2 = b.x - ux * (R + 2), y2 = b.y - uy * (R + 2);
        svg += `<path class="arc" d="M${x1},${y1}L${x2},${y2}" marker-end="url(#ah)"/>`;
        svg += `<text class="elab" x="${(x1 + x2) / 2 + nx * 12}" y="${(y1 + y2) / 2 + ny * 12 + 4}" text-anchor="middle">${esc(e.label || '')}</text>`;
      } else {
        const cx = (a.x + b.x) / 2 + nx * off, cy = (a.y + b.y) / 2 + ny * off;
        const ua = [cx - a.x, cy - a.y], la = Math.hypot(...ua), ub = [cx - b.x, cy - b.y], lb = Math.hypot(...ub);
        const x1 = a.x + ua[0] / la * R, y1 = a.y + ua[1] / la * R, x2 = b.x + ub[0] / lb * (R + 2), y2 = b.y + ub[1] / lb * (R + 2);
        svg += `<path class="arc" d="M${x1},${y1}Q${cx},${cy} ${x2},${y2}" marker-end="url(#ah)"/>`;
        const mx = 0.25 * x1 + 0.5 * cx + 0.25 * x2, my = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
        const sg = off > 0 ? 1 : -1;
        svg += `<text class="elab" x="${mx + nx * sg * 11}" y="${my + ny * sg * 11 + 4}" text-anchor="middle">${esc(e.label || '')}</text>`;
      }
    }
    for (const s of states) {
      svg += `<circle class="st" cx="${s.x}" cy="${s.y}" r="${R}"/>`;
      const lines = String(s.label).split('\n');
      lines.forEach((ln, i) => { svg += `<text class="slab" x="${s.x}" y="${s.y + (lines.length === 1 ? 5 : i === 0 ? -3 : 12)}" text-anchor="middle">${esc(ln)}</text>`; });
      if (s.sub) svg += `<text class="ssub" x="${s.x}" y="${s.y + R + 15}" text-anchor="middle">${esc(s.sub)}</text>`;
      if (s.start) svg += `<path class="arc" d="M${s.x - R - 28},${s.y}L${s.x - R - 2},${s.y}" marker-end="url(#ah)"/>`;
    }
    return svg + '</svg>';
  };
})();
