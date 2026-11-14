/* Home, exam prep, files. */
(function () {
  'use strict';
  const SC = window.SC;
  const { esc, $ } = SC;

  SC.route('/', (app) => {
    SC.pageTitle = '';
    const p = SC.progress();
    const solved = SC.store.get('solved', {});
    const nextP = SC.problems.find((x) => !solved[x.id]);
    const st = SC.store.get('cards', {}); const now = Date.now();
    const due = SC.cards.filter((c) => !st[c.id] || st[c.id].due <= now).length;
    const bar = (a, b) => `<div class="bar"><i style="width:${b ? 100 * a / b : 0}%"></i></div>`;
    app.innerHTML = `<section class="page">
<div class="hero"><div><h1>SC1005 Digital Logic<br><span>exam practice</span></h1>
<p class="lead">Notes, a Verilog editor with a built-in simulator, spaced-repetition flashcards, generated drills and full-length mock exams in the final-exam format.</p>
<div class="row"><a class="btn primary big" href="#/exams">Take a mock exam</a><a class="btn big" href="#/playground">Open Verilog playground</a></div></div>
<div class="card examfacts"><h3>Final exam format</h3><ul><li><b>24 Nov 2026</b> (course schedule), 1 hour 30 minutes</li><li><b>Closed book</b></li><li><b>2 questions</b>, unequal marks</li><li><b>Q1</b>: answers shaded on the OMR sheet</li><li><b>Q2</b>: written on the question paper (only these answers are assessed)</li></ul><a href="#/prep">Exam strategy →</a></div></div>
<div class="grid quick">
<a class="card qk" href="#/cards"><h3><span class="qi">🃏</span>Flashcards</h3><p>${due} due today</p>${bar(p.cardsKnown, p.cardsTotal)}<small>${p.cardsKnown}/${p.cardsTotal} well known</small></a>
<a class="card qk" href="#/practice${nextP ? '/' + nextP.id : ''}"><h3><span class="qi">⌨️</span>Verilog problems</h3><p>${nextP ? 'Next: ' + esc(nextP.title) : 'All solved'}</p>${bar(p.solved, p.problems)}<small>${p.solved}/${p.problems} solved</small></a>
<a class="card qk" href="#/quiz"><h3><span class="qi">✅</span>MCQ (Question 1)</h3><p>${p.mcq} questions with explanations</p>${bar(p.mcqOk, p.mcq)}<small>${p.mcqOk} answered correctly</small></a>
<a class="card qk" href="#/drills"><h3><span class="qi">🎯</span>Drills</h3><p>Base conversion · 2’s complement · K-maps · register traces</p><small>Endless generated questions</small></a>
</div>
<h2>Topics</h2>
<div class="grid topics compact">${SC.topics.map((t, i) => `<a class="card topic" href="#/learn/${t.id}"><div class="ticon">${esc(t.icon)}</div><div><div class="tnum">${esc(t.lec)}</div><h3>${esc(t.title)}</h3></div></a>`).join('')}</div>
</section>`;
  });

  SC.route('/prep', (app) => {
    SC.pageTitle = 'Exam prep';
    app.innerHTML = `<section class="page article"><h1>Exam prep</h1><div class="prose">${md(`
## The paper
- **Tuesday 24 Nov 2026** (per the course schedule [src:sched]), 1 h 30 min, **closed book**, in person, 2 questions, *unequal marks*. Check the official exam timetable for time and venue.
- **Question 1**: multiple choice; shade answers on the **OMR sheet** (hand in separately).
- **Question 2**: structured written answers **on the question paper**; only answers in the answer spaces are assessed. Do not attach extra papers.
- Write your matric and seat numbers on both the paper and the OMR sheet.

> [!exam] The six past papers in Files (2016–2019) are in an older format (2 h, 4 questions, no OMR) but Question 2 will look very much like them. The mock exams on this site use that style for Q2 and the lecture-slide style (“What is the next state?”) for Q1.

## What past Q2 parts look like
From the 2018/19 papers:

| Topic | Typical part |
|---|---|
| Number systems | decimal with fraction → hex with *n* significant digits; bits for a fixed-point value; Gray code merit; sign-magnitude vs 2’s complement values |
| Boolean algebra | simplify algebraically to SOP, **show each step**; NAND-only / NOR-only circuit |
| Arithmetic | 8-bit signed hex add/sub **and overflow?**; multiply via 2’s complement additions; BCD adder with two 4-bit adders and the “>9” detector |
| K-maps | min SOP/POS from Σm with don’t-cares; two settings (v = 0/1); 5 variables; design with a 4:1 mux + inverter |
| Active-low logic | draw a circuit for an active-low output; give the POS |
| Electrical | table of two devices: can A drive B? DC fan-out and noise margin; Schmitt trigger waveform clean-up; CMOS circuit analysis → canonical maxterms |
| Timing | draw waveforms for active-low/high control signals; complete flip-flop timing |
| Verilog read | draw the circuit for a clocked module; **complete the timing diagram** of A, B, C |
| Verilog write | single \`assign\` for a function; 2→4 decoder with \`case\`; up/down counter with \`parameter\`; FSM with async active-low reset and separate next-state/output \`always\` blocks |
| FSM | state table from a diagram, minimal next-state equations, circuit with D flip-flops; Moore diagram for a vending machine |

## Time plan (90 min)
- **Q1 (MCQ)**: ~25–30 min. Don’t spend more than 1.5 minutes per question; mark and return. Shade the OMR carefully as you go. Check the paper’s instructions on whether wrong answers are penalised; if they are not, never leave a blank.
- **Q2**: ~55 min. Start with the parts you are surest of; show working for every step (method marks).
- Last 5 min: check the OMR sheet against the paper, and that you wrote your numbers.

## Must memorise (closed book, no formula sheet)
1. Gate tables, De Morgan, absorption, consensus, A + A′B = A + B
2. Hex/binary conversion, 2’s complement negation and range, overflow rule
3. Full-adder equations; BCD correction (+6) and X = C + S3S2 + S3S1
4. Minterm/maxterm numbering; K-map grouping rules; POS from zeros
5. CMOS NAND/NOR structure, pMOS/nMOS conduction; noise-margin and fan-out formulas
6. SR/D latch vs flip-flop behaviour; JK table; setup/hold
7. Verilog templates: combinational \`always @*\`; clocked \`always @(posedge clk)\` with \`<=\`; 3-block FSM
8. Verilog pitfalls: wire/reg, latch inference, sensitivity list, blocking vs non-blocking

## How to use this site in the last week
1. **Learn** notes, one topic a day; try each Verilog snippet in the Playground.
2. **Flashcards** daily (spaced repetition keeps the due count low).
3. **Drills**: 10 K-maps, 10 2’s complement, 5 register traces.
4. **Coding problems**: all of them, ideally without hints.
5. **Mock exams**: one timed, then review every miss. Redo the Verilog read/write parts on paper.
`)}</div></section>`;
  });

  SC.route('/files-disabled', (app) => {
    SC.pageTitle = 'Files';
    const files = SC.files;
    const chips = (keys) => mdInline(keys.map((k) => `[src:${k}]`).join(' '));
    app.innerHTML = `<section class="page"><h1>Course files</h1>
<p class="lead">${files.reduce((a, c) => a + c.items.length, 0)} documents from the course folder, for quick reference. PDFs open in a new tab.</p>
<div class="card"><h2 style="margin-top:0">Which slides cover which lecture</h2>
<p class="muted">These PDFs are the ground truth for everything on this site. Notes, flashcards and MCQ explanations cite them with <span class="src">📄 chips</span> that open the PDF at the cited page. Mapping taken from the course schedule and the weekly lecture-summary PDFs.</p>
<div class="tw"><table class="lecmap"><thead><tr><th>Lecture</th><th>Content</th><th>Slides</th></tr></thead><tbody>${SC.lectureMap.map(([l, what, keys]) => `<tr><td>${esc(l)}</td><td>${esc(what)}</td><td>${chips(keys)}</td></tr>`).join('')}</tbody></table></div></div>
<input type="search" id="fs" class="search" placeholder="Filter files…" aria-label="Filter files">
<div id="flist">${files.map((c) => `<div class="fcat"><h2>${esc(c.cat)} <small class="muted">${c.items.length}</small></h2><ul class="files">${c.items.map((f) => `<li data-n="${esc((f.name + ' ' + c.cat).toLowerCase())}"><a href="${esc(f.path).replace(/ /g, '%20')}" target="_blank" rel="noopener"><span class="ext ${f.ext}">${f.ext}</span> ${esc(f.name)}</a> <span class="muted">${f.kb >= 1024 ? (f.kb / 1024).toFixed(1) + ' MB' : f.kb + ' KB'}</span></li>`).join('')}</ul></div>`).join('')}</div></section>`;
    $('#fs').oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      SC.$$('#flist li').forEach((li) => { li.hidden = q && !li.dataset.n.includes(q); });
      SC.$$('.fcat').forEach((c) => { c.hidden = !SC.$$('li', c).some((li) => !li.hidden); });
    };
  });
})();
