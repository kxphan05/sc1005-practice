/* Ground-truth sources. Every claim on the site should trace back to one of these course PDFs.
 * Notes, cards and MCQs cite them inline as [src:KEY pN] (PDF page N), [src:KEY pN-M] or [src:KEY Q3]
 * (several separated by ';'). md.js turns each into a link that opens the PDF at that page.
 * Page numbers are PDF page numbers (what the viewer's page box shows), not the number printed on the slide.
 */
window.SC = window.SC || {};
SC.sources = {
  /* self-study + first half (A/P Chan): L1-L12 */
  '1':   { short: 'Self-study 1', name: '1_Introduction', lec: 'Week 1 self-study', path: 'files/intro-number-systems-codes/1_Introduction.pdf' },
  '2a':  { short: 'Self-study 2a', name: '2a_Number Systems', lec: 'Week 1 self-study', path: 'files/intro-number-systems-codes/2a_Number_Systems.pdf' },
  '2b':  { short: 'Self-study 2b', name: '2b_Codes', lec: 'Week 1 self-study', path: 'files/intro-number-systems-codes/2b_Codes.pdf' },
  '3':   { short: 'Slides 3', name: '3_Boolean (logic gates & Boolean algebra)', lec: 'L1–L3', path: 'files/lecture-notes-weeks-1-6/3_Boolean(3).pdf' },
  '4':   { short: 'Slides 4', name: '4_Digital Arithmetic', lec: 'L4–L6', path: 'files/lecture-notes-weeks-1-6/4_Digital_Arithmetic(2).pdf' },
  '5':   { short: 'Slides 5', name: '5_Combinational (canonical forms, K-maps)', lec: 'L7–L8', path: 'files/lecture-notes-weeks-1-6/5_Combinational(2).pdf' },
  '6':   { short: 'Slides 6', name: '6_Digital circuits (TTL/CMOS, electrical)', lec: 'L9–L11', path: 'files/lecture-notes-weeks-1-6/6_Digital_circuits(2).pdf' },
  '7':   { short: 'Slides 7', name: '7_ST_PLA_FP (Schmitt trigger, PLA, fixed/floating point)', lec: 'L12', path: 'files/lecture-notes-weeks-1-6/7_ST_PLA_FP(1).pdf' },
  'key': { short: 'Key concepts', name: 'Key concepts (week 1-6)', lec: 'L1–L12', path: 'files/lecture-notes-weeks-1-6/key_concepts_(week_1_-_6)(2).pdf' },
  /* second half (A/P Anupam): L13-L23 */
  '07':  { short: 'Lec 07', name: '07 Combinational Circuits', lec: 'L13', path: 'files/lecture-notes-weeks-7-13/07_NTU-SCE-CX1005_-_Combinational_Circuits.pdf' },
  '08A': { short: 'Lec 08A', name: '08A Introduction to Verilog', lec: 'L14–L15', path: 'files/lecture-notes-weeks-7-13/08A-NTU-SCE-CX1005_-_Introduction_to_Verilog.pdf' },
  '08B': { short: 'Lec 08B', name: '08B Verilog for Combinational Circuits', lec: 'L16', path: 'files/lecture-notes-weeks-7-13/08B_NTU-SCE-CX1005_-_Verilog_for_Combinational_Circuits.pdf' },
  '09':  { short: 'Lec 09', name: '09 Sequential Circuits', lec: 'L17–L18', path: 'files/lecture-notes-weeks-7-13/09_NTU-SCE-CX1005_-_Sequential_Circuits.pdf' },
  '10':  { short: 'Lec 10', name: '10 Sequential Circuits in Verilog', lec: 'L19–L20', path: 'files/lecture-notes-weeks-7-13/10_NTU-SCE-CX1005_-_Sequential_Circuits_in_Verilog.pdf' },
  '11':  { short: 'Lec 11', name: '11 Finite State Machines', lec: 'L21', path: 'files/lecture-notes-weeks-7-13/11_NTU-SCE-CX1005_-_FSM.pdf' },
  '12':  { short: 'Lec 12', name: '12 FSM in Verilog', lec: 'L22', path: 'files/lecture-notes-weeks-7-13/12_NTU-SCE-CX1005_-_FSM_in_Verilog.pdf' },
  '13':  { short: 'Lec 13', name: '13 Verilog Recap', lec: 'L23', path: 'files/lecture-notes-weeks-7-13/13_CX1005_Verilog_Recap_L23.pdf' },
  /* tutorials, revision, past papers, admin */
  'tut1':  { short: 'Tut 1', name: 'Tutorial 1 (number systems)', path: 'files/tutorials/First_half_tutorial_(week_2_-_6)_Tut_1_questions.pdf' },
  'tut2':  { short: 'Tut 2', name: 'Tutorial 2 (gates, Boolean algebra)', path: 'files/tutorials/First_half_tutorial_(week_2_-_6)_Tut_2_questions.pdf' },
  'tut3':  { short: 'Tut 3', name: 'Tutorial 3 (arithmetic)', path: 'files/tutorials/First_half_tutorial_(week_2_-_6)_Tut_3_questions.pdf' },
  'tut4':  { short: 'Tut 4', name: 'Tutorial 4 (combinational, K-maps)', path: 'files/tutorials/First_half_tutorial_(week_2_-_6)_Tut_4_questions.pdf' },
  'tut5':  { short: 'Tut 5', name: 'Tutorial 5 (bubbles, CMOS)', path: 'files/tutorials/First_half_tutorial_(week_2_-_6)_Tut_5_questions.pdf' },
  'tut6':  { short: 'Tut 6', name: 'Tutorial 6 (mux, decoder, structural Verilog)', path: 'files/tutorials/Second_Half_Tutorials_(Week_8_-_13)_SC1005_tut6.pdf' },
  'tut7':  { short: 'Tut 7', name: 'Tutorial 7 (combinational Verilog)', path: 'files/tutorials/Second_Half_Tutorials_(Week_8_-_13)_SC1005_tut7.pdf' },
  'tut8':  { short: 'Tut 8', name: 'Tutorial 8 (latches, flip-flops, FIFO)', path: 'files/tutorials/Second_Half_Tutorials_(Week_8_-_13)_SC1005_tut8.pdf' },
  'tut9':  { short: 'Tut 9', name: 'Tutorial 9 (sequential Verilog)', path: 'files/tutorials/Second_Half_Tutorials_(Week_8_-_13)_SC1005_tut9.pdf' },
  'tut10': { short: 'Tut 10', name: 'Tutorial 10 (FSM)', path: 'files/tutorials/Second_Half_Tutorials_(Week_8_-_13)_SC1005_tut10.pdf' },
  'rev':   { short: 'Revision Qs', name: 'Revision practice questions', path: 'files/revision-questions-answers/revision_practice_questions.pdf' },
  'revA':  { short: 'Revision ans', name: 'Revision practice answers', path: 'files/revision-questions-answers/Revision_practice_answers_revision_practice_answers.pdf' },
  'pp1819s1': { short: 'Paper 18/19 S1', name: 'Past paper CE1005 2018/19 Semester 1', path: 'files/past-exam-papers/CE1005_2018-2019_Semester_1.pdf' },
  'pp1819s2': { short: 'Paper 18/19 S2', name: 'Past paper CE1005/CZ1005 2018/19 Semester 2', path: 'files/past-exam-papers/CZ1005_2018-2019_Semester_2.pdf' },
  'sched': { short: 'Schedule', name: 'SC1005 course schedule AY26/27 S1', path: 'files/course-info/START_HERE_SC1005_course_schedule_AY2627_S1.pdf' },
};

