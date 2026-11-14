/* Core: storage, DOM helpers, router, code editor wrapper. */
(function () {
  'use strict';
  const SC = (window.SC = window.SC || {});

  /* ---------- storage (localStorage with in-memory fallback) ---------- */
  const mem = {};
  SC.store = {
    get(k, def) {
      try { const v = localStorage.getItem('sc1005:' + k); if (v != null) return JSON.parse(v); } catch (e) { if (k in mem) return mem[k]; }
      return k in mem ? mem[k] : def;
    },
    set(k, v) {
      mem[k] = v;
      try { localStorage.setItem('sc1005:' + k, JSON.stringify(v)); } catch (e) { /* private mode / quota */ }
    },
    del(k) { delete mem[k]; try { localStorage.removeItem('sc1005:' + k); } catch (e) { /* ignore */ } },
    update(k, def, fn) { const v = SC.store.get(k, def); const r = fn(v); SC.store.set(k, v); return r; },
  };

  /* ---------- DOM helpers ---------- */
  SC.$ = (s, r) => (r || document).querySelector(s);
  SC.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  SC.esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  SC.fmtTime = (sec) => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(s).padStart(2, '0'); };
  SC.toast = (msg, kind) => {
    let t = SC.$('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.className = 'show ' + (kind || '');
    clearTimeout(t._h); t._h = setTimeout(() => { t.className = ''; }, 2600);
  };
  SC.topicById = Object.fromEntries(SC.topics.map((t) => [t.id, t]));
  SC.deckTitle = (id) => (SC.decks.find((d) => d.id === id) || {}).title || id;

  /* ---------- router ---------- */
  const routes = [];
  SC.route = (pattern, handler) => {
    const keys = [];
    const rx = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    routes.push({ rx, keys, handler });
  };
  let cleanup = [];
  SC.onLeave = (fn) => cleanup.push(fn);
  SC.go = (path) => { location.hash = '#' + path; };
  function render() {
    const path = (location.hash || '#/').slice(1) || '/';
    cleanup.forEach((f) => { try { f(); } catch (e) { /* ignore */ } }); cleanup = [];
    const q = path.split('?')[1]; const clean = path.split('?')[0];
    for (const r of routes) {
      const m = r.rx.exec(clean);
      if (m) {
        const params = {}; r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
        params.query = Object.fromEntries(new URLSearchParams(q || ''));
        const app = SC.$('#app');
        document.body.classList.remove('exam-mode');
        try { r.handler(app, params); } catch (e) { console.error(e); app.innerHTML = `<div class="card err"><h2>Something went wrong</h2><pre>${SC.esc(e.stack || e.message)}</pre></div>`; }
        const first = clean.split('/')[1] || '';
        SC.$$('#nav a').forEach((a) => a.classList.toggle('on', a.dataset.r === first));
        window.scrollTo(0, 0);
        document.title = (SC.pageTitle ? SC.pageTitle + ' · ' : '') + 'SC1005 Digital Logic';
        SC.pageTitle = '';
        return;
      }
    }
    SC.$('#app').innerHTML = '<div class="card"><h2>Page not found</h2><p><a href="#/">Go home</a></p></div>';
  }
  SC.start = () => { window.addEventListener('hashchange', render); render(); };

  /* ---------- code editor ---------- */
  SC.makeEditor = function (parent, value, opts) {
    opts = opts || {};
    const cm = CodeMirror(parent, {
      value: value || '', mode: 'verilog', lineNumbers: true, matchBrackets: true, autoCloseBrackets: true,
      indentUnit: 2, tabSize: 2, indentWithTabs: false, lineWrapping: true, viewportMargin: Infinity,
      extraKeys: {
        'Ctrl-Enter': () => opts.onRun && opts.onRun(), 'Cmd-Enter': () => opts.onRun && opts.onRun(),
        Tab: (c) => { if (c.somethingSelected()) c.indentSelection('add'); else c.replaceSelection('  ', 'end'); },
        'Shift-Tab': (c) => c.indentSelection('subtract'),
      },
    });
    if (opts.height) cm.setSize(null, opts.height);
    if (opts.onChange) cm.on('change', opts.onChange);
    cm.markLines = (items) => { // [{line, kind}]
      for (let i = 0; i < cm.lineCount(); i++) { cm.removeLineClass(i, 'background', 'ln-err'); cm.removeLineClass(i, 'background', 'ln-warn'); }
      (items || []).forEach((it) => { if (it.line > 0 && it.line <= cm.lineCount()) cm.addLineClass(it.line - 1, 'background', it.kind === 'warn' ? 'ln-warn' : 'ln-err'); });
    };
    return cm;
  };

  /* ---------- progress ---------- */
  SC.progress = () => {
    const solved = SC.store.get('solved', {});
    const quiz = SC.store.get('quiz', {});
    const cards = SC.store.get('cards', {});
    return {
      solved: Object.keys(solved).length, problems: SC.problems.length,
      mcqDone: Object.keys(quiz).length, mcqOk: Object.values(quiz).filter((x) => x.ok).length, mcq: SC.mcq.length,
      cardsSeen: Object.keys(cards).length, cardsKnown: Object.values(cards).filter((c) => c.box >= 3).length, cardsTotal: SC.cards.length,
    };
  };
})();
