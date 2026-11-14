/* Q1-style multiple-choice bank. Each row: [topic, question(md), [correct, wrong, wrong, wrong], explanation(md)].
 * The correct option is written first and shuffled deterministically at load time. */
window.SC = window.SC || {};
(function () {
const R = [
/* ---- number systems & codes ---- */
['number-systems', 'The hexadecimal number 2F is equal to which binary number?', ['0010 1111', '0010 1110', '0011 1111', '1111 0010'], '2 = 0010, F = 1111.'],
['number-systems', 'The decimal number 45 in binary is:', ['101101', '101011', '110101', '100111'], '45 = 32 + 8 + 4 + 1 = 101101.'],
['number-systems', 'What is the BCD representation of decimal 47?', ['0100 0111', '0010 1111', '0100 1011', '0011 1000'], 'Each digit is coded separately: 4 = 0100, 7 = 0111. (0010 1111 is 47 in binary.)'],
['number-systems', 'The minimum number of bits needed to represent 100 different values is:', ['7', '6', '8', '10'], '2⁶ = 64 < 100 ≤ 128 = 2⁷, so ⌈log₂ 100⌉ = 7.'],
['number-systems', 'The 4-bit Gray code of binary 1011 is:', ['1110', '1010', '1111', '0110'], 'g = b ⊕ (b >> 1) = 1011 ⊕ 0101 = 1110.'],
['number-systems', 'In a 4-bit Gray code sequence 0000, 0001, 0011, 0010, 0110, … the next code after 0110 is:', ['0111', '0100', '1110', '0101'], 'Exactly one bit changes each step: 0110 → 0111. (The sequence continues 0111, 0101, 0100.)'],
['number-systems', 'The ASCII code of the letter ‘C’ is (‘A’ = 0x41):', ['0x43', '0x42', '0x44', '0x63'], 'A = 0x41, B = 0x42, C = 0x43. (0x63 is lowercase ‘c’.)'],
['number-systems', 'An even-parity bit is appended to the 7-bit data 1011001. The parity bit is:', ['0', '1', 'Either, parity cannot be defined', 'Depends on the clock'], 'The data contains four 1s (already even), so the parity bit is 0.'],
['number-systems', 'The octal number 725 equals which decimal number?', ['469', '457', '485', '1829'], '7·64 + 2·8 + 5 = 448 + 16 + 5 = 469.'],
['number-systems', 'The decimal fraction 0.625 in binary is:', ['0.101', '0.110', '0.011', '0.1001'], '0.625 = 1/2 + 1/8 = 0.101₂.'],
['number-systems', 'The main advantage of Gray code over straight binary for an 8-position encoder is that:', ['only one bit changes between adjacent positions', 'it uses fewer bits', 'arithmetic is simpler', 'it detects errors by parity'], 'Single-bit change per step avoids large intermediate errors when several bits change at slightly different times.'],
/* ---- boolean ---- */
['boolean', 'By De Morgan’s theorem, (A′ + B)′ equals:', ['AB′', 'A′B′', 'A′B', 'A + B′'], '(A′ + B)′ = (A′)′ · B′ = A B′.'],
['boolean', 'AB + AB′ simplifies to:', ['A', 'B', 'A + B', '1'], 'A(B + B′) = A·1 = A.'],
['boolean', 'A′B + AB′ + AB simplifies to:', ['A + B', 'AB', 'A ⊕ B', '1'], 'A′B + AB′ + AB = A′B + A(B′ + B) = A′B + A = A + B.'],
['boolean', 'A 2-input NAND gate with both inputs connected together behaves as:', ['an inverter', 'a buffer', 'an AND gate', 'an OR gate'], '(AA)′ = A′.'],
['boolean', 'The output of a 3-input XOR gate with inputs 1, 1, 1 is:', ['1', '0', 'undefined', 'high impedance'], 'An odd number (three) of 1s gives 1.'],
['boolean', 'What is the minimum number of 2-input NOR gates needed to build a 2-input AND gate?', ['3', '2', '4', '1'], 'A·B = (A′ + B′)′: two NOR gates make A′, B′, and a third NOR combines them.'],
['boolean', 'An XOR gate can be built from NAND gates only using:', ['4 two-input NAND gates', '2 two-input NAND gates', '3 two-input NAND gates and an inverter', '6 two-input NAND gates'], 'n1 = (AB)′; out = ((A·n1)′ · (B·n1)′)′ — 4 gates.'],
['boolean', 'F = A(A′ + B) simplifies to:', ['AB', 'A + B', 'A′B', 'A'], 'A·A′ + AB = 0 + AB = AB.'],
['boolean', 'Which expression is the dual of A + BC = (A + B)(A + C)?', ['A(B + C) = AB + AC', 'A + BC = AB + AC', 'A′ + B′C′ = (A′ + B′)(A′ + C′)', 'A(BC) = (AB)C'], 'Swap AND↔OR (and 0↔1) in the whole statement.'],
['boolean', 'A clock signal at 100 MHz has a period of:', ['10 ns', '100 ns', '1 ns', '10 µs'], 'T = 1/f = 1/(100×10⁶) = 10 ns.'],
['boolean', 'The expression (X + Y′)(X′ + Z) is equal to which of the following?', ['XZ + X′Y′', 'XY + X′Z′', 'XZ + Y′Z', 'X′Y′ + XY'], 'Expand: XX′ + XZ + X′Y′ + Y′Z = XZ + X′Y′ + Y′Z, and Y′Z is the consensus term of XZ and X′Y′.'],
/* ---- arithmetic ---- */
['arithmetic', 'The 8-bit 2’s complement representation of −0x5A is:', ['0xA6', '0xA5', '0x5A', '0xDA'], 'Invert 0101 1010 → 1010 0101, add 1 → 1010 0110 = 0xA6.'],
['arithmetic', 'The range of a 6-bit 2’s complement number is:', ['−32 to +31', '−31 to +31', '−32 to +32', '0 to 63'], '−2⁵ to 2⁵ − 1.'],
['arithmetic', 'In 4-bit 2’s complement arithmetic, 0111 + 0001 gives:', ['1000 with overflow', '1000 without overflow', '0000 with carry out', '0111'], '+7 + 1 = +8 is out of range; two positive operands gave a negative-looking result (1000 = −8).'],
['arithmetic', 'The 8-bit signed number 0xD6 equals:', ['−42', '−214', '+214', '−86'], '0xD6 = 214; 214 − 256 = −42.'],
['arithmetic', 'Computing 5 − 7 in 4-bit 2’s complement as 5 + (−7) gives:', ['1110 (−2)', '0010 (+2)', '1010 (−6)', '0110 (+6)'], '0101 + 1001 = 1110 = −2, no overflow (operands of opposite sign).'],
['arithmetic', 'The 8-bit unsigned addition 0xF0 + 0x10 produces:', ['result 0x00 with carry out = 1', 'result 0x100 with no carry', 'result 0x00 with carry out = 0', 'result 0xE0'], '0xF0 + 0x10 = 0x100: the 9th bit is the carry out; the 8-bit sum is 0x00.'],
['arithmetic', 'Signed overflow in an adder is detected by:', ['C(in to MSB) ⊕ C(out of MSB)', 'C(out of MSB) alone', 'the sign bit of the result', 'C(in to LSB) ⊕ C(out of LSB)'], 'Carry into and out of the sign position disagree exactly when overflow occurs.'],
['arithmetic', 'Sign extension of the 8-bit signed value 0x9C to 16 bits gives:', ['0xFF9C', '0x009C', '0x9C00', '0x8F9C'], 'MSB of 0x9C is 1, so the new upper bits are all 1s.'],
['arithmetic', 'The BCD sum of 7 and 5 (0111 + 0101) is:', ['0001 0010', '1100', '0001 1000', '0000 1100'], '7 + 5 = 12 → binary 1100 > 9, add 0110 → 1 0010 → digits 1 and 2: 0001 0010.'],
['arithmetic', 'A 4-bit binary adder gives sum 1101 and carry-out 0 when adding two BCD digits. After BCD correction the result is:', ['0001 0011', '1101', '0001 0001', '0000 1101'], '13 > 9, add 6: 1101 + 0110 = 1 0011 → BCD 0001 0011 (decimal 13).'],
['arithmetic', 'To subtract B from A using an adder/subtractor, the circuit:', ['inverts B and sets carry-in to 1', 'inverts A and sets carry-in to 0', 'inverts B and sets carry-in to 0', 'inverts the sum'], 'A − B = A + B′ + 1.'],
['arithmetic', 'Which statement about sign-magnitude representation is true?', ['It has two representations of zero', 'Its range is larger than 2’s complement', 'It can be added with an ordinary binary adder', 'Negation is done by inverting all bits'], '+0 = 0000, −0 = 1000 (4-bit).'],
['arithmetic', 'A 16-bit ripple-carry adder is built from:', ['16 full adders', '16 half adders', '8 full adders', '15 half adders'], 'Each bit needs a carry-in, so 16 full adders (the first can be a half adder when Cin = 0).'],
/* ---- K-map ---- */
['kmap', 'F(A,B,C) = Σm(1,3,5,7). The minimal expression is:', ['C', 'A + B', 'A′C', 'AB + C'], 'All minterms have C = 1, so F = C.'],
['kmap', 'The Maxterm M₃ for variables A, B, C is:', ['A + B′ + C′', 'A′ + B + C', 'A′BC', 'A′B′C′'], '3 = 011 → maxterm complements the 1-bits: A + B′ + C′.'],
['kmap', 'F(A,B) = ΠM(0,1). Then F equals:', ['A', 'B', 'A′', 'A + B'], 'F = 0 on rows 00 and 01 (A = 0), so F = A.'],
['kmap', 'In a K-map, which group size is NOT valid?', ['3 cells', '4 cells', '2 cells', '8 cells'], 'Groups must contain a power of 2 cells.'],
['kmap', 'F(A,B,C,D) = Σm(0,2,8,10). The minimal SOP is:', ['B′D′', 'A′D′', 'B′C′', 'AB′D′'], 'The four corners of the map form one group with B = 0 and D = 0.'],
['kmap', 'F(A,B,C) = Σm(1,3) + d(5,7). The minimal SOP is:', ['C', 'A′C', 'A′B′C + A′BC', 'B′C'], 'Using the don’t-cares, minterms 1,3,5,7 form a group of four with C = 1.'],
['kmap', 'A signal named ENABLE* is:', ['asserted when it is at logic 0', 'asserted when it is at logic 1', 'always at logic 0', 'the complement of a clock'], '* (or a bar/bubble) marks active-low.'],
['kmap', 'How many cells has the K-map of a function of five variables?', ['32', '16', '25', '64'], '2⁵ = 32 (two 4-variable maps).'],
['kmap', 'Canonical product of maxterms of F(A,B,C) = Σm(0,3,5) is:', ['ΠM(1,2,4,6,7)', 'ΠM(0,3,5)', 'ΠM(1,2,4)', 'ΠM(0,1,2,3)'], 'The maxterms are the rows where F = 0: 1,2,4,6,7.'],
['kmap', 'Redeem = Above50·(Sunday + After5) with all signals active-high. In active-low signals (Redeem*, Above50*, Sunday*, After5*) the function is:', ['Redeem* = Above50* + Sunday*·After5*', 'Redeem* = Above50*·(Sunday* + After5*)', 'Redeem* = Above50·(Sunday + After5)', 'Redeem* = Above50* + Sunday* + After5*'], 'Redeem* = (Redeem)′ = Above50′ + Sunday′After5′ with each complemented variable renamed to its active-low signal.'],
/* ---- logic families ---- */
['logic-families', 'An nMOS transistor conducts when its gate input is:', ['logic 1 (high)', 'logic 0 (low)', 'floating', 'at VDD/2 only'], 'nMOS: ON for high gate; pMOS: ON for low gate.'],
['logic-families', 'In a CMOS NOR gate the nMOS transistors are connected in:', ['parallel', 'series', 'a bridge', 'a chain of three'], 'NOR: nMOS parallel (any high input pulls output low), pMOS series.'],
['logic-families', 'Given V_OH(min) = 2.7 V, V_IH(min) = 2.0 V, V_IL(max) = 0.8 V, V_OL(max) = 0.5 V, the DC noise margin is:', ['0.3 V', '0.7 V', '0.8 V', '0.5 V'], 'min{2.7 − 2.0, 0.8 − 0.5} = min{0.7, 0.3} = 0.3 V.'],
['logic-families', 'A gate has I_OH = 400 µA, I_OL = 4 mA; the load inputs need I_IH = 20 µA, I_IL = 0.4 mA. The DC fan-out is:', ['10', '20', '200', '1'], 'min{400/20, 4/0.4} = min{20, 10} = 10.'],
['logic-families', 'Which type of output requires an external pull-up resistor?', ['open-drain / open-collector', 'tri-state', 'totem-pole', 'CMOS inverter'], 'Open-drain only pulls low; the resistor provides the high level.'],
['logic-families', 'Several outputs can be connected to the same bus line provided that at most one is enabled at any time. This describes:', ['tri-state outputs', 'open-drain outputs', 'Schmitt-trigger inputs', 'totem-pole outputs'], 'Disabled tri-state outputs are in the high-impedance state.'],
['logic-families', 'The purpose of a Schmitt-trigger input is to:', ['produce clean transitions from slow or noisy inputs (hysteresis)', 'increase the fan-out', 'provide a tri-state output', 'reduce power consumption'], 'Two thresholds VT+ and VT− make the input switching insensitive to noise.'],
['logic-families', 'The static power dissipation of a CMOS gate is:', ['very small', 'larger than TTL', 'proportional to the frequency', 'equal to its dynamic power'], 'In steady state there is no DC path from VDD to ground. Dynamic power ∝ C·V²·f.'],
['logic-families', 'Open-drain outputs U, V, W are tied together with one pull-up resistor. The common line Z equals:', ['U · V · W (wired-AND)', 'U + V + W', 'U ⊕ V ⊕ W', 'undefined'], 'Z is low if any output pulls low.'],
['logic-families', 'A PLA consists of:', ['a programmable AND plane followed by a programmable OR plane', 'a programmable OR plane followed by a fixed AND plane', 'a set of flip-flops', 'a decoder and a mux'], 'It implements SOP expressions.'],
/* ---- comb blocks ---- */
['comb-blocks', 'A 3-to-8 decoder has how many outputs asserted (when enabled)?', ['exactly 1', 'exactly 3', 'exactly 8', 'a number depending on the input value'], 'Decoder outputs are one-hot.'],
['comb-blocks', 'How many select inputs does a 16-to-1 multiplexer have?', ['4', '16', '2', '8'], '2⁴ = 16.'],
['comb-blocks', 'A 4-to-2 priority encoder with r3 highest priority receives r = 0110. The output code is:', ['10', '01', '11', '00'], 'The highest asserted input is r2, so code = 2 = 10.'],
['comb-blocks', 'How many 2-to-1 multiplexers are needed to build a 4-to-1 multiplexer?', ['3', '2', '4', '5'], 'Two at the first level, one at the second.'],
['comb-blocks', 'A circuit outputs 1 when the 3-bit numbers ABC and XYZ are equal. Its output is:', ['(A⊙X)(B⊙Y)(C⊙Z)', '(A⊕X)(B⊕Y)(C⊕Z)', 'A·X + B·Y + C·Z', '(A + X)(B + Y)(C + Z)'], 'XNOR (⊙) is 1 for equal bits; AND them.'],
['comb-blocks', 'A 4-to-1 multiplexer has D₃ = b, D₂ = a, D₁ = 1, D₀ = 0, selects s₁s₀. The output f is:', ['s₁′s₀ + s₁s₀′a + s₁s₀b', 's₁s₀ + a + b', 's₁′s₀′ + s₁s₀′a + s₁s₀b', 's₁′s₀ + s₁s₀a + s₁s₀′b'], 'f = s₁′s₀′·0 + s₁′s₀·1 + s₁s₀′·a + s₁s₀·b.'],
/* ---- verilog combinational ---- */
['verilog-comb', 'In `assign y = a & b | c;` the expression is evaluated as:', ['(a & b) | c', 'a & (b | c)', '(a | c) & b', 'a & b & c'], '& has higher precedence than |.'],
['verilog-comb', 'What is the value of `4\'b1010 & 4\'b0110`?', ['4\'b0010', '4\'b1110', '4\'b0000', '1\'b1'], 'Bitwise AND: 1010 & 0110 = 0010.'],
['verilog-comb', 'What is `^4\'b1011`?', ['1\'b1', '1\'b0', '4\'b1011', '4\'b0100'], 'Reduction XOR of 1,0,1,1 (three 1s) = 1.'],
['verilog-comb', 'What is `{2\'b10, 2\'b01}`?', ['4\'b1001', '4\'b1010', '4\'b0110', '2\'b11'], 'Concatenation: left operand is the MSBs.'],
['verilog-comb', 'The value of `!4\'b0000` is:', ['1\'b1', '1\'b0', '4\'b1111', '4\'b0000'], 'Logical NOT of a zero value is 1 (bitwise ~ would give 1111).'],
['verilog-comb', 'The value of `8\'hA5 >> 2` is:', ['8\'h29', '8\'h94', '8\'h52', '8\'h14'], '1010 0101 >> 2 = 0010 1001 = 0x29.'],
['verilog-comb', 'In a 4-bit reg `r`, after `r = 4\'d9 + 4\'d9;` r holds:', ['2', '18', '9', '0'], '18 mod 16 = 2 — the carry is lost.'],
['verilog-comb', 'Which code infers a latch?', ['`always @* if (en) q = d;`', '`always @* if (en) q = d; else q = 0;`', '`assign q = en ? d : 1\'b0;`', '`always @(posedge clk) q <= d;`'], 'q is not assigned when en = 0 in a combinational block, so it must remember its value.'],
['verilog-comb', 'In `always @(a, b) y = a & b & c;` the main problem is:', ['c is missing from the sensitivity list', 'a blocking assignment is used', 'the always block has no begin/end', 'y should be a wire'], 'The block does not re-run when c changes: use `always @*`.'],
['verilog-comb', 'A signal assigned inside an `always` block must be declared as:', ['reg', 'wire', 'input', 'parameter'], 'Only variables of type reg can be assigned procedurally.'],
['verilog-comb', 'Which is a correct named-port instantiation of `module add (input a, b, output s);`?', ['add u1 (.a(x), .b(y), .s(z));', 'add u1 (a(x), b(y), s(z));', 'add (u1, .a(x), .b(y), .s(z));', 'add u1 [.a(x), .b(y), .s(z)];'], 'Named connections use `.port(signal)` separated by commas inside parentheses.'],
['verilog-comb', 'The Verilog statement `and g1 (y, a, b);` means:', ['y = a AND b (output listed first)', 'a = y AND b', 'g1 = a AND b', 'y is an input of the gate'], 'In primitive instantiation the output comes first.'],
['verilog-comb', 'Which statement declares an 8-bit input port called din?', ['input [7:0] din', 'input din[8]', 'input [8:0] din', 'input (7:0) din'], '[msb:lsb] precedes the name; 7:0 is 8 bits.'],
/* ---- latches & FFs ---- */
['latches-ff', 'For an SR latch built from NOR gates, which input combination is forbidden?', ['S = 1, R = 1', 'S = 0, R = 0', 'S = 1, R = 0', 'S = 0, R = 1'], 'Both outputs go to 0 and the result is unpredictable when both inputs return to 0 together.'],
['latches-ff', 'A D latch is transparent when:', ['its enable is asserted', 'its enable is de-asserted', 'D = 0', 'a rising clock edge occurs'], 'While enabled, Q follows D.'],
['latches-ff', 'A JK flip-flop with J = K = 1 on the active clock edge:', ['toggles its output', 'sets its output', 'resets its output', 'holds its output'], 'Q⁺ = JQ′ + K′Q = Q′ when J = K = 1.'],
['latches-ff', 'The setup time of a flip-flop is the time that the data input must be stable:', ['before the active clock edge', 'after the active clock edge', 'while the clock is low', 'during reset'], 'Hold time is the corresponding time after the edge.'],
['latches-ff', 'How many flip-flops are needed to implement an FSM with 20 states (binary encoding)?', ['5', '4', '20', '10'], '⌈log₂ 20⌉ = 5.'],
['latches-ff', 'A positive-edge D flip-flop has D = 1 just before a rising edge and D changes to 0 just after the edge. Q after the edge is:', ['1', '0', 'undefined', 'toggled'], 'The flip-flop samples D at the edge (old value 1).'],
['latches-ff', 'The difference between a latch and a flip-flop is that:', ['a latch is level-sensitive and a flip-flop is edge-triggered', 'a latch has two outputs', 'a flip-flop cannot be reset', 'a latch is always asynchronous reset'], 'A latch is transparent for a whole clock level; a flip-flop updates only at the edge.'],
['latches-ff', 'The characteristic equation of a T flip-flop is:', ['Q⁺ = T ⊕ Q', 'Q⁺ = T', 'Q⁺ = TQ', 'Q⁺ = T + Q'], 'T = 1 toggles, T = 0 holds.'],
/* ---- sequential verilog ---- */
['seq-verilog', 'In the code below, if ABC = 001 before a rising clock edge (Rst = 0), what is ABC after the edge?\n```verilog\nalways @(posedge Clk)\n  if (Rst) begin C <= 1\'b1; B <= 1\'b0; A <= 1\'b0; end\n  else begin C <= B; B <= A; A <= A ^ B ^ C; end\n```', ['100', '111', '001', '010'], 'New C = old B = 0; new B = old A = 0; new A = 0 ⊕ 0 ⊕ 1 = 1 → ABC = 100.'],
['seq-verilog', 'A 3-bit counter `q <= q + 1;` currently holds 3\'b111. After the next clock edge q is:', ['3\'b000', '3\'b111', '4\'b1000', 'undefined'], 'A 3-bit register wraps around.'],
['seq-verilog', 'A 4-bit shift-left register holds 1011 and executes `q <= {q[2:0], 1\'b0};` The new value is:', ['0110', '1101', '0101', '1011'], 'Shift left drops the MSB and inserts 0: 011 then 0 = 0110.'],
['seq-verilog', 'With ABC = 100 and `C <= B; B <= A; A <= A ^ ~(B ^ C);` the next ABC is:', ['010', '110', '001', '101'], 'C = 0, B = 1, A = 1 ⊕ ~(0 ⊕ 0) = 1 ⊕ 1 = 0 → 010.'],
['seq-verilog', 'In a clocked always block `q1 = d; q2 = q1;` (blocking) after one clock edge:', ['q1 and q2 both equal d', 'q2 equals the old q1', 'q2 equals d one clock later', 'q2 is unchanged'], 'Blocking assignments update immediately, so q2 sees the new q1 = d. With <= it would be a 2-stage shift register.'],
['seq-verilog', 'With non-blocking assignments `a <= b; b <= a;` in a clocked block, after the edge:', ['a and b have swapped values', 'both equal the old b', 'both equal the old a', 'both are zero'], 'Right-hand sides use the old values.'],
['seq-verilog', 'A 4-bit Johnson counter `q <= {q[2:0], ~q[3]}` holds 0011. The next value is:', ['0111', '0110', '1100', '0001'], '{q[2:0], ~q[3]} = {011, ~0} = 0111: shift left and feed back the inverted MSB.'],
['seq-verilog', 'A 4-bit down counter holds 0000 and executes `q <= q - 1;`. The next value is:', ['1111', '0000', '1110', '0001'], 'Subtraction wraps in 4 bits.'],
['seq-verilog', 'Which sensitivity list gives an asynchronous active-low reset?', ['always @(posedge clk or negedge rst_n)', 'always @(posedge clk)', 'always @(posedge clk or posedge rst_n)', 'always @*'], 'The reset edge must be in the list; active-low reset asserts on the falling edge.'],
['seq-verilog', 'Which assignment type should be used inside `always @(posedge clk)` to describe registers?', ['non-blocking (<=)', 'blocking (=)', 'continuous (assign)', 'it makes no difference'], 'Non-blocking models the simultaneous update of flip-flops.'],
['seq-verilog', 'A 5-bit counter counts 0…20 and wraps. Which statement inside the clocked block is correct (after reset)?', ['if (q == 20) q <= 0; else q <= q + 1;', 'if (q > 20) q <= 0; else q <= q + 1;', 'q <= (q == 20) ? 20 : q + 1;', 'q = q + 1;'], 'At 20 the next value is 0; testing q > 20 would let the counter reach 21 first.'],
/* ---- FSM ---- */
['fsm', 'In a Moore machine the outputs depend on:', ['the present state only', 'the present state and the inputs', 'the inputs only', 'the next state'], 'Mealy outputs also depend on the current inputs.'],
['fsm', 'A Mealy machine differs from a Moore machine because its output:', ['can change when the input changes, without a clock edge', 'is always registered', 'never depends on the state', 'requires more states'], 'Mealy outputs are functions of state and input.'],
['fsm', 'How many state flip-flops does a one-hot encoding of a 5-state FSM need?', ['5', '3', '2', '1'], 'One flip-flop per state.'],
['fsm', 'The usual Mealy FSM for the overlapping sequence 1011 needs how many states?', ['4', '3', '5', '8'], 'States remember the longest matching prefix: nothing, “1”, “10”, “101”. (A Moore version needs one more state for the detected output.)'],
['fsm', 'In FSM design, the D inputs of the state flip-flops are driven by:', ['the next-state logic', 'the output logic', 'the clock', 'the reset'], 'D = next state.'],
['fsm', 'Which Verilog structure is the usual way to write the next-state logic of an FSM?', ['always @* with a case on the current state', 'always @(posedge clk) with blocking assignments', 'an initial block', 'a task'], 'Combinational next-state: `always @* begin next = state; case (state) … endcase end`.'],
['fsm', 'Why should `next = state;` (a default assignment) appear at the top of the next-state always block?', ['to avoid inferring latches', 'to reset the FSM', 'to make the FSM Mealy', 'to enable the clock'], 'Every path assigns next, so no latch.'],
['fsm', 'In an FSM state diagram, every state must have:', ['a transition for every possible input combination', 'exactly one transition', 'a self-loop', 'an output on each arc'], 'The machine must be fully specified.'],
];
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
SC.mcq = R.map((r, i) => {
  const id = 'q' + i;
  let seed = hash(id + r[1]);
  const idx = [0, 1, 2, 3];
  for (let k = 3; k > 0; k--) { seed = (Math.imul(seed ^ (seed >>> 15), 2246822519) + 3266489917) >>> 0; seed ^= seed >>> 13; const j = (seed >>> 7) % (k + 1); [idx[k], idx[j]] = [idx[j], idx[k]]; }
  return { id, topic: r[0], q: r[1], opts: idx.map((k) => r[2][k]), ans: idx.indexOf(0), why: r[3] };
});
})();
