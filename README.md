# SC1005 Digital Logic practice site

Static site (no build step). Open it through any web server:

    cd site && python3 -m http.server 8765      # then visit http://localhost:8765

Pages: Learn (notes), Code (34 Verilog problems with auto-judge), Playground (Verilog editor + simulator),
Flashcards (165 cards, spaced repetition), MCQ (113 questions), Drills (generated), Mock exams (3 papers,
90 min, Q1 OMR + Q2 written), Exam prep. (The course PDFs and the Files page are left out of this public copy.)

## Layout
- `js/vparse.js`, `js/vsim.js`, `js/vtools.js`: Verilog parser, event-driven simulator, judge (2-state; no X/Z, functions, generate)
- `js/circuits.js`: circuit figures for the notes (interactive SR/D latches, master–slave and JK/T flip-flops, shift register,
  full adder, mux, CMOS NAND/NOR; static timing and block diagrams). Put `<div class="cfig" data-fig="NAME"></div>`
  on its own line in a topic's notes; names are the keys of `FIG` in that file. Captions cite the slides like the notes do.
- `js/boolean.js`: expression parser, equivalence check, Quine-McCluskey, K-map HTML
- `content/`: notes, cards, MCQs, problems, exams (edit these to add material)
- `content/sources.js`: the ground-truth PDFs (source keys) and the lecture-number → slide-deck map
- `files/` + `js/filelist.js`: course PDFs and their manifest
- Progress is stored in the browser (localStorage).

## Sources (ground truth)
Every claim should trace back to a course PDF. In any markdown (notes, cards, MCQ explanations, exam
explanations, a problem's `pdf` field) write `[src:KEY pN]`, `[src:KEY pN-M]` or `[src:KEY Q3]`, with several
separated by `;`. `KEY` is a key from `content/sources.js` (`09`, `4`, `tut8`, `revA`, `pp1819s2`, …) and `N` is the
**PDF page number** (not the number printed on the slide). It renders as a chip that opens the PDF at that page.
Material that is not in the course PDFs goes in a `> [!extra]` box ("Beyond the slides"); where the slides say
something non-standard, quote them in a `> [!slides]` box.

Card and MCQ ids are positional, and the mock exams pick MCQs by index, so **append new cards/questions at the end**.

If the site is served without `files/`, the chips render as plain labels instead of dead links.

## Note on the PDFs
`files/` contains NTU course materials and past papers (marked with a copyright notice).
Fine for your own use; do not publish the site publicly (e.g. GitHub Pages) with that folder included.
