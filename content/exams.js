/* Mock exams. Format mirrors the AY26-27 Sem 1 paper: 1 h 30 min, 2 questions.
 *   Q1: multiple choice, answered on an OMR-style bubble sheet
 *   Q2: structured written question; model answers are revealed on marking.
 * Item types: drill | text | num | select | expr | table | problem | html
 */
window.SC = window.SC || {};
(function () {
  /* ---------- helpers ---------- */
  function fsmFigure(spec) {
    const pos = { '00': [110, 105], '01': [330, 105], '11': [330, 235], '10': [110, 235] };
    const states = Object.keys(spec.next).map((s) => ({ id: s, label: s, x: pos[s][0], y: pos[s][1], sub: spec.moore ? `X=${spec.out[s]}` : '' }));
    const edges = [];
    for (const s of Object.keys(spec.next)) {
      const [n0, n1] = spec.next[s];
      const o = (b) => (spec.moore ? '' : `/X=${spec.out[s][b]}`);
      if (n0 === n1) edges.push({ from: s, to: n0, label: spec.moore ? 'B, B′' : `B,B′${o(0)}` });
      else { edges.push({ from: s, to: n0, label: `B′${o(0)}` }); edges.push({ from: s, to: n1, label: `B${o(1)}` }); }
    }
    // loops go outward from the box
    const dirs = { '00': 'top', '01': 'top', '11': 'bottom', '10': 'bottom' };
    edges.forEach((e) => { if (e.from === e.to) e.curve = dirs[e.from]; });
    return SC.fsmSVG(states, edges, { w: 440, h: 330 });
  }
  function fsmItems(spec, marks) {
    const rows = [];
    for (const s of Object.keys(spec.next).sort()) for (const b of [0, 1]) {
      const n = spec.next[s][b];
      rows.push([s[0], s[1], String(b), n[0], n[1], String(spec.moore ? spec.out[s] : spec.out[s][b])]);
    }
    const table = { type: 'table', marks: marks[0], prompt: 'Complete the **state transition table** (fill in n1, n0 and X).', headers: ['s1', 's0', 'B', 'n1', 'n0', 'X'], given: [0, 1, 2], rows };
    const vars = ['s1', 's0', 'B'];
    const mt = (k) => rows.map((r, i) => (r[k] === '1' ? i : -1)).filter((i) => i >= 0);
    return [
      { type: 'html', html: `<div class="figure">${fsmFigure(spec)}<div class="cap">Figure: state transition diagram (input B, output X). State = s1 s0.</div></div>` },
      table,
      { type: 'expr', marks: marks[1], prompt: 'Write the **minimal sum-of-products** expression for **n1** in terms of s1, s0, B.', vars, minterms: mt(3), minimal: true },
      { type: 'expr', marks: marks[2], prompt: 'Write the minimal sum-of-products expression for **X**.', vars, minterms: mt(5), minimal: true },
    ];
  }
  const CMOS_NOTE = '<p class="muted">nMOS conducts when its gate is 1; pMOS conducts when its gate is 0.</p>';
  function cmosItems(fig, zFn, marksTable, extra) {
    const rows = [];
    for (let m = 0; m < 8; m++) { const A = (m >> 2) & 1, B = (m >> 1) & 1, C = m & 1; rows.push([String(A), String(B), String(C), zFn(A, B, C) ? '1' : '0']); }
    const zeros = rows.map((r, i) => (r[3] === '0' ? i : -1)).filter((i) => i >= 0);
    return [
      { type: 'html', html: `<div class="figure"><pre class="fig">${fig}</pre><div class="cap">Figure: a CMOS logic circuit.</div></div>${CMOS_NOTE}` },
      { type: 'table', marks: marksTable, prompt: 'For each input combination state the output **Z** (0 or 1).', headers: ['A', 'B', 'C', 'Z'], given: [0, 1, 2], rows },
      { type: 'num', marks: 2, prompt: 'Hence write Z as a **canonical product of maxterms**: list the maxterm numbers separated by commas, e.g. `1,2,6`.', answer: zeros.join(','), numeric: 'list', explain: `Z = 0 on rows ${zeros.join(', ')}, so Z = ΠM(${zeros.join(', ')}).` },
      ...(extra || []),
    ];
  }
  const CMOS1 = `            VDD
             |
         ||--+ Q1 (pMOS, gate A)
             |
        +----+----+
   Q2 (pMOS,B)  Q3 (pMOS,C)     (parallel)
        +----+----+
             |
             +---------- Z
             |
        +----+----+
   Q4 (nMOS,A)  Q5 (nMOS,B)
        |         |
        |      Q6 (nMOS,C)      (Q5, Q6 in series)
        +----+----+
             |
            GND`;
  const CMOS2 = `            VDD
             |
        +----+----+
   Q1 (pMOS,A)  Q2 (pMOS,B)
        |         |
        |      Q3 (pMOS,C)      (Q2, Q3 in series)
        +----+----+
             |
             +---------- Z
             |
        Q4 (nMOS, A)
             |
        +----+----+
   Q5 (nMOS,B)  Q6 (nMOS,C)     (parallel)
        +----+----+
             |
            GND`;
  const CMOS3 = `            VDD
             |
         Q1 (pMOS, gate C)
             |
        +----+----+
   Q2 (pMOS,A)  Q3 (pMOS,B)     (parallel)
        +----+----+
             |
             +---------- Z
             |
        +----+----+
   Q4 (nMOS,C)  Q5 (nMOS,A)
        |         |
        |      Q6 (nMOS,B)      (Q5, Q6 in series)
        +----+----+
             |
            GND`;

  /* ---------- the exams ---------- */
  SC.exams = [
  {
    id: 'mock1', title: 'Mock Exam 1', sub: 'Balanced paper — modelled on CZ1005 2018/19 Sem 2',
    q1: { pick: 0 },
    q2: [
      { title: 'Number systems & codes', items: [
        { type: 'drill', drill: 'base', seed: 101, opts: { kind: 4 }, marks: 4 },
        { type: 'text', marks: 4, prompt: 'Write out a 3-bit **Gray code** sequence. Briefly describe its merit over a straight binary code in repeating an 8-step process in the correct order.',
          model: 'Sequence: 000, 001, 011, 010, 110, 111, 101, 100 (and back to 000).\nOnly **one bit changes** between consecutive codes, including the wrap-around from 100 to 000. In straight binary several bits change at once (e.g. 011→100), so a read taken during the transition (or tiny timing differences between the bits) can produce a wildly wrong value; with Gray code the error is at most one step.',
          rubric: ['1 mark: correct 3-bit Gray sequence (8 distinct codes, one-bit changes)', '1 mark: the sequence closes cyclically (100 → 000)', '2 marks: merit — single bit changes, so no spurious intermediate codes / glitches'] },
      ] },
      { title: 'Digital arithmetic', items: [
        { type: 'drill', drill: 'twos', seed: 201, marks: 4 },
        { type: 'drill', drill: 'twos', seed: 202, marks: 4 },
        { type: 'expr', marks: 3, prompt: 'A 4-bit adder adds two BCD digits and produces the sum bits S3 S2 S1 S0 and carry-out C. Write the Boolean expression for **X**, which is 1 only when the result **exceeds 9**. (Use the variable names C, S3, S2, S1.)', vars: ['C', 'S3', 'S2', 'S1'], fn: (e) => e.C || (e.S3 && (e.S2 || e.S1)), minimal: true, explain: 'X = C + S3·S2 + S3·S1. Sums 10…15 have S3 = 1 and (S2 or S1) = 1; sums ≥ 16 set C.' },
      ] },
      { title: 'Boolean algebra & K-maps', items: [
        { type: 'expr', marks: 5, prompt: 'Simplify algebraically (show your working on paper) and enter the **minimal sum-of-products** result: F(a,b,c,d,e) = [(c′ + be)(a′e + b′c)]′ · [(cd′)′ + e′]. Use ′ or \' for NOT, e.g. `e\' + ac\'`.', vars: ['a', 'b', 'c', 'd', 'e'], fn: (v) => { const x = !((!v.c || (v.b && v.e)) && ((!v.a && v.e) || (!v.b && v.c))); const y = !(v.c && !v.d) || !v.e; return x && y; }, minimal: true, explain: 'De Morgan on each bracket, expand and absorb: F = e′ + ac′ + ad + b′cd.' },
        { type: 'num', marks: 2, prompt: 'What is the **minimum number of 2-input NOR gates** needed to implement F = (x + y′)(w′ + z)?', answer: '5', explain: 'F = ((x+y′)′ + (w′+z)′)′: two NOR inverters (for y′, w′) + NOR(x,y′) + NOR(w′,z) + a final NOR = 5.' },
        { type: 'drill', drill: 'kmap', seed: 301, opts: { form: 'pos' }, marks: 5 },
      ] },
      { title: 'CMOS & electrical characteristics', items: cmosItems(CMOS1, (A, B, C) => !(A || (B && C)), 4, [
        { type: 'num', marks: 2, prompt: 'A 5 V LSTTL gate has V<sub>OH(min)</sub> = 2.7 V, V<sub>OL(max)</sub> = 0.5 V, V<sub>IH(min)</sub> = 2.0 V, V<sub>IL(max)</sub> = 0.8 V. What is its **low-state** DC noise margin in volts?', answer: '0.3', numeric: 'num', explain: 'Low-state NM = V<sub>IL(max)</sub> − V<sub>OL(max)</sub> = 0.8 − 0.5 = 0.3 V. (High-state NM = 2.7 − 2.0 = 0.7 V.) [src:6 p46-48]' },
      ]) },
      { title: 'Verilog: analyse', items: [
        { type: 'drill', drill: 'predict', seed: 401, marks: 8 },
        { type: 'select', marks: 2, prompt: 'In the module above, what does each of the three assignments become in hardware?', options: ['A D flip-flop with some gates at its D input', 'A latch', 'A tri-state buffer', 'A combinational gate only'], answer: 0, explain: 'Each assignment in a clocked always block creates a register (D flip-flop).' },
      ] },
      { title: 'Verilog: design', items: [
        { type: 'problem', id: 'cnt-max', marks: 6 },
      ] },
      { title: 'Finite state machine', items: fsmItems({ moore: true, next: { '00': ['00', '10'], '01': ['11', '00'], '11': ['00', '11'], '10': ['01', '10'] }, out: { '00': 0, '01': 0, '11': 1, '10': 0 } }, [4, 2, 1]) },
    ],
  },
  {
    id: 'mock2', title: 'Mock Exam 2', sub: 'Heavier on Verilog & sequential circuits',
    q1: { pick: 1 },
    q2: [
      { title: 'Number systems & codes', items: [
        { type: 'drill', drill: 'codes', seed: 111, opts: { kind: 0 }, marks: 3 },
        { type: 'drill', drill: 'codes', seed: 112, opts: { kind: 2 }, marks: 3 },
        { type: 'drill', drill: 'base', seed: 113, opts: { kind: 1 }, marks: 2 },
      ] },
      { title: 'Digital arithmetic', items: [
        { type: 'drill', drill: 'twos', seed: 211, marks: 4 },
        { type: 'drill', drill: 'bcdadd', seed: 212, marks: 4 },
        { type: 'text', marks: 4, prompt: 'Explain how a **single 4-bit adder** can be made to either add or subtract two 4-bit 2’s complement numbers A and B, controlled by a signal SUB. State how **overflow** is detected.',
          model: 'XOR each bit of B with SUB (B_i ⊕ SUB) and connect SUB to the carry-in C0 of the adder (Fig 6-12). When SUB = 0 the adder computes A + B; when SUB = 1 it computes A + B′ + 1 = A − B. [src:4 p45-48]\nOverflow (the slides’ rule): the two numbers actually added have the same sign but the sum has the opposite sign; adding numbers of opposite sign never overflows. [src:4 p43] In hardware this is V = C3 ⊕ C4 (carry into the MSB stage XOR carry out of it), which is not on the slides.',
          rubric: ['1 mark: XOR gates on B controlled by SUB', '1 mark: SUB drives carry-in', '1 mark: explains A − B = A + B′ + 1', '1 mark: overflow = same-sign operands, opposite-sign result (or carry-in to MSB XOR carry-out of MSB)'] },
      ] },
      { title: 'Boolean algebra & K-maps', items: [
        { type: 'drill', drill: 'kmap', seed: 311, opts: { form: 'sop' }, marks: 5 },
        { type: 'expr', marks: 4, prompt: 'A logic circuit has inputs A, B, C, D (A is the MSB). Output Y = 1 when the 4-bit number ABCD is **a multiple of 3** (0, 3, 6, 9, 12, 15). Enter the minimal SOP.', vars: ['A', 'B', 'C', 'D'], minterms: [0, 3, 6, 9, 12, 15], minimal: true, explain: 'Σm(0,3,6,9,12,15): no two minterms are adjacent in the K-map, so there are no groups and all six are essential: Y = A′B′C′D′ + A′B′CD + A′BCD′ + AB′C′D + ABC′D′ + ABCD (24 literals).' },
        { type: 'select', marks: 2, prompt: 'The signal WR* is **active low**. Which statement is true?', options: ['The write is performed when WR* = 0', 'The write is performed when WR* = 1', 'WR* is always at 0', 'WR* is the complement of the clock'], answer: 0, explain: 'Active-low: asserted at logic 0.' },
      ] },
      { title: 'CMOS & electrical characteristics', items: cmosItems(CMOS2, (A, B, C) => !(A && (B || C)), 4, [
        { type: 'num', marks: 2, prompt: 'Gate A has I<sub>OH</sub> = 400 µA and I<sub>OL</sub> = 4 mA. Each load input needs I<sub>IH</sub> = 20 µA and I<sub>IL</sub> = 0.4 mA. What is the DC fan-out?', answer: '10', explain: 'min{400/20, 4/0.4} = min{20, 10} = 10.' },
      ]) },
      { title: 'Verilog: analyse', items: [
        { type: 'drill', drill: 'predict', seed: 411, marks: 8 },
        { type: 'text', marks: 4, prompt: 'The module below is intended to be combinational but has **two problems** that cause incorrect synthesis. Identify them and write the corrected module.\n```verilog\nmodule m (input a, b, c, input [1:0] sel, output y);\n  always @(a, b)\n    case (sel)\n      2\'b00: y = a;\n      2\'b01: y = b;\n      2\'b10: y = c;\n    endcase\nendmodule\n```',
          model: '1. `y` is assigned in an always block so it must be declared `output reg y`.\n2. The sensitivity list is incomplete (c and sel are missing): use `always @*`.\n3. (Also) the `case` has no `default` — a latch is inferred when sel = 2\'b11. Add `default: y = 1\'b0;`.\n```verilog\nmodule m (input a, b, c, input [1:0] sel, output reg y);\n  always @*\n    case (sel)\n      2\'b00: y = a;\n      2\'b01: y = b;\n      2\'b10: y = c;\n      default: y = 1\'b0;\n    endcase\nendmodule\n```',
          rubric: ['1 mark: y must be reg', '1 mark: sensitivity list incomplete → @*', '1 mark: missing default → latch', '1 mark: corrected code'] },
      ] },
      { title: 'Verilog: design', items: [
        { type: 'problem', id: 'dec24-ferry', marks: 4 },
        { type: 'problem', id: 'cnt-down', marks: 4 },
      ] },
      { title: 'Finite state machine', items: fsmItems({ moore: false, next: { '00': ['00', '01'], '01': ['00', '11'], '11': ['10', '11'], '10': ['00', '01'] }, out: { '00': [0, 0], '01': [0, 1], '11': [0, 1], '10': [1, 0] } }, [4, 2, 1]) },
    ],
  },
  {
    id: 'mock3', title: 'Mock Exam 3', sub: 'FSM-heavy, with a design question',
    q1: { pick: 2 },
    q2: [
      { title: 'Number systems & codes', items: [
        { type: 'drill', drill: 'base', seed: 121, opts: { kind: 4 }, marks: 4 },
        { type: 'drill', drill: 'codes', seed: 122, opts: { kind: 1 }, marks: 2 },
        { type: 'text', marks: 3, prompt: 'What is a **parity bit**? Explain how an even-parity bit is generated for an 8-bit data word and what the receiver does. State **one limitation**.',
          model: 'A parity bit is an extra bit attached to the code group so that the total number of 1s is even (even parity) or odd (odd parity) before transmitting; sender and receiver must agree which. It is generated by XORing all data bits (p = d7⊕d6⊕…⊕d0). The receiver XORs all received bits including p; a result of 1 signals an error. Limitation: it detects only a single-bit error. A 2-bit error leaves the parity unchanged, so the receiver wrongly concludes there is no error, and parity cannot locate or correct the bad bit. [src:2b p26-30]',
          rubric: ['1 mark: definition', '1 mark: XOR generation/check', '1 mark: limitation (single-bit errors only; 2-bit error undetected; no correction)'] },
      ] },
      { title: 'Digital arithmetic', items: [
        { type: 'drill', drill: 'twos', seed: 221, marks: 4 },
        { type: 'drill', drill: 'twos', seed: 222, marks: 4 },
        { type: 'text', marks: 4, prompt: 'Draw (describe) a circuit that adds two BCD digits using **two 4-bit binary adders** and some gates. Explain the role of the signal X = C + S3·S2 + S3·S1.',
          model: 'Adder 1 adds a[3:0] + b[3:0] + Cin giving S[3:0] and C. X = C + S3·S2 + S3·S1 = 1 when the binary sum exceeds 9. Adder 2 adds S[3:0] to the constant 0 X X 0 (6 when X = 1, 0 when X = 0) with carry-in 0; its sum is the BCD digit. The BCD carry-out is X.',
          rubric: ['1 mark: first adder adds the digits and Cin', '1 mark: X detects sum > 9 (explained)', '1 mark: second adder adds 0XX0 = 6 when X = 1', '1 mark: BCD carry-out = X; output taken from adder 2'] },
      ] },
      { title: 'Boolean algebra & K-maps', items: [
        { type: 'drill', drill: 'kmap', seed: 321, opts: { form: 'sop' }, marks: 5 },
        { type: 'drill', drill: 'kmap', seed: 322, opts: { form: 'pos' }, marks: 5 },
        { type: 'expr', marks: 2, prompt: 'Simplify: A′B + AB + A′B′C. (minimal SOP over A, B, C)', vars: ['A', 'B', 'C'], fn: (e) => (!e.A && e.B) || (e.A && e.B) || (!e.A && !e.B && e.C), minimal: true, explain: 'A′B + AB = B; B + A′B′C = B + A′C.' },
      ] },
      { title: 'CMOS & electrical characteristics', items: cmosItems(CMOS3, (A, B, C) => !((A && B) || C), 4, [
        { type: 'select', marks: 2, prompt: 'Several open-drain outputs are connected to one line with a single pull-up resistor. The line is low when…', options: ['any one of the outputs pulls low (wired-AND)', 'all outputs pull low', 'an odd number of outputs pull low', 'exactly one output pulls low'], answer: 0, explain: 'Wired-AND: the line is high only if every output is open.' },
      ]) },
      { title: 'Sequential circuits', items: [
        { type: 'drill', drill: 'predict', seed: 421, marks: 6 },
        { type: 'text', marks: 4, prompt: 'State **two differences** between a D latch and a positive-edge-triggered D flip-flop. Which would you use as the storage element of a synchronous counter, and why?',
          model: 'Latch: level-sensitive, transparent while enable = 1 (output follows D and can change several times during the enable pulse). Flip-flop: edge-triggered, samples D only at the rising clock edge, so Q changes once per clock. A flip-flop is used in synchronous counters because the next-state logic feeds back from Q to D; with a transparent latch the new value would race around the loop while the clock is high (unstable), whereas an edge-triggered flip-flop changes state once per clock.',
          rubric: ['1 mark: latch is level-sensitive / transparent', '1 mark: FF is edge-triggered', '1 mark: choose flip-flop', '1 mark: reason — avoids race-around / one change per clock'] },
      ] },
      { title: 'Verilog: design', items: [
        { type: 'problem', id: 'fsm-seq', marks: 10 },
      ] },
      { title: 'Finite state machine', items: [
        { type: 'drill', drill: 'fsm-trace', seed: 521, marks: 4 },
      ] },
    ],
  },
  ];
  // Q1 picks: deterministic spread across the bank (every 5th question)
  SC.exams.forEach((e) => {
    e.q1.ids = SC.mcq.filter((_, i) => i % 5 === e.q1.pick).map((q) => q.id).slice(0, 20);
    e.q1.marksEach = 2;
  });
  SC.examById = Object.fromEntries(SC.exams.map((e) => [e.id, e]));
})();
