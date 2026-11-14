/* Mock exams: cover page, timed runner (Q1 OMR + Q2 written), marking, review. */
(function () {
  'use strict';
  const SC = window.SC;
  const { esc, $, $$ } = SC;
  const DURATION = 90 * 60;
  const L = 'ABCD';

  const key = (pi, ii) => `${pi}.${ii}`;
  const mcqOf = (e) => e.q1.ids.map((id) => SC.mcq.find((q) => q.id === id));
  function itemMarks(e) { let m = 0; e.q2.forEach((p) => p.items.forEach((it) => { m += it.type === 'drill' ? it.marks : (it.marks || 0); })); return m; }
  const totals = (e) => ({ q1: e.q1.ids.length * e.q1.marksEach, q2: itemMarks(e) });
  const attemptKey = (id) => 'exam:' + id;
  const getDrill = (it) => SC.drillById[it.drill].gen(SC.rng(it.seed), it.opts);
  const normStr = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '');
  const half = (m) => Math.floor(m / 2 * 2) / 2 / 1;

  /* ------------------------------------------------------------ list page */
  SC.route('/exams', (app) => {
    SC.pageTitle = 'Mock exams';
    const hist = SC.store.get('examhist', []);
    app.innerHTML = `<section class="page"><h1>Mock exams</h1>
<p class="lead">Full-length papers in the final-exam format: <strong>1 hour 30 minutes, closed book, 2 questions</strong>. Question 1 is multiple choice answered on an OMR sheet; Question 2 is structured written answers (mixed marks, “unequal marks”). Notes are hidden while the timer runs.</p>
<div class="grid exams">${SC.exams.map((e) => { const t = totals(e); const a = SC.store.get(attemptKey(e.id), null); const best = hist.filter((h) => h.id === e.id).reduce((m, h) => Math.max(m, h.pct), -1);
      return `<div class="card exam"><h3>${esc(e.title)}</h3><p>${esc(e.sub)}</p><ul class="facts"><li>Q1: ${e.q1.ids.length} MCQ × ${e.q1.marksEach} = ${t.q1} marks</li><li>Q2: ${e.q2.length} parts, ${t.q2} marks</li><li>Time: 90 minutes</li></ul>
      ${best >= 0 ? `<p>Best score: <b>${best}%</b></p>` : ''}
      <div class="row">${a && !a.finished ? `<a class="btn primary" href="#/exams/${e.id}/run">Resume attempt</a>` : `<a class="btn primary" href="#/exams/${e.id}">Start</a>`}${a && a.finished ? `<a class="btn" href="#/exams/${e.id}/result">Last result</a>` : ''}</div></div>`; }).join('')}</div>
<div class="card"><h2>Past papers</h2><p>The six real past papers (2016–2019) are in your course folder. They are scanned PDFs: print them or use them as extra Question 2 practice and check against the Learn notes.</p></div></section>`;
  });

  /* ------------------------------------------------------------ cover page */
  SC.route('/exams/:id', (app, { id }) => {
    const e = SC.examById[id]; if (!e) { app.innerHTML = '<div class="card"><h2>Unknown exam</h2></div>'; return; }
    SC.pageTitle = e.title;
    const t = totals(e);
    const active = SC.store.get(attemptKey(id), null);
    app.innerHTML = `<section class="page narrow"><div class="crumbs"><a href="#/exams">Mock exams</a> › ${esc(e.title)}</div>
<div class="paper cover"><div class="pc-head"><div class="pc-t1">PRACTICE EXAMINATION</div><div class="pc-t2">SC1005 – DIGITAL LOGIC</div></div>
<div class="pc-row"><span>${esc(e.title)}</span><span>Time Allowed: 1 hour 30 minutes</span></div>
<div class="pc-boxes"><div>Matric Number:<span class="boxes">${'<i></i>'.repeat(9)}</span></div><div>Seat Number:<span class="boxes">${'<i></i>'.repeat(5)}</span></div></div>
<table class="marks"><tr><th>Marks</th><th>Q1</th><th>Q2</th><th>Total</th></tr><tr><td>(Examiner use only)</td><td>/${t.q1}</td><td>/${t.q2}</td><td>/${t.q1 + t.q2}</td></tr></table>
<h4>INSTRUCTIONS</h4>
<ol class="instr"><li>Shade the answers for <b>Question 1</b> on the OMR (optical mark recognition) sheet.</li><li>Write the answers for <b>Question 2</b> on the question paper immediately following the questions. Only answers in these sections will be assessed.</li><li>This is a <b>closed-book</b> examination: no notes, no simulator. (This site hides the study pages while the exam runs.)</li><li>This paper contains 2 questions. Answer <b>ALL</b> questions. Questions carry <b>unequal marks</b>.</li><li>The timer starts when you press <i>Start</i> and keeps running even if you close the tab.</li></ol></div>
<div class="card center">${active && !active.finished ? `<p>You have an attempt in progress.</p><a class="btn primary" href="#/exams/${id}/run">Resume attempt</a> <button class="btn ghost" id="restart">Discard and restart</button>` : `<label class="chk"><input type="checkbox" id="untimed"> Untimed practice (no countdown)</label><br><button class="btn primary big" id="start">Start the exam</button>`}</div>
<p class="muted center">Format assumption: the real paper’s Question 1 size and mark split are not published here, so these mocks use 20 MCQ × 2 marks for Q1 and a 60-mark Q2 built from past-paper question types.</p></section>`;
    const start = () => { SC.store.set(attemptKey(id), { startedAt: Date.now(), timed: !($('#untimed') && $('#untimed').checked), answers: {}, finished: false }); SC.go(`/exams/${id}/run`); };
    if ($('#start')) $('#start').onclick = start;
    if ($('#restart')) $('#restart').onclick = () => { if (confirm('Discard the current attempt?')) { SC.store.del(attemptKey(id)); SC.go('/exams/' + id); window.dispatchEvent(new Event('hashchange')); } };
  });

  /* ------------------------------------------------------------ item rendering */
  function renderItem(e, it, k, ans) {
    const m = it.type === 'html' ? '' : `<span class="marks-tag">[${it.marks} mark${it.marks === 1 ? '' : 's'}]</span>`;
    const a = ans[k] || {};
    switch (it.type) {
      case 'html': return `<div class="item">${it.html}</div>`;
      case 'drill': {
        const q = getDrill(it);
        return `<div class="item"><div class="ihead">${m}</div>${q.html}<div class="fields">${q.fields.map((f) => `<label class="fld ${f.short ? 'short' : ''} ${f.wide ? 'wide' : ''}"><span>${esc(f.label)}</span>${f.type === 'select' ? `<select data-f="${f.key}">${f.options.map((o) => `<option ${a[f.key] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : `<input type="text" data-f="${f.key}" value="${esc(a[f.key] || '')}" autocomplete="off" spellcheck="false">`}</label>`).join('')}</div></div>`;
      }
      case 'text': return `<div class="item"><div class="ihead">${m}</div><div class="prose">${md(it.prompt)}</div><textarea data-f="t" rows="6" placeholder="Write your answer here (on paper in the real exam)…">${esc(a.t || '')}</textarea></div>`;
      case 'num': return `<div class="item"><div class="ihead">${m}</div><div class="prose">${md(it.prompt)}</div><label class="fld short"><span>Answer</span><input type="text" data-f="v" value="${esc(a.v || '')}" autocomplete="off"></label></div>`;
      case 'select': return `<div class="item"><div class="ihead">${m}</div><div class="prose">${md(it.prompt)}</div><div class="radios">${it.options.map((o, i) => `<label class="radio"><input type="radio" name="r-${k}" data-f="v" value="${i}" ${String(a.v) === String(i) ? 'checked' : ''}><span>${mdInline(o)}</span></label>`).join('')}</div></div>`;
      case 'expr': return `<div class="item"><div class="ihead">${m}</div><div class="prose">${md(it.prompt)}</div><label class="fld wide"><span>Expression</span><input type="text" data-f="v" value="${esc(a.v || '')}" autocomplete="off" spellcheck="false" placeholder="${it.vars.join(', ')} · use ' for NOT, + for OR"></label></div>`;
      case 'table': return `<div class="item"><div class="ihead">${m}</div><div class="prose">${md(it.prompt)}</div><div class="tw"><table class="tt fill"><tr>${it.headers.map((h, ci) => `<th class="${it.given.includes(ci) ? '' : 'out'}">${esc(h)}</th>`).join('')}</tr>${it.rows.map((r, ri) => `<tr>${r.map((c, ci) => it.given.includes(ci) ? `<td>${esc(c)}</td>` : `<td class="out"><input type="text" maxlength="1" data-f="${ri}-${ci}" value="${esc(a[ri + '-' + ci] || '')}" inputmode="numeric"></td>`).join('')}</tr>`).join('')}</table></div></div>`;
      case 'problem': {
        const p = SC.problemById[it.id];
        return `<div class="item"><div class="ihead">${m}</div><div class="prose"><h4>${esc(p.title)}</h4>${md(p.statement)}</div>${p.provided ? `<details class="prov"><summary>Provided module</summary><pre class="code"><code>${esc(p.provided)}</code></pre></details>` : ''}<div class="ed-exam" data-ed="${k}"></div><p class="muted">Write your Verilog above. There is no simulator in the real exam; the code is checked when you submit.</p></div>`;
      }
    }
    return '';
  }

  /* ------------------------------------------------------------ run page */
  SC.route('/exams/:id/run', (app, { id }) => {
    const e = SC.examById[id];
    const att = SC.store.get(attemptKey(id), null);
    if (!e || !att) { SC.go('/exams/' + (e ? id : '')); return; }
    if (att.finished) { SC.go(`/exams/${id}/result`); return; }
    SC.pageTitle = e.title + ' (in progress)';
    document.body.classList.add('exam-mode');
    const t = totals(e);
    const qs = mcqOf(e);
    const ans = att.answers; ans.q1 = ans.q1 || {};
    const save = () => SC.store.set(attemptKey(id), att);
    const editors = {};

    app.innerHTML = `<div class="exam-bar"><b>${esc(e.title)}</b><span class="sp"></span><nav><a href="#q1" class="qnav">Q1 · OMR</a><a href="#q2" class="qnav">Q2 · Written</a></nav><span class="timer" id="timer">--:--</span><button class="btn primary" id="submit">Submit exam</button><button class="btn ghost" id="exit" title="Leave (timer keeps running)">Exit</button></div>
<div class="paper exam" id="paper">
<div class="pc-head"><div class="pc-t1">PRACTICE EXAMINATION</div><div class="pc-t2">SC1005 – DIGITAL LOGIC</div></div>
<div class="pc-row"><span>${esc(e.title)}</span><span>Time Allowed: 1 hour 30 minutes</span></div>
<p class="inst">Answer <b>ALL</b> questions. Closed book. Questions carry unequal marks. Question 1 is answered on the OMR sheet (right); Question 2 is answered in the spaces provided.</p>
<h2 class="qh" id="q1">Question 1 <small>(${t.q1} marks) — Multiple choice. Shade ONE answer per question on the OMR sheet.</small></h2>
<div class="q1wrap"><ol class="q1list">${qs.map((q, i) => `<li id="mq${i}"><div class="mqtext">${md(q.q)}</div><ol class="mopts" type="A">${q.opts.map((o) => `<li>${mdInline(o)}</li>`).join('')}</ol></li>`).join('')}</ol>
<aside class="omr" aria-label="OMR answer sheet"><div class="omr-title">OMR SHEET</div><div class="omr-sub">Question 1</div><div class="omr-grid"><span></span>${L.split('').map((c) => `<b>${c}</b>`).join('')}${qs.map((q, i) => `<span class="n"><a href="#mq${i}">${i + 1}</a></span>${L.split('').map((c, k) => `<button class="bub ${ans.q1[q.id] === k ? 'on' : ''}" data-q="${q.id}" data-k="${k}" aria-label="Q${i + 1} option ${c}"></button>`).join('')}`).join('')}</div><div class="omr-count"><span id="omrN"></span> answered</div></aside></div>
<h2 class="qh" id="q2">Question 2 <small>(${t.q2} marks) — Structured questions. Answer in the spaces provided.</small></h2>
${e.q2.map((p, pi) => `<section class="part"><h3>(${String.fromCharCode(97 + pi)}) ${esc(p.title)}</h3>${p.items.map((it, ii) => renderItem(e, it, key(pi, ii), ans)).join('')}</section>`).join('')}
<p class="eop">— END OF PAPER —</p></div>`;

    /* OMR bubbles */
    const omrCount = () => { $('#omrN').textContent = `${Object.keys(ans.q1).length}/${qs.length}`; };
    $$('.bub', app).forEach((b) => {
      b.onclick = () => {
        const q = b.dataset.q, k = +b.dataset.k;
        if (ans.q1[q] === k) delete ans.q1[q]; else ans.q1[q] = k;
        $$(`.bub[data-q="${q}"]`, app).forEach((x) => x.classList.toggle('on', ans.q1[q] === +x.dataset.k));
        omrCount(); save();
      };
    });
    omrCount();

    /* inputs */
    $$('.item', app).forEach((el) => {
      const ed = el.querySelector('[data-ed]');
      const part = el.closest('.part'); // find key by position
      const pi = $$('.part', app).indexOf(part);
      const ii = $$('.item', part).indexOf(el);
      const k = key(pi, ii);
      const it = e.q2[pi].items[ii];
      if (ed) {
        const p = SC.problemById[it.id];
        const cm = SC.makeEditor(ed, (ans[k] && ans[k].code) != null ? ans[k].code : p.starter, { onChange: () => { ans[k] = { code: cm.getValue() }; save(); } });
        editors[k] = cm;
      }
      const collect = () => {
        const o = ans[k] && ans[k].code != null ? ans[k] : {};
        $$('[data-f]', el).forEach((inp) => { if (inp.type === 'radio') { if (inp.checked) o[inp.dataset.f] = inp.value; } else o[inp.dataset.f] = inp.value; });
        ans[k] = o; save();
      };
      el.addEventListener('input', collect); el.addEventListener('change', collect);
    });

    /* timer */
    const tick = () => {
      const el = $('#timer'); if (!el) return;
      if (!att.timed) { el.textContent = SC.fmtTime((Date.now() - att.startedAt) / 1000) + ' elapsed'; return; }
      const rem = DURATION - (Date.now() - att.startedAt) / 1000;
      el.textContent = SC.fmtTime(rem); el.classList.toggle('low', rem < 600);
      if (rem <= 0) { clearInterval(iv); SC.toast('Time is up: submitting', 'warn'); submit(); }
      else if (Math.abs(rem - 900) < 1) SC.toast('15 minutes left', 'warn');
      else if (Math.abs(rem - 300) < 1) SC.toast('5 minutes left', 'warn');
    };
    const iv = setInterval(tick, 1000); tick();
    SC.onLeave(() => clearInterval(iv));
    $('#exit').onclick = () => { if (confirm('Leave the exam? Your answers are saved' + (att.timed ? ' and the timer keeps running' : '') + '.')) SC.go('/exams'); };
    $('#submit').onclick = () => {
      const unanswered = qs.length - Object.keys(ans.q1).length;
      if (confirm(`Submit now?${unanswered ? ` ${unanswered} Q1 question(s) are unanswered.` : ''} You cannot change answers afterwards.`)) { clearInterval(iv); submit(); }
    };
    function submit() {
      att.finished = true; att.finishedAt = Date.now();
      att.result = gradeAll(e, att);
      save();
      const hist = SC.store.get('examhist', []);
      hist.push({ id, ts: Date.now(), pct: att.result.pct });
      SC.store.set('examhist', hist.slice(-30));
      SC.go(`/exams/${id}/result`);
    }
  });

  /* ------------------------------------------------------------ grading */
  function exprSpec(it) {
    const n = it.vars.length; let ones = it.minterms;
    if (!ones) { ones = []; for (let m = 0; m < 1 << n; m++) { const env = {}; it.vars.forEach((v, i) => { env[v] = !!((m >> (n - 1 - i)) & 1); }); if (it.fn(env)) ones.push(m); } }
    return { ones, best: B.minSOP(it.vars, ones) };
  }
  function gradeItem(e, it, k, a) {
    a = a || {};
    const max = it.marks;
    switch (it.type) {
      case 'drill': {
        const q = getDrill(it); const vals = {}; q.fields.forEach((f) => { vals[f.key] = a[f.key] || ''; });
        const r = q.check(vals);
        const got = r.ok ? max : r.partial ? Math.floor(max / 2) : 0;
        return { got, max, msg: r.msg, answer: Object.values(vals).join(' | ') || '(blank)', solution: q.solution, html: q.html };
      }
      case 'num': {
        const want = String(it.answer); let ok = false; const v = String(a.v || '').trim();
        if (it.numeric === 'num') ok = Math.abs(parseFloat(v) - parseFloat(want)) < 1e-6;
        else if (it.numeric === 'list') ok = v.replace(/[^\d,]/g, '').split(',').filter(Boolean).sort().join(',') === want.split(',').sort().join(',');
        else ok = normStr(v) === normStr(want);
        return { got: ok ? max : 0, max, msg: ok ? 'Correct' : 'Incorrect', answer: v || '(blank)', solution: `Answer: **${want}**. ${it.explain || ''}`, prompt: it.prompt };
      }
      case 'select': {
        const ok = String(a.v) === String(it.answer);
        return { got: ok ? max : 0, max, msg: ok ? 'Correct' : 'Incorrect', answer: a.v != null ? it.options[+a.v] : '(blank)', solution: `Answer: **${it.options[it.answer]}**. ${it.explain || ''}`, prompt: it.prompt };
      }
      case 'expr': {
        const { ones, best } = exprSpec(it);
        const r = B.checkExpr(a.v || '', it.vars, ones);
        let got = 0, msg;
        if (r.parseError) msg = 'Unreadable: ' + r.parseError;
        else if (!r.ok) msg = 'Not equivalent to the required function.';
        else if (it.minimal && r.literals > best.literals) { got = Math.floor(max / 2); msg = `Equivalent but not minimal (${r.literals} literals vs ${best.literals}).`; }
        else { got = max; msg = 'Correct' + (it.minimal ? ' and minimal' : ''); }
        return { got, max, msg, answer: a.v || '(blank)', solution: `Minimal SOP: **${best.str}**. ${it.explain || ''}`, prompt: it.prompt };
      }
      case 'table': {
        let good = 0, total = 0;
        it.rows.forEach((r, ri) => r.forEach((c, ci) => { if (!it.given.includes(ci)) { total++; if ((a[ri + '-' + ci] || '').trim() === c) good++; } }));
        const got = Math.round(max * good / total * 2) / 2;
        return { got, max, msg: `${good}/${total} cells correct`, answer: `${good}/${total} cells`, solution: 'Correct table: ' + it.rows.map((r) => r.join(' ')).join(' ; '), prompt: it.prompt };
      }
      case 'problem': {
        const p = SC.problemById[it.id];
        const code = a.code != null ? a.code : p.starter;
        const modName = /module\s+(\w+)/.exec(p.ref)[1];
        const r = V.judge(code, { module: modName, ref: p.ref, provided: p.provided, must: p.must, forbid: p.forbid, vectors: p.vectors, biasHigh: p.biasHigh });
        return { got: r.ok ? max : 0, max, msg: r.ok ? 'All tests passed' : r.message, answer: code, solution: '```verilog\n' + p.ref + '\n```', isCode: true };
      }
      case 'text': return { got: 0, max, self: true, msg: 'Self-mark using the marking points', answer: a.t || '(blank)', solution: it.model, rubric: it.rubric, prompt: it.prompt };
    }
    return { got: 0, max: 0 };
  }
  function gradeAll(e, att) {
    const ans = att.answers; const qs = mcqOf(e);
    let q1 = 0; qs.forEach((q) => { if (ans.q1 && ans.q1[q.id] === q.ans) q1 += e.q1.marksEach; });
    const items = {}; let auto = 0, selfMax = 0, autoMax = 0;
    e.q2.forEach((p, pi) => p.items.forEach((it, ii) => {
      if (it.type === 'html') return;
      const g = gradeItem(e, it, key(pi, ii), ans[key(pi, ii)]);
      items[key(pi, ii)] = { got: g.got, max: g.max, self: !!g.self };
      if (g.self) selfMax += g.max; else { auto += g.got; autoMax += g.max; }
    }));
    const t = totals(e);
    return { q1, q1max: t.q1, auto, autoMax, selfMax, items, pct: Math.round(100 * (q1 + auto) / Math.max(1, t.q1 + autoMax)) };
  }

  /* ------------------------------------------------------------ result page */
  SC.route('/exams/:id/result', (app, { id }) => {
    const e = SC.examById[id]; const att = SC.store.get(attemptKey(id), null);
    if (!e || !att || !att.finished) { SC.go('/exams'); return; }
    SC.pageTitle = e.title + ' result';
    const res = att.result; att.self = att.self || {};
    const t = totals(e); const qs = mcqOf(e); const ans = att.answers;
    const selfTotal = () => Object.values(att.self).reduce((a, b) => a + (+b || 0), 0);
    const spent = Math.round((att.finishedAt - att.startedAt) / 60000);
    app.innerHTML = `<section class="page"><div class="crumbs"><a href="#/exams">Mock exams</a> › ${esc(e.title)} › Result</div>
<h1>${esc(e.title)}: result</h1>
<div class="scoreboard"><div class="sb"><span>Q1 (MCQ)</span><b>${res.q1}/${t.q1}</b></div><div class="sb"><span>Q2 auto-marked</span><b>${res.auto}/${res.autoMax}</b></div><div class="sb"><span>Q2 self-marked</span><b id="selfs">0/${res.selfMax}</b></div><div class="sb total"><span>Total</span><b id="grand"></b></div><div class="sb"><span>Time used</span><b>${spent} min</b></div></div>
<p class="muted">Free-text answers cannot be marked automatically: compare with the model answer below and enter your own mark for each (be strict: the real marking scheme is point-based).</p>
<h2>Question 1 review</h2><div class="rev q1rev">${qs.map((q, i) => { const a = ans.q1 && ans.q1[q.id]; const ok = a === q.ans; return `<div class="rv ${ok ? 'pass' : 'fail'}"><div class="rvh"><b>${i + 1}.</b> ${ok ? '✔' : a == null ? '— unanswered' : '✘'} <span class="muted">your answer: ${a == null ? 'none' : L[a]} · correct: ${L[q.ans]}</span></div><div class="mqtext">${md(q.q)}</div><ol class="mopts" type="A">${q.opts.map((o, k) => `<li class="${k === q.ans ? 'right' : k === a ? 'wrong' : ''}">${mdInline(o)}</li>`).join('')}</ol><div class="why">${md(q.why)}</div></div>`; }).join('')}</div>
<h2>Question 2 review</h2>
${e.q2.map((p, pi) => `<section class="part"><h3>(${String.fromCharCode(97 + pi)}) ${esc(p.title)}</h3>${p.items.map((it, ii) => {
      if (it.type === 'html') return `<div class="item">${it.html}</div>`;
      const k = key(pi, ii); const g = gradeItem(e, it, k, ans[k]);
      const promptHtml = it.type === 'problem' ? `<div class="prose"><h4>${esc(SC.problemById[it.id].title)}</h4>${md(SC.problemById[it.id].statement)}</div>` : it.type === 'drill' ? g.html : `<div class="prose">${md(it.prompt || '')}</div>`;
      return `<div class="item rv ${g.self ? '' : g.got === g.max ? 'pass' : g.got > 0 ? 'part' : 'fail'}">${promptHtml}
<div class="yours"><b>Your answer</b>${g.isCode ? `<pre class="code"><code>${esc(g.answer)}</code></pre>` : `<pre class="ans">${esc(g.answer)}</pre>`}</div>
<div class="verdict">${g.self ? `<label>Your mark: <input type="number" class="selfm" data-k="${k}" min="0" max="${g.max}" step="0.5" value="${att.self[k] != null ? att.self[k] : ''}"> / ${g.max}</label>${g.rubric ? '<ul class="rubric">' + g.rubric.map((r) => `<li>${esc(r)}</li>`).join('') + '</ul>' : ''}` : `<b>${g.got}/${g.max}</b> · ${md(g.msg)}`}</div>
<details ${g.self || g.got < g.max ? 'open' : ''}><summary>Model answer</summary><div class="prose">${md(g.solution || '')}</div></details></div>`;
    }).join('')}</section>`).join('')}
<div class="row"><a class="btn primary" href="#/exams/${id}">Retake</a> <a class="btn" href="#/exams">All exams</a></div></section>`;
    const upd = () => {
      const s = selfTotal();
      $('#selfs').textContent = `${s}/${res.selfMax}`;
      const tot = res.q1 + res.auto + s, max = t.q1 + t.q2;
      $('#grand').textContent = `${tot}/${max} (${Math.round(100 * tot / max)}%)`;
    };
    $$('.selfm', app).forEach((inp) => {
      inp.oninput = () => { const v = Math.max(0, Math.min(+inp.max, parseFloat(inp.value) || 0)); att.self[inp.dataset.k] = v; SC.store.set(attemptKey(id), att); upd(); };
    });
    upd();
  });
})();
