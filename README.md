# SC1005 Digital Logic practice site

Static site (no build step). Open it through any web server:

    cd site && python3 -m http.server 8765      # then visit http://localhost:8765

Pages: Learn (notes), Code (34 Verilog problems with auto-judge), Playground (Verilog editor + simulator),
Flashcards (146 cards, spaced repetition), MCQ (101 questions), Drills (generated), Mock exams (3 papers,
90 min, Q1 OMR + Q2 written), Exam prep, 

## Layout
- `js/vparse.js`, `js/vsim.js`, `js/vtools.js`: Verilog parser, event-driven simulator, judge (2-state; no X/Z, functions, generate)
- `js/boolean.js`: expression parser, equivalence check, Quine-McCluskey, K-map HTML
- `content/`: notes, cards, MCQs, problems, exams (edit these to add material)
- Progress is stored in the browser (localStorage).

