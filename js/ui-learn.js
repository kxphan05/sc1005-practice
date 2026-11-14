/* Learn: topic list and topic pages. */
(function () {
  'use strict';
  const SC = window.SC;
  const { esc } = SC;

  function topicProgress(t) {
    const solved = SC.store.get('solved', {});
    const total = t.problems.length;
    const done = t.problems.filter((p) => solved[p]).length;
    return { total, done };
  }

  SC.route('/learn', (app) => {
    SC.pageTitle = 'Learn';
    app.innerHTML = `<section class="page">
<h1>Learn</h1>
<p class="lead">Topics follow the lecture order. Read the notes, then work the coding problems, flashcards and MCQs for that topic.</p>
<div class="grid topics">${SC.topics.map((t, i) => {
    const p = topicProgress(t);
    const cards = SC.cards.filter((c) => c.deck === t.id).length;
    const mcq = SC.mcq.filter((q) => q.topic === t.id).length;
    return `<a class="card topic" href="#/learn/${t.id}">
      <div class="ticon">${esc(t.icon)}</div>
      <div><div class="tnum">${i + 1}. ${esc(t.lec)}</div><h3>${esc(t.title)}</h3><p>${esc(t.blurb)}</p>
      <div class="chips"><span class="chip">${p.total ? `${p.done}/${p.total} problems` : 'notes'}</span><span class="chip">${cards} cards</span>${mcq ? `<span class="chip">${mcq} MCQ</span>` : ''}</div></div></a>`;
  }).join('')}</div></section>`;
  });

  SC.route('/learn/:id', (app, { id }) => {
    const t = SC.topicById[id];
    if (!t) { app.innerHTML = '<div class="card"><h2>Unknown topic</h2><a href="#/learn">Back</a></div>'; return; }
    SC.pageTitle = t.title;
    const idx = SC.topics.indexOf(t);
    const prev = SC.topics[idx - 1], next = SC.topics[idx + 1];
    const solved = SC.store.get('solved', {});
    const deck = SC.cards.filter((c) => c.deck === t.id).length;
    const mcq = SC.mcq.filter((q) => q.topic === t.id).length;
    app.innerHTML = `<section class="page article">
<div class="crumbs"><a href="#/learn">Learn</a> › ${esc(t.lec)}</div>
<h1>${esc(t.title)}</h1>
<div class="prose">${md(t.notes)}</div>
<div class="card practice-box"><h2>Practise this topic</h2>
<div class="pb-grid">
  <div><h3>Verilog / coding problems</h3>${t.problems.length ? '<ul class="plist">' + t.problems.map((pid) => { const p = SC.problemById[pid]; return `<li><a href="#/practice/${pid}">${solved[pid] ? '<span class="ok">✓</span> ' : ''}${esc(p.title)}</a> <span class="lv l${p.level}">${'●'.repeat(p.level)}</span></li>`; }).join('') + '</ul>' : '<p class="muted">Concept topic: use the drills and MCQs.</p>'}</div>
  <div><h3>Flashcards</h3><p>${deck} cards</p><a class="btn" href="#/cards/${t.id}">Study this deck</a></div>
  <div><h3>MCQ</h3>${mcq ? `<p>${mcq} questions</p><a class="btn" href="#/quiz/${t.id}">Practise MCQs</a>` : '<p class="muted">None for this topic.</p>'}</div>
  <div><h3>Drills</h3><p>Unlimited generated questions.</p><a class="btn" href="#/drills">Open drills</a></div>
</div></div>
<div class="pager">${prev ? `<a href="#/learn/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/learn/${next.id}">${esc(next.title)} →</a>` : '<span></span>'}</div>
</section>`;
    // copy buttons for code blocks + "try in playground"
    SC.$$('pre.code', app).forEach((pre) => {
      if (pre.dataset.lang !== 'verilog') return;
      const b = document.createElement('button'); b.className = 'mini try'; b.textContent = 'Try in Playground';
      b.onclick = () => { SC.store.set('pg:code', pre.textContent); SC.go('/playground'); };
      pre.appendChild(b);
    });
  });
})();
