/* Verilog coding problems. The judge compares your module against `ref` on exhaustive/random stimulus
 * (combinational) or on random clocked sequences with reset (sequential).
 * Fields: id, title, topic, level(1-3), source, statement(md), starter, ref, provided?, hints[], must?[RegExp src], forbid?[RegExp src], vectors? */
window.SC = window.SC || {};
SC.problems = [
/* -------------------------------------------------------- gates & boolean */
{
  id: 'nand-xor', title: 'XOR from four NAND gates', topic: 'boolean', level: 1, source: 'L2 / NAND-only designs',
  statement: `Build an XOR gate **using only \`nand\` gate primitives** (no \`assign\`, no other gate types). Four 2-input NANDs are enough.

\`y = a ⊕ b\``,
  starter: `module xor_nand (input a, b, output y);
  // declare internal wires, then instantiate nand gates (output first)

endmodule`,
  ref: `module xor_nand (input a, b, output y);
  wire n1, n2, n3;
  nand g1 (n1, a, b);
  nand g2 (n2, a, n1);
  nand g3 (n3, b, n1);
  nand g4 (y, n2, n3);
endmodule`,
  hints: ['Let n1 = NAND(a,b). Then a⊕b = NAND( NAND(a,n1), NAND(b,n1) ).', 'Gate primitive syntax: `nand g1 (out, in1, in2);`'],
  must: ['\\bnand\\b'], forbid: ['\\bassign\\b', '\\bxor\\b', '\\bxnor\\b', '\\band\\b', '\\bor\\b', '\\bnor\\b', '\\bnot\\b', 'always', '\\^'],
},
{
  id: 'alarm-system', title: 'Alarm system', topic: 'boolean', level: 1, source: 'Revision practice Q2',
  statement: `An alarm output is HIGH whenever

- the **panic** input is HIGH, **or**
- the **activate** input is HIGH while **exiting** is LOW **and** the house is **not secure**.

The house is secure when **window**, **door** and **garage** are all HIGH. Write the module with a single \`assign\`.`,
  starter: `module alarm (input panic, activate, exiting, window, door, garage, output alarm);

endmodule`,
  ref: `module alarm (input panic, activate, exiting, window, door, garage, output alarm);
  wire secure = window & door & garage;
  assign alarm = panic | (activate & ~exiting & ~secure);
endmodule`,
  hints: ['secure = window & door & garage', 'alarm = panic | (activate & ~exiting & ~secure)'],
},
/* -------------------------------------------------------------- arithmetic */
{
  id: 'half-adder', title: 'Half adder', topic: 'arithmetic', level: 1, source: 'L4',
  statement: `Write a half adder: \`s\` = sum, \`c\` = carry of the two 1-bit inputs.`,
  starter: `module half_adder (input a, b, output s, c);

endmodule`,
  ref: `module half_adder (input a, b, output s, c);
  assign s = a ^ b;
  assign c = a & b;
endmodule`,
  hints: ['s is XOR, c is AND.'],
},
{
  id: 'full-adder', title: 'Full adder', topic: 'arithmetic', level: 1, source: 'L4',
  statement: `Write a full adder with carry-in \`cin\` and carry-out \`cout\`. You may use \`assign\` with a concatenation: \`{cout, s} = a + b + cin\`.`,
  starter: `module full_adder (input a, b, cin, output s, cout);

endmodule`,
  ref: `module full_adder (input a, b, cin, output s, cout);
  assign {cout, s} = a + b + cin;
endmodule`,
  hints: ['s = a ^ b ^ cin;  cout = a&b | cin&(a^b)', 'Or: assign {cout, s} = a + b + cin; (1-bit operands are widened to the 2-bit target).'],
},
{
  id: 'ripple4', title: '4-bit ripple-carry adder', topic: 'arithmetic', level: 2, source: 'L4 / structural Verilog',
  statement: `Build a 4-bit ripple-carry adder by **instantiating four copies of the provided \`fa\` module** (it is already available, do not redefine it).

Bit \`i\` of \`s\` comes from stage \`i\`; the carry of stage \`i\` feeds stage \`i+1\`.`,
  provided: `module fa (input a, b, cin, output s, cout);
  assign s = a ^ b ^ cin;
  assign cout = (a & b) | (cin & (a ^ b));
endmodule`,
  starter: `module add4 (input [3:0] a, b, input cin, output [3:0] s, output cout);
  wire [3:1] c;      // internal carries
  // fa u0 (.a(a[0]), .b(b[0]), .cin(cin), .s(s[0]), .cout(c[1]));

endmodule`,
  ref: `module add4 (input [3:0] a, b, input cin, output [3:0] s, output cout);
  wire [3:1] c;
  fa u0 (.a(a[0]), .b(b[0]), .cin(cin), .s(s[0]), .cout(c[1]));
  fa u1 (.a(a[1]), .b(b[1]), .cin(c[1]), .s(s[1]), .cout(c[2]));
  fa u2 (.a(a[2]), .b(b[2]), .cin(c[2]), .s(s[2]), .cout(c[3]));
  fa u3 (.a(a[3]), .b(b[3]), .cin(c[3]), .s(s[3]), .cout(cout));
endmodule`,
  hints: ['Use named port connections: `fa u1 (.a(a[1]), .b(b[1]), .cin(c[1]), .s(s[1]), .cout(c[2]));`'],
  must: ['\\bfa\\b'],
},
{
  id: 'addsub4', title: '4-bit adder/subtractor with overflow', topic: 'arithmetic', level: 2, source: 'L6',
  statement: `Design \`addsub\`: when \`sub = 0\` compute \`a + b\`, when \`sub = 1\` compute \`a − b\` (= a + ~b + 1). Treat \`a\`, \`b\`, \`s\` as 4-bit **2's complement** numbers.

- \`s\`: the 4-bit result
- \`cout\`: the carry out of the most-significant adder stage (for subtraction it is the carry out of a + ~b + 1)
- \`ovf\`: signed overflow flag, 1 when the operands (after the XOR with \`sub\`) have the same sign and the result has a different sign.`,
  starter: `module addsub (input [3:0] a, b, input sub, output [3:0] s, output cout, output ovf);

endmodule`,
  ref: `module addsub (input [3:0] a, b, input sub, output [3:0] s, output cout, output ovf);
  wire [3:0] bb = b ^ {4{sub}};
  assign {cout, s} = a + bb + sub;
  assign ovf = (a[3] == bb[3]) & (s[3] != a[3]);
endmodule`,
  hints: ['bb = b ^ {4{sub}} inverts b when sub = 1. Then {cout,s} = a + bb + sub.', 'ovf = (a[3] == bb[3]) && (s[3] != a[3]).'],
},
{
  id: 'bcd-adder', title: 'BCD digit adder', topic: 'arithmetic', level: 3, source: 'Past paper CZ1005 2018/19 S2 Q2(b)',
  statement: `Add two BCD digits \`a\`, \`b\` and a carry-in \`cin\`. Let \`t = a + b + cin\` (5-bit result).

- If \`t > 9\`: \`cout = 1\` and \`sum = (t + 6)[3:0]\`
- otherwise: \`cout = 0\` and \`sum = t[3:0]\`

(The two-adder hardware version uses X = Cout + S3·S2 + S3·S1 as the "greater than 9" detector.)`,
  starter: `module bcd_add (input [3:0] a, b, input cin, output [3:0] sum, output cout);

endmodule`,
  ref: `module bcd_add (input [3:0] a, b, input cin, output [3:0] sum, output cout);
  wire [4:0] t = a + b + cin;
  assign cout = (t > 5'd9);
  assign sum = cout ? (t + 5'd6) : t[3:0];
endmodule`,
  hints: ['wire [4:0] t = a + b + cin;  cout = t > 9;', 'sum = cout ? t + 6 : t, then keep the lower 4 bits.'],
},
{
  id: 'mult2', title: '2×2 multiplier', topic: 'arithmetic', level: 1, source: 'Revision practice Q5',
  statement: `Multiply two 2-bit unsigned numbers \`x\` and \`y\` giving a 4-bit product \`z\`.`,
  starter: `module mult2 (input [1:0] x, y, output [3:0] z);

endmodule`,
  ref: `module mult2 (input [1:0] x, y, output [3:0] z);
  assign z = x * y;
endmodule`,
  hints: ['`assign z = x * y;` works, widths are extended to the 4-bit target.'],
},
/* --------------------------------------------------- combinational blocks */
{
  id: 'mux2-assign', title: '2-to-1 multiplexer (conditional operator)', topic: 'verilog-comb', level: 1, source: 'L16',
  statement: `Output \`y = b\` when \`sel = 1\`, otherwise \`y = a\`. Use the **conditional operator \`? :\`** in one \`assign\`.`,
  starter: `module mux2 (input a, b, sel, output y);

endmodule`,
  ref: `module mux2 (input a, b, sel, output y);
  assign y = sel ? b : a;
endmodule`,
  hints: ['assign y = sel ? b : a;'], must: ['\\?'],
},
{
  id: 'mux4-case', title: '4-to-1 multiplexer (case)', topic: 'comb-blocks', level: 1, source: 'L16 / Tutorial 6',
  statement: `\`d[s]\` is selected by the 2-bit \`s\`. Use an \`always @*\` block with a \`case\` statement (so \`y\` must be a \`reg\`).`,
  starter: `module mux4 (input [3:0] d, input [1:0] s, output reg y);

endmodule`,
  ref: `module mux4 (input [3:0] d, input [1:0] s, output reg y);
  always @* begin
    case (s)
      2'b00: y = d[0];
      2'b01: y = d[1];
      2'b10: y = d[2];
      default: y = d[3];
    endcase
  end
endmodule`,
  hints: ['always @* begin case (s) 2\'b00: y = d[0]; ... default: ... endcase end'], must: ['\\bcase\\b'],
},
{
  id: 'dec24-ferry', title: 'Ferry boarding system', topic: 'comb-blocks', level: 2, source: 'Tutorial 6 Q3',
  statement: `Cars are directed to one of four boarding ramps. A 2-bit input \`ramp\` selects the ramp and \`full\` is HIGH when all ramps are full. Four outputs \`green[3:0]\` drive the green lights, **one-hot** (only the selected light on); **no light** when \`full\`.

Instantiate the **provided \`dec2to4\` decoder** (already available):

\`module dec2to4 (input [1:0] i, input en, output [3:0] d);\``,
  provided: `module dec2to4 (input [1:0] i, input en, output reg [3:0] d);
  always @* begin
    d = 4'b0000;
    if (en) d[i] = 1'b1;
  end
endmodule`,
  starter: `module ferry (input [1:0] ramp, input full, output [3:0] green);

endmodule`,
  ref: `module ferry (input [1:0] ramp, input full, output [3:0] green);
  dec2to4 u1 (.i(ramp), .en(~full), .d(green));
endmodule`,
  hints: ['The decoder is enabled when the ramps are NOT full: .en(~full).'], must: ['\\bdec2to4\\b'],
},
{
  id: 'prienc42', title: '4-to-2 priority encoder', topic: 'comb-blocks', level: 2, source: 'L16 (casez / if-else)',
  statement: `\`r[3]\` has the highest priority. \`code\` is the index of the highest asserted request; \`valid\` = 1 if any request is asserted. If none, \`code = 0\` and \`valid = 0\`.

Use \`if / else if\` or \`casez\` in an \`always @*\` block.`,
  starter: `module prienc (input [3:0] r, output reg [1:0] code, output reg valid);

endmodule`,
  ref: `module prienc (input [3:0] r, output reg [1:0] code, output reg valid);
  always @* begin
    valid = 1'b1;
    if (r[3]) code = 2'd3;
    else if (r[2]) code = 2'd2;
    else if (r[1]) code = 2'd1;
    else if (r[0]) code = 2'd0;
    else begin code = 2'd0; valid = 1'b0; end
  end
endmodule`,
  hints: ['Check r[3] first, then r[2], r[1], r[0] (priority order).', 'Assign **both** outputs in every branch (or set defaults first) to avoid latches.'],
},
{
  id: 'comparator4', title: '4-bit magnitude comparator', topic: 'comb-blocks', level: 1, source: 'L14',
  statement: `Three outputs: \`gt\` = (a > b), \`eq\` = (a == b), \`lt\` = (a < b). Inputs are unsigned.`,
  starter: `module cmp4 (input [3:0] a, b, output gt, eq, lt);

endmodule`,
  ref: `module cmp4 (input [3:0] a, b, output gt, eq, lt);
  assign gt = (a > b);
  assign eq = (a == b);
  assign lt = (a < b);
endmodule`,
  hints: ['Relational operators return 1-bit results.'],
},
{
  id: 'seg7', title: 'BCD to 7-segment decoder', topic: 'comb-blocks', level: 2, source: 'Lab 3',
  statement: `Decode a BCD digit \`bcd[3:0]\` to the segments \`seg[6:0] = {a,b,c,d,e,f,g}\` (**active-high**, 1 = lit). Digits 0–9 as on a standard display (7 is \`a,b,c\` only; 6 and 9 have their tails); inputs 10–15 turn **all segments off**.

| digit | abcdefg | digit | abcdefg |
|---|---|---|---|
| 0 | 1111110 | 5 | 1011011 |
| 1 | 0110000 | 6 | 1011111 |
| 2 | 1101101 | 7 | 1110000 |
| 3 | 1111001 | 8 | 1111111 |
| 4 | 0110011 | 9 | 1111011 |`,
  starter: `module seg7 (input [3:0] bcd, output reg [6:0] seg);

endmodule`,
  ref: `module seg7 (input [3:0] bcd, output reg [6:0] seg);
  always @* begin
    case (bcd)
      4'd0: seg = 7'b1111110;
      4'd1: seg = 7'b0110000;
      4'd2: seg = 7'b1101101;
      4'd3: seg = 7'b1111001;
      4'd4: seg = 7'b0110011;
      4'd5: seg = 7'b1011011;
      4'd6: seg = 7'b1011111;
      4'd7: seg = 7'b1110000;
      4'd8: seg = 7'b1111111;
      4'd9: seg = 7'b1111011;
      default: seg = 7'b0000000;
    endcase
  end
endmodule`,
  hints: ['One case item per digit plus a `default`.'], must: ['\\bcase\\b'],
},
{
  id: 'parity', title: 'Even-parity generator', topic: 'verilog-comb', level: 1, source: 'L3 / reduction operators',
  statement: `Output \`p\` such that the 8 data bits plus \`p\` contain an **even** number of 1s. Use a reduction operator.`,
  starter: `module parity_gen (input [7:0] d, output p);

endmodule`,
  ref: `module parity_gen (input [7:0] d, output p);
  assign p = ^d;
endmodule`,
  hints: ['`^d` XORs all bits of d together: 1 when d has an odd number of ones.'],
},
{
  id: 'thermo', title: 'Digital thermostat', topic: 'verilog-comb', level: 2, source: 'Tutorial 7 Q2',
  statement: `Two unsigned inputs \`Tset\` (target) and \`Tact\` (actual), parameterised width **W** (default 8).

- \`Hon\` = 1 when the actual temperature is at least 4 below the target: \`Tset >= Tact + 4\`
- \`Con\` = 1 when the actual temperature is at least 4 above the target: \`Tact >= Tset + 4\`

Be careful: \`Tact + 4\` must not overflow W bits.`,
  starter: `module thermo #(parameter W = 8) (input [W-1:0] Tset, Tact, output Hon, Con);

endmodule`,
  ref: `module thermo #(parameter W = 8) (input [W-1:0] Tset, Tact, output Hon, Con);
  assign Hon = ({1'b0, Tset} >= ({1'b0, Tact} + 4));
  assign Con = ({1'b0, Tact} >= ({1'b0, Tset} + 4));
endmodule`,
  vectors: [{ Tset: 10, Tact: 6 }, { Tset: 10, Tact: 7 }, { Tset: 6, Tact: 10 }, { Tset: 7, Tact: 10 }, { Tset: 255, Tact: 251 }, { Tset: 251, Tact: 255 }, { Tset: 252, Tact: 255 }, { Tset: 3, Tact: 0 }, { Tset: 4, Tact: 0 }, { Tset: 0, Tact: 4 }, { Tset: 0, Tact: 3 }, { Tset: 255, Tact: 0 }],
  hints: ['Widen first: {1\'b0, Tact} + 4, so 255 + 4 does not wrap around to 3.'],
},
{
  id: 'max3', title: 'Max, min and difference of three numbers', topic: 'verilog-comb', level: 2, source: 'Tutorial 8 Q1',
  statement: `Three 8-bit unsigned inputs \`a, b, c\`. Output the largest (\`max\`), the smallest (\`min\`) and their difference (\`diff = max − min\`). Use \`if\` statements in an \`always @*\` block.`,
  starter: `module max3 (input [7:0] a, b, c, output reg [7:0] max, min, diff);

endmodule`,
  ref: `module max3 (input [7:0] a, b, c, output reg [7:0] max, min, diff);
  always @* begin
    max = a; min = a;
    if (b > max) max = b;
    if (c > max) max = c;
    if (b < min) min = b;
    if (c < min) min = c;
    diff = max - min;
  end
endmodule`,
  hints: ['Start with max = min = a, then compare with b and c.', 'Use blocking `=`; `diff` is computed after max/min inside the same block.'],
},
{
  id: 'bugfix-comb', title: 'Fix the buggy multiplexer', topic: 'verilog-comb', level: 2, source: 'Tutorial 7 Q3',
  statement: `The module below should output \`a\`, \`b\` or \`c\` according to \`sel\` (00, 01, 10) and **0** when \`sel = 11\`. It contains several mistakes that stop it from synthesising correctly. **Fix them** (the port list must stay the same).

Look for: the output type, the sensitivity list, the missing \`default\`, and the stray punctuation.`,
  starter: `module thingamajig (input [3:0] a, b, c,
                    input [1:0] sel,
                    output [5:0] result);
  always @ (a, b)
  begin
    case (sel)
      2'b00 : result = a;
      2'b01 : result = b;
      2'b10 : result = c;
    endcase
  end
endmodule;`,
  ref: `module thingamajig (input [3:0] a, b, c,
                    input [1:0] sel,
                    output reg [5:0] result);
  always @*
  begin
    case (sel)
      2'b00 : result = a;
      2'b01 : result = b;
      2'b10 : result = c;
      default: result = 6'd0;
    endcase
  end
endmodule`,
  hints: ['`result` is assigned in an always block so it must be `output reg`.', 'Use `always @*` so changes to c and sel also trigger the block.', 'Add `default: result = 0;` (otherwise a latch is inferred) and delete the `;` after `endmodule`.'],
},
{
  id: 'gray4', title: 'Binary to Gray code', topic: 'verilog-comb', level: 1, source: 'Self-study 2b',
  statement: `Convert a 4-bit binary number \`b\` to its Gray code \`g\` (g = b ⊕ (b >> 1)).`,
  starter: `module bin2gray (input [3:0] b, output [3:0] g);

endmodule`,
  ref: `module bin2gray (input [3:0] b, output [3:0] g);
  assign g = b ^ (b >> 1);
endmodule`,
  hints: ['g[3] = b[3]; g[i] = b[i+1] ^ b[i].'],
},
/* ----------------------------------------------------------------- sequential */
{
  id: 'dff-sync', title: 'D flip-flop, synchronous reset', topic: 'latches-ff', level: 1, source: 'L19',
  statement: `Positive-edge-triggered D flip-flop. When \`rst\` is 1 at a rising clock edge \`q\` becomes 0 (**synchronous** reset); otherwise \`q\` takes \`d\`.`,
  starter: `module dff (input clk, rst, d, output reg q);

endmodule`,
  ref: `module dff (input clk, rst, d, output reg q);
  always @(posedge clk) begin
    if (rst) q <= 1'b0;
    else     q <= d;
  end
endmodule`,
  hints: ['always @(posedge clk) with non-blocking assignments.'], must: ['posedge'],
},
{
  id: 'dff-async', title: 'D flip-flop, asynchronous reset', topic: 'latches-ff', level: 1, source: 'L19',
  statement: `As before, but \`rst\` is **asynchronous**: as soon as \`rst\` goes HIGH, \`q\` becomes 0 without waiting for a clock edge.`,
  starter: `module dff_ar (input clk, rst, d, output reg q);

endmodule`,
  ref: `module dff_ar (input clk, rst, d, output reg q);
  always @(posedge clk or posedge rst) begin
    if (rst) q <= 1'b0;
    else     q <= d;
  end
endmodule`,
  hints: ['Put the reset in the sensitivity list: @(posedge clk or posedge rst).'],
},
{
  id: 'reg-en', title: '8-bit register with enable', topic: 'seq-verilog', level: 1, source: 'L19',
  statement: `8-bit register: synchronous reset to 0; otherwise, if \`en = 1\`, load \`d\`; if \`en = 0\` hold the value.`,
  starter: `module reg8 (input clk, rst, en, input [7:0] d, output reg [7:0] q);

endmodule`,
  ref: `module reg8 (input clk, rst, en, input [7:0] d, output reg [7:0] q);
  always @(posedge clk) begin
    if (rst) q <= 8'd0;
    else if (en) q <= d;
  end
endmodule`,
  hints: ['No `else` for the hold case is needed: a flip-flop keeps its value if not assigned (this is fine in a *clocked* block).'],
},
{
  id: 'cnt3', title: '3-bit up counter', topic: 'seq-verilog', level: 1, source: 'L19',
  statement: `3-bit binary counter, counts up on each rising edge (000, 001, … 111, 000 …). Synchronous reset to 0.`,
  starter: `module counter3 (input clk, rst, output reg [2:0] q);

endmodule`,
  ref: `module counter3 (input clk, rst, output reg [2:0] q);
  always @(posedge clk) begin
    if (rst) q <= 3'd0;
    else     q <= q + 3'd1;
  end
endmodule`,
  hints: ['q <= q + 1; wraps around automatically after 7.'],
},
{
  id: 'cnt20', title: 'Counter that counts 0 … 20', topic: 'seq-verilog', level: 2, source: 'Tutorial 9 Q3(a)',
  statement: `5-bit counter that counts up to 20 and then wraps to 0 (…19, 20, 0, 1…). Synchronous reset to 0.`,
  starter: `module cnt20 (input clk, rst, output reg [4:0] q);

endmodule`,
  ref: `module cnt20 (input clk, rst, output reg [4:0] q);
  always @(posedge clk) begin
    if (rst) q <= 5'd0;
    else if (q == 5'd20) q <= 5'd0;
    else q <= q + 5'd1;
  end
endmodule`,
  hints: ['Check q == 20 *before* incrementing.'],
},
{
  id: 'cnt-max', title: 'Counter with programmable maximum', topic: 'seq-verilog', level: 2, source: 'Tutorial 9 Q3(b)',
  statement: `As the previous problem, but the wrap value comes from the 5-bit input \`countmax\`: when \`q == countmax\` the next value is 0, otherwise \`q + 1\`. Synchronous reset to 0.`,
  starter: `module cntmax (input clk, rst, input [4:0] countmax, output reg [4:0] q);

endmodule`,
  ref: `module cntmax (input clk, rst, input [4:0] countmax, output reg [4:0] q);
  always @(posedge clk) begin
    if (rst) q <= 5'd0;
    else if (q == countmax) q <= 5'd0;
    else q <= q + 5'd1;
  end
endmodule`,
  hints: ['Replace the constant 20 by countmax.'],
},
{
  id: 'cnt-down', title: 'Down counter loaded on reset', topic: 'seq-verilog', level: 2, source: 'Tutorial 9 Q3(c)',
  statement: `6-bit down counter. On reset (synchronous, \`rst = 1\`) load \`start_val\`. Otherwise decrement by 1 every clock (wrapping from 0 to 63).`,
  starter: `module downcnt (input clk, rst, input [5:0] start_val, output reg [5:0] q);

endmodule`,
  ref: `module downcnt (input clk, rst, input [5:0] start_val, output reg [5:0] q);
  always @(posedge clk) begin
    if (rst) q <= start_val;
    else     q <= q - 6'd1;
  end
endmodule`,
  hints: ['The reset branch loads start_val instead of 0.'],
},
{
  id: 'shift4', title: '4-bit serial-in shift register', topic: 'seq-verilog', level: 2, source: 'L19 / Tutorial 8',
  statement: `On each rising clock edge shift \`q\` left by one and insert \`din\` at the LSB: \`q <= {q[2:0], din}\`. Synchronous reset clears \`q\`.`,
  starter: `module shift4 (input clk, rst, din, output reg [3:0] q);

endmodule`,
  ref: `module shift4 (input clk, rst, din, output reg [3:0] q);
  always @(posedge clk) begin
    if (rst) q <= 4'd0;
    else     q <= {q[2:0], din};
  end
endmodule`,
  hints: ['Concatenation: {q[2:0], din} drops q[3] and appends din.'],
},
{
  id: 'johnson', title: 'Johnson (twisted ring) counter', topic: 'seq-verilog', level: 2, source: 'L19 style',
  statement: `4-bit Johnson counter: each edge shifts left and feeds the **inverted** MSB back into the LSB: \`q <= {q[2:0], ~q[3]}\`. Synchronous reset to 0000. (Sequence: 0000, 0001, 0011, 0111, 1111, 1110, …)`,
  starter: `module johnson (input clk, rst, output reg [3:0] q);

endmodule`,
  ref: `module johnson (input clk, rst, output reg [3:0] q);
  always @(posedge clk) begin
    if (rst) q <= 4'b0000;
    else     q <= {q[2:0], ~q[3]};
  end
endmodule`,
  hints: ['Same as a shift register, but the serial input is ~q[3].'],
},
{
  id: 'monitor-alarm', title: 'Event-count monitor', topic: 'seq-verilog', level: 3, source: 'Tutorial 9 Q2',
  statement: `A counter counts the clock cycles in which \`evnt\` is HIGH. When the count **exceeds** the 6-bit \`thresh\` the circuit asserts \`alarm\` and the counter **stops**. \`rst\` (synchronous) clears the counter.

*Hint from the tutorial: \`alarm\` is combinational, derived from the count and the threshold; it also decides whether the counter counts.*`,
  starter: `module monitor (input clk, rst, evnt, input [5:0] thresh, output alarm);

endmodule`,
  ref: `module monitor (input clk, rst, evnt, input [5:0] thresh, output alarm);
  reg [5:0] count;
  assign alarm = (count > thresh);
  always @(posedge clk) begin
    if (rst) count <= 6'd0;
    else if (evnt && !alarm) count <= count + 6'd1;
  end
endmodule`,
  hints: ['Declare `reg [5:0] count;` inside the module (it is not a port).', '`assign alarm = (count > thresh);` then count only if `evnt && !alarm`.'],
},
{
  id: 'dec24-case', title: '2-to-4 decoder (case)', topic: 'comb-blocks', level: 1, source: 'Past paper CE1005 2018/19 S1 Q3(b)',
  statement: `Write a 2-to-4 decoder using a **\`case\`** statement. Input \`in[1:0]\`, output \`out[3:0]\` (one-hot: \`out[i] = 1\` when \`in = i\`).`,
  starter: `module dec2to4 (input [1:0] in, output reg [3:0] out);

endmodule`,
  ref: `module dec2to4 (input [1:0] in, output reg [3:0] out);
  always @* begin
    case (in)
      2'd0: out = 4'b0001;
      2'd1: out = 4'b0010;
      2'd2: out = 4'b0100;
      default: out = 4'b1000;
    endcase
  end
endmodule`,
  hints: ['One case item per input value; the last can be `default`.'], must: ['\\bcase\\b'],
},
{
  id: 'updown', title: 'Up/down counter with parameter width', topic: 'seq-verilog', level: 2, source: 'Past paper CE1005 2018/19 S1 Q4(a)',
  statement: `Counter whose width is set by \`parameter W\` (default 8). When \`up = 1\` it counts up, when \`up = 0\` it counts down, on each rising clock edge. Synchronous reset to 0.`,
  starter: `module updown #(parameter W = 8) (input clk, rst, up, output reg [W-1:0] q);

endmodule`,
  ref: `module updown #(parameter W = 8) (input clk, rst, up, output reg [W-1:0] q);
  always @(posedge clk) begin
    if (rst) q <= 0;
    else if (up) q <= q + 1;
    else q <= q - 1;
  end
endmodule`,
  hints: ['Use `parameter W = 8` in the header: `#(parameter W = 8)`.'],
},
/* ----------------------------------------------------------------------- FSM */
{
  id: 'fsm-seq', title: 'Consecutive-ones detector (Moore FSM)', topic: 'fsm', level: 3, source: 'Tutorial 10 Q1',
  statement: `Single input \`in\`, single output \`out\`. The output goes to 1 from the **second consecutive 1** and stays 1 until **two consecutive 0s** have been received.

Implement it as a **Moore** machine with these four states (reset state S0):

| state | meaning | out |
|---|---|---|
| S0 | idle | 0 |
| S1 | one 1 seen | 0 |
| S2 | two+ consecutive 1s (output on) | 1 |
| S3 | output on, one 0 seen | 1 |

Transitions: S0 –1→ S1, S0 –0→ S0, S1 –1→ S2, S1 –0→ S0, S2 –1→ S2, S2 –0→ S3, S3 –1→ S2, S3 –0→ S0. Synchronous reset to S0.`,
  starter: `module seq11 (input clk, rst, in, output out);
  localparam S0 = 2'd0, S1 = 2'd1, S2 = 2'd2, S3 = 2'd3;
  reg [1:0] state, next;

  // 1. state register

  // 2. next-state logic

  // 3. output logic

endmodule`,
  ref: `module seq11 (input clk, rst, in, output out);
  localparam S0 = 2'd0, S1 = 2'd1, S2 = 2'd2, S3 = 2'd3;
  reg [1:0] state, next;
  always @(posedge clk)
    if (rst) state <= S0;
    else     state <= next;
  always @* begin
    next = state;
    case (state)
      S0: next = in ? S1 : S0;
      S1: next = in ? S2 : S0;
      S2: next = in ? S2 : S3;
      S3: next = in ? S2 : S0;
      default: next = S0;
    endcase
  end
  assign out = (state == S2) || (state == S3);
endmodule`,
  hints: ['Three blocks: `always @(posedge clk)` for the state register, `always @*` for next-state (start with `next = state;`), and an `assign` for the Moore output.'],
  biasHigh: true,
},
{
  id: 'moore-1011', title: '"1011" sequence detector (Mealy, overlapping)', topic: 'fsm', level: 3, source: 'FSM design practice',
  statement: `Detect the serial pattern **1 0 1 1** (overlapping patterns allowed: 1011011 contains two). Use a **Mealy** machine: \`out\` is HIGH during the cycle in which the **last** bit of the pattern is present on \`in\` (state = "saw 101" **and** \`in = 1\`), so \`out\` depends on both the state and the input.

States: S0 (nothing), S1 (saw 1), S2 (saw 10), S3 (saw 101). Synchronous reset to S0.

| state | in=0 | in=1 |
|---|---|---|
| S0 | S0 | S1 |
| S1 | S2 | S1 |
| S2 | S0 | S3 |
| S3 | S2 | S1 (overlap: …1011 ends in 1) |`,
  starter: `module det1011 (input clk, rst, in, output out);

endmodule`,
  ref: `module det1011 (input clk, rst, in, output out);
  localparam S0 = 2'd0, S1 = 2'd1, S2 = 2'd2, S3 = 2'd3;
  reg [1:0] state, next;
  always @(posedge clk)
    if (rst) state <= S0;
    else     state <= next;
  always @* begin
    next = S0;
    case (state)
      S0: next = in ? S1 : S0;
      S1: next = in ? S1 : S2;
      S2: next = in ? S3 : S0;
      S3: next = in ? S1 : S2;
    endcase
  end
  assign out = (state == S3) & in;
endmodule`,
  hints: ['Mealy output: `assign out = (state == S3) & in;`', 'From S3 with in=1 the last 1 can start a new pattern, so go to S1.'],
  biasHigh: true,
},
{
  id: 'traffic', title: 'Traffic-light controller', topic: 'fsm', level: 2, source: 'Lab / FSM practice',
  statement: `Moore FSM with outputs \`light = {red, yellow, green}\`.

- **RED** (\`3'b100\`): stays RED until the input \`car\` is 1, then goes to GREEN.
- **GREEN** (\`3'b001\`): lasts exactly one clock cycle then goes to YELLOW.
- **YELLOW** (\`3'b010\`): lasts exactly one clock cycle then goes to RED.

Synchronous reset to RED.`,
  starter: `module traffic (input clk, rst, car, output reg [2:0] light);

endmodule`,
  ref: `module traffic (input clk, rst, car, output reg [2:0] light);
  localparam RED = 2'd0, GREEN = 2'd1, YELLOW = 2'd2;
  reg [1:0] state, next;
  always @(posedge clk)
    if (rst) state <= RED;
    else     state <= next;
  always @* begin
    next = state;
    case (state)
      RED:    if (car) next = GREEN;
      GREEN:  next = YELLOW;
      YELLOW: next = RED;
      default: next = RED;
    endcase
  end
  always @* begin
    case (state)
      RED:    light = 3'b100;
      GREEN:  light = 3'b001;
      YELLOW: light = 3'b010;
      default: light = 3'b100;
    endcase
  end
endmodule`,
  hints: ['Keep a separate 2-bit `state` register and decode the `light` outputs from it.'],
  biasHigh: true,
},
];
SC.problemById = Object.fromEntries(SC.problems.map((p) => [p.id, p]));
