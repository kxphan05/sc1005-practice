/* Study views: flashcards (spaced repetition), MCQ trainer, generated drills. */
(function () {
  'use strict';
  const SC = window.SC;
  const { esc, $, $$ } = SC;
  const DAY = 86400000;
  const INTERVALS = [0, 1, 3, 7, 14, 30];
  const shuffle = (a, rnd) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor((rnd || Math.random)() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ================================================================= flashcards */
  function deckStats(deckId) {
    const st = SC.store.get('cards', {});
    const cards = deckId === 'all' ? SC.cards : SC.cards.filter((c) => c.deck === deckId);
    const now = Date.now();
    let due = 0, fresh = 0, known = 0;
    cards.forEach((c) => { const s = st[c.id]; if (!s) { fresh++; due++; } else { if (s.due <= now) due++; if (s.box >= 3) known++; } });
    return { total: cards.length, due, fresh, known };
  }

  SC.route('/cards', (app) => {
    SC.pageTitle = 'Flashcards';
    const all = deckStats('all');
    app.innerHTML = `<section class="page"><h1>Flashcards</h1>
<p class="lead">${all.total} cards with spaced repetition: cards you rate <em>Good</em> or <em>Easy</em> come back later, <em>Again</em> comes back in this session. ${all.known} of ${all.total} are well known (box ≥ 3).</p>
<div class="grid decks">
<a class="card deck all" href="#/cards/all"><h3>All decks</h3><p>${all.due} due · ${all.total} cards</p><div class="bar"><i style="width:${all.total ? (100 * all.known / all.total) : 0}%"></i></div></a>
${SC.decks.map((d) => { const s = deckStats(d.id); return `<a class="card deck" href="#/cards/${d.id}"><h3>${esc(d.title)}</h3><p>${s.due} due · ${s.total} cards</p><div class="bar"><i style="width:${s.total ? (100 * s.known / s.total) : 0}%"></i></div></a>`; }).join('')}
</div>
<p><button class="btn ghost" id="resetc">Reset all flashcard progress</button></p></section>`;
    $('#resetc').onclick = () => { if (confirm('Reset all flashcard progress?')) { SC.store.set('cards', {}); window.dispatchEvent(new Event('hashchange')); } };
  });

  SC.route('/cards/:deck', (app, { deck, query }) => {
    const title = deck === 'all' ? 'All decks' : SC.deckTitle(deck);
    SC.pageTitle = 'Flashcards: ' + title;
    const pool = deck === 'all' ? SC.cards : SC.cards.filter((c) => c.deck === deck);
    const st = SC.store.get('cards', {});
    const now = Date.now();
    const studyAll = query.mode === 'all';
    let queue = pool.filter((c) => studyAll || !st[c.id] || st[c.id].due <= now);
    queue = shuffle(queue);
    const total = queue.length;
    let done = 0, flipped = false, stats = { again: 0, hard: 0, good: 0, easy: 0 };
    if (!total) {
      app.innerHTML = `<section class="page narrow"><div class="crumbs"><a href="#/cards">Flashcards</a> › ${esc(title)}</div><div class="card center"><h2>All caught up 🎉</h2><p>No cards are due in this deck.</p><a class="btn primary" href="#/cards/${deck}?mode=all">Study the whole deck anyway</a></div></section>`;
      return;
    }
    app.innerHTML = `<section class="page narrow"><div class="crumbs"><a href="#/cards">Flashcards</a> › ${esc(title)}</div>
<div class="fc-top"><span id="fcCount"></span><div class="bar"><i id="fcBar"></i></div></div>
<div class="flash" id="flash" tabindex="0" role="button" aria-label="Flip card"><div class="face front"></div><div class="face back"></div></div>
<div class="fc-actions" id="fcAct"><button class="btn primary" id="flip">Show answer <kbd>Space</kbd></button></div>
<p class="muted center">Keys: <kbd>Space</kbd> flip · <kbd>1</kbd> Again · <kbd>2</kbd> Hard · <kbd>3</kbd> Good · <kbd>4</kbd> Easy</p></section>`;
    const flash = $('#flash'), front = $('.front', flash), back = $('.back', flash);
    function show() {
      if (!queue.length) return finish();
      const c = queue[0]; flipped = false;
      flash.classList.remove('flipped');
      front.innerHTML = `<div class="deckname">${esc(SC.deckTitle(c.deck))}</div><div class="fctext">${md(c.q)}</div>`;
      back.innerHTML = `<div class="deckname">Answer</div><div class="fctext">${md(c.a)}</div>`;
      $('#fcCount').textContent = `${done} done · ${queue.length} left`;
      $('#fcBar').style.width = (100 * done / Math.max(1, done + queue.length)) + '%';
      $('#fcAct').innerHTML = '<button class="btn primary" id="flip">Show answer <kbd>Space</kbd></button>';
      $('#flip').onclick = flip;
    }
    function flip() {
      if (flipped) return; flipped = true; flash.classList.add('flipped');
      $('#fcAct').innerHTML = `<button class="btn again" data-r="again">Again <kbd>1</kbd></button><button class="btn hard" data-r="hard">Hard <kbd>2</kbd></button><button class="btn good" data-r="good">Good <kbd>3</kbd></button><button class="btn easy" data-r="easy">Easy <kbd>4</kbd></button>`;
      $$('[data-r]', $('#fcAct')).forEach((b) => { b.onclick = () => rate(b.dataset.r); });
    }
    function rate(r) {
      if (!flipped) return;
      const c = queue.shift(); stats[r]++;
      SC.store.update('cards', {}, (s) => {
        const cur = s[c.id] || { box: 0, due: 0 };
        if (r === 'again') cur.box = 0; else if (r === 'good') cur.box = Math.min(5, cur.box + 1); else if (r === 'easy') cur.box = Math.min(5, cur.box + 2); else cur.box = Math.max(1, cur.box);
        cur.due = r === 'again' ? 0 : Date.now() + (INTERVALS[cur.box] || 1) * DAY;
        s[c.id] = cur;
      });
      if (r === 'again') queue.splice(Math.min(queue.length, 3), 0, c); else done++;
      show();
    }
    function finish() {
      $('#fcBar').style.width = '100%';
      app.innerHTML = `<section class="page narrow"><div class="crumbs"><a href="#/cards">Flashcards</a> › ${esc(title)}</div><div class="card center"><h2>Session complete</h2><p>${total} cards: <b>${stats.easy}</b> easy · <b>${stats.good}</b> good · <b>${stats.hard}</b> hard · <b>${stats.again}</b> again (repeated).</p><p><a class="btn primary" href="#/cards/${deck}?mode=all">Review whole deck</a> <a class="btn" href="#/cards">Decks</a></p></div></section>`;
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      if (e.target.matches('input,textarea')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      else if (flipped && ['1', '2', '3', '4'].includes(e.key)) rate(['again', 'hard', 'good', 'easy'][+e.key - 1]);
    }
    flash.onclick = flip;
    document.addEventListener('keydown', onKey);
    SC.onLeave(() => document.removeEventListener('keydown', onKey));
    show();
  });

  /* ================================================================= MCQ trainer */
  SC.route('/quiz', (app) => quizHome(app, ''));
  SC.route('/quiz/:topic', (app, { topic }) => quizHome(app, topic));
  function quizHome(app, topic) {
    SC.pageTitle = 'MCQ practice';
    const st = SC.store.get('quiz', {});
    const topics = [...new Set(SC.mcq.map((q) => q.topic))];
    const pool = SC.mcq.filter((q) => !topic || q.topic === topic);
    const done = pool.filter((q) => st[q.id]).length, ok = pool.filter((q) => st[q.id] && st[q.id].ok).length;
    app.innerHTML = `<section class="page narrow"><h1>MCQ practice <small class="muted">(exam Question 1)</small></h1>
<p class="lead">Q1 of the exam is multiple choice on an OMR sheet. Practise topic by topic with instant explanations. <strong>${ok}/${done}</strong> correct of ${pool.length}.</p>
<div class="chips filter"><a class="chip ${!topic ? 'on' : ''}" href="#/quiz">All (${SC.mcq.length})</a>${topics.map((t) => `<a class="chip ${topic === t ? 'on' : ''}" href="#/quiz/${t}">${esc(SC.topicById[t].title)}</a>`).join('')}</div>
<div class="quiz-start card"><div class="qs-opts"><label><input type="radio" name="qm" value="new" checked> Unanswered first</label><label><input type="radio" name="qm" value="wrong"> Only ones I got wrong</label><label><input type="radio" name="qm" value="all"> Everything, shuffled</label></div>
<button class="btn primary" id="qgo">Start (${pool.length} questions)</button></div><div id="qarea"></div></section>`;
    $('#qgo').onclick = () => {
      const mode = $('input[name=qm]:checked').value;
      let qs = shuffle(pool);
      if (mode === 'new') qs = qs.filter((q) => !st[q.id]).concat(qs.filter((q) => st[q.id]));
      if (mode === 'wrong') qs = qs.filter((q) => st[q.id] && !st[q.id].ok);
      if (!qs.length) { SC.toast('Nothing to show in that mode', 'warn'); return; }
      runQuiz($('#qarea'), qs.slice(0, 20));
      $('.quiz-start').hidden = true;
    };
  }
  function runQuiz(host, qs) {
    let i = 0, correct = 0, answered = false;
    const L = 'ABCD';
    function show() {
      const q = qs[i]; answered = false;
      host.innerHTML = `<div class="card quizq"><div class="qmeta">Question ${i + 1} of ${qs.length} · ${esc(SC.topicById[q.topic].title)}</div><div class="qtext">${md(q.q)}</div>
<div class="opts">${q.opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="ol">${L[k]}</span><span>${mdInline(o)}</span></button>`).join('')}</div><div id="qfb"></div></div>`;
      $$('.opt', host).forEach((b) => { b.onclick = () => pick(+b.dataset.k); });
    }
    function pick(k) {
      if (answered) return; answered = true;
      const q = qs[i], ok = k === q.ans;
      if (ok) correct++;
      SC.store.update('quiz', {}, (s) => { s[q.id] = { ok, ts: Date.now() }; });
      $$('.opt', host).forEach((b) => { const kk = +b.dataset.k; b.disabled = true; if (kk === q.ans) b.classList.add('right'); else if (kk === k) b.classList.add('wrong'); });
      $('#qfb').innerHTML = `<div class="fb ${ok ? 'pass' : 'fail'}"><b>${ok ? 'Correct' : 'Not quite. The answer is ' + L[q.ans]}.</b> ${md(q.why)}</div><button class="btn primary" id="qnext">${i + 1 < qs.length ? 'Next' : 'Finish'} <kbd>Enter</kbd></button>`;
      $('#qnext').onclick = next; $('#qnext').focus();
    }
    function next() {
      i++;
      if (i >= qs.length) { document.removeEventListener('keydown', onKey); host.innerHTML = `<div class="card center"><h2>Done: ${correct}/${qs.length}</h2><p>${Math.round(100 * correct / qs.length)}%</p><a class="btn primary" href="#/quiz">Back to MCQ</a></div>`; return; }
      show();
    }
    function onKey(e) {
      if (!answered && 'abcd'.includes(e.key.toLowerCase()) && e.key.length === 1) { const k = L.indexOf(e.key.toUpperCase()); if (k >= 0 && k < 4) pick(k); }
      else if (answered && e.key === 'Enter') { e.preventDefault(); next(); }
    }
    document.addEventListener('keydown', onKey);
    SC.onLeave(() => document.removeEventListener('keydown', onKey));
    show();
  }

  /* ================================================================= drills */
  SC.route('/drills', (app) => {
    SC.pageTitle = 'Drills';
    const stats = SC.store.get('drillstats', {});
    app.innerHTML = `<section class="page"><h1>Drills</h1>
<p class="lead">Endless, freshly generated, exam-style questions. K-map answers are checked for logical equivalence (type any equivalent form) and for minimality; register-prediction answers come from the Verilog simulator.</p>
<div class="grid topics">${SC.drills.map((d) => { const s = stats[d.id] || { n: 0, ok: 0 }; return `<a class="card topic" href="#/drills/${d.id}"><div class="ticon">∞</div><div><h3>${esc(d.title)}</h3><p>${esc(d.desc)}</p><div class="chips"><span class="chip">${s.ok}/${s.n} correct</span></div></div></a>`; }).join('')}</div></section>`;
  });

  SC.route('/drills/:id', (app, { id }) => {
    const d = SC.drillById[id];
    if (!d) { app.innerHTML = '<div class="card"><h2>Unknown drill</h2></div>'; return; }
    SC.pageTitle = d.title;
    app.innerHTML = `<section class="page narrow"><div class="crumbs"><a href="#/drills">Drills</a> › ${esc(d.title)}</div><h1>${esc(d.title)}</h1><div id="dq"></div></section>`;
    let streak = 0;
    function newQ() {
      const q = d.gen(SC.rng((Math.random() * 4e9) >>> 0 || 7));
      let counted = false;
      $('#dq').innerHTML = `<div class="card dq">${q.html}<div class="fields">${q.fields.map((f) => `<label class="fld ${f.short ? 'short' : ''} ${f.wide ? 'wide' : ''}"><span>${esc(f.label)}</span>${f.type === 'select' ? `<select data-k="${f.key}">${f.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>` : `<input type="text" data-k="${f.key}" autocomplete="off" spellcheck="false">`}</label>`).join('')}</div>
<div class="dq-actions"><button class="btn primary" id="dcheck">Check <kbd>Enter</kbd></button><button class="btn ghost" id="dshow">Show solution</button><button class="btn" id="dnext">New question</button><span class="streak muted">streak ${streak}</span></div><div id="dfb"></div></div>`;
      const vals = () => Object.fromEntries($$('[data-k]', $('#dq')).map((el) => [el.dataset.k, el.value]));
      const check = () => {
        const r = q.check(vals());
        if (!counted) { counted = true; SC.store.update('drillstats', {}, (s) => { const x = s[id] || (s[id] = { n: 0, ok: 0 }); x.n++; if (r.ok) x.ok++; }); }
        streak = r.ok ? streak + 1 : 0;
        $('#dfb').innerHTML = `<div class="fb ${r.ok ? 'pass' : r.partial ? 'part' : 'fail'}">${r.ok ? '✔ ' : r.partial ? '◐ ' : '✘ '}${md(r.msg)}</div>`;
        $('.streak').textContent = 'streak ' + streak;
      };
      $('#dcheck').onclick = check;
      $('#dshow').onclick = () => { $('#dfb').innerHTML = `<div class="fb sol"><b>Solution</b><br>${md(q.solution)}</div>`; };
      $('#dnext').onclick = newQ;
      $$('input', $('#dq')).forEach((inp) => inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); }));
      const first = $('input', $('#dq')); if (first) first.focus();
    }
    newQ();
  });
})();
