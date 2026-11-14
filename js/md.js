/* Tiny markdown renderer for notes & flashcards.
 * Supports: # ## ###, paragraphs, - lists, 1. lists, | tables |, ``` fenced code, > [!tip|trap|exam|note] callouts,
 * **bold**, *italic*, `code`, raw HTML blocks (lines starting with '<').
 */
(function (root) {
  'use strict';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function inline(s) {
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
    // keep inline HTML tags (<sub>, <sup>, <br>, <span ...>) intact; escape stray < only when not a tag
    s = s.replace(/<(?!\/?(sub|sup|br|span|b|i|em|strong|small|u|code)\b)/g, '&lt;');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
    return s;
  }
  function md(src) {
    const lines = src.replace(/\r/g, '').split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
      let l = lines[i];
      if (!l.trim()) { i++; continue; }
      let m;
      if ((m = /^```(\w*)/.exec(l))) {
        const buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++;
        out.push(`<pre class="code" data-lang="${m[1]}"><code>${esc(buf.join('\n'))}</code></pre>`);
        continue;
      }
      if ((m = /^(#{1,4})\s+(.*)$/.exec(l))) { out.push(`<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`); i++; continue; }
      if (/^\s*</.test(l) && !/^\s*<(sub|sup|br|span|b|i|em|strong|small|u|code)\b/.test(l)) {
        const buf = [];
        while (i < lines.length && lines[i].trim()) buf.push(lines[i++]);
        out.push(buf.join('\n')); continue;
      }
      if (/^>/.test(l)) {
        const buf = [];
        while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
        let kind = 'note', first = buf[0];
        const k = /^\[!(\w+)\]\s*(.*)$/.exec(first);
        if (k) { kind = k[1]; buf[0] = k[2]; }
        const title = { tip: 'Tip', trap: 'Exam trap', exam: 'In the exam', note: 'Note', key: 'Key idea' }[kind] || kind;
        out.push(`<div class="callout ${kind}"><div class="ct">${title}</div>${md(buf.join('\n'))}</div>`);
        continue;
      }
      if (/^\|/.test(l)) {
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
        const cells = (r) => r.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim());
        const head = cells(rows[0]);
        const body = rows.slice(/^\|[\s:|-]+\|?\s*$/.test(rows[1] || '') ? 2 : 1);
        out.push(`<div class="tw"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
        const ordered = /^\s*\d+\./.test(l);
        const items = [];
        while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
          let t = lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, '');
          while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) t += ' ' + lines[i++].trim();
          items.push(t);
        }
        out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
        continue;
      }
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|\||\s*([-*]|\d+\.)\s+)/.test(lines[i]) && !/^\s*<(?!(sub|sup|br|span|b|i|em|strong|small|u|code)\b)/.test(lines[i])) buf.push(lines[i++]);
      out.push(`<p>${inline(buf.join(' '))}</p>`);
    }
    return out.join('\n');
  }
  root.md = md; root.mdInline = inline; root.escHtml = esc;
})(typeof window !== 'undefined' ? window : globalThis);