/* Lecture number -> slide deck, from the course schedule and the weekly lecture-summary PDFs. */
SC.lectureMap = [
  ['Week 1 self-study', 'Introduction; number systems; codes', ['1', '2a', '2b']],
  ['L1–L3', 'Gates, Boolean theorems, NAND/NOR, alternate symbols, XOR, parity', ['3']],
  ['L4–L6', 'Adders, signed numbers, overflow, add/subtract circuit, multiplication, BCD addition', ['4']],
  ['L7–L8', 'Minterms/maxterms, SOP/POS, active levels, K-maps, don’t cares, enable', ['5']],
  ['L9–L11', 'TTL vs CMOS, active levels, bubble matching, CMOS analysis, electrical parameters, tri-state, open drain', ['6']],
  ['L12', 'Schmitt trigger, PLA, fixed and floating point', ['7']],
  ['L13', 'Combinational circuits: 7-segment decoder, decoder, multiplexer, timing diagrams', ['07']],
  ['L14–L15', 'Introduction to Verilog: modules, primitives, instantiation, assign, vectors, literals, parameters', ['08A']],
  ['L16', 'Verilog for combinational circuits: always @*, reg, if/case, avoiding latches', ['08B']],
  ['L17–L18', 'Sequential circuits: SR/D latches, timing, clock, flip-flops, registers', ['09']],
  ['L19–L20', 'Sequential circuits in Verilog: registers, reset, counters, shift registers, FIFOs', ['10']],
  ['L21', 'Finite state machines: diagrams, tables, Moore/Mealy', ['11']],
  ['L22', 'FSMs in Verilog: encoding, next-state equations, three-block structure', ['12']],
  ['L23', 'Verilog recap', ['13']],
];
