/* Learn topics. Each: id, title, lec (lecture refs), blurb, notes (markdown), problems (ids), exam (past-paper pointer) */
window.SC = window.SC || {};
SC.topics = [
{
  id: 'number-systems', title: 'Number systems & codes', lec: 'Self-study 1–2b', icon: '🔢',
  blurb: 'Bases 2/8/10/16, conversions with fractions, BCD, Gray, ASCII, parity.',
  notes: `
## Positional number systems
A number in base *r* with digits d<sub>n</sub>…d<sub>0</sub>.d<sub>-1</sub>… has value **Σ d<sub>i</sub> · r<sup>i</sup>**. Binary r=2, octal r=8, decimal r=10, hex r=16 (digits 0–9, A–F where A=10 … F=15).

An *n*-bit unsigned number has 2<sup>n</sup> values, range 0 … 2<sup>n</sup>−1. To store *N* distinct values you need ⌈log<sub>2</sub> N⌉ bits.

## Conversions
| From → To | Method |
|---|---|
| Binary ↔ hex | group bits in **4** from the binary point (pad with 0s outside the number) |
| Binary ↔ octal | group bits in **3** |
| Decimal → base r (integer part) | divide repeatedly by r; remainders read **bottom → top** |
| Decimal → base r (fraction part) | multiply repeatedly by r; integer parts read **top → bottom** |
| Base r → decimal | sum d<sub>i</sub>·r<sup>i</sup> |

### Worked example: 214.307 to hexadecimal (6 significant digits)
Integer part: 214 ÷ 16 = 13 rem **6**; 13 ÷ 16 = 0 rem **13 = D** → **D6**.
Fraction: 0.307×16 = 4.912 → **4**; 0.912×16 = 14.592 → **E**; 0.592×16 = 9.472 → **9**; 0.472×16 = 7.552 → **7**.
Result: **D6.4E97<sub>16</sub>** (six digits: D 6 4 E 9 7).

> [!trap] A fraction rarely terminates. The question tells you how many significant digits to give. Stop when you have them, and show every multiplication step: marks are for the working.

## Codes
**BCD (8421)**: each decimal digit is its own 4-bit binary value. 1010–1111 are *invalid*. 59<sub>10</sub> = 0101 1001<sub>BCD</sub>. BCD is **not** the same as binary: 59 in binary is 111011.

**Gray code**: successive values differ in exactly **one** bit. Binary→Gray: g<sub>n−1</sub>=b<sub>n−1</sub>, g<sub>i</sub> = b<sub>i+1</sub> ⊕ b<sub>i</sub> (i.e. g = b ⊕ (b>>1)). Gray→binary: b<sub>n−1</sub>=g<sub>n−1</sub>, b<sub>i</sub> = b<sub>i+1</sub> ⊕ g<sub>i</sub>.

3-bit Gray sequence: 000, 001, 011, 010, 110, 111, 101, 100.

> [!exam] "Describe the merit of Gray over straight binary in an 8-step process." Answer: only **one bit changes** per step (including the wrap-around 100→000), so a position encoder or counter read mid-transition can be wrong by at most one step. In straight binary, 011→100 changes three bits and glitches can produce wildly wrong intermediate values such as 111 or 000.

**ASCII**: 7-bit character code. '0'=0x30 … '9'=0x39, 'A'=0x41 … 'Z'=0x5A, 'a'=0x61 (upper and lower case differ in bit 5, value 0x20).

**Parity bit**: added to detect (not correct) single-bit errors. *Even parity*: the parity bit makes the total number of 1s even. A parity generator is an XOR tree; a checker XORs all bits including the parity bit (1 ⇒ error for even parity).
`,
  problems: [],
},
{
  id: 'boolean', title: 'Boolean algebra & gates', lec: 'L1–L3', icon: '🧩',
  blurb: 'Gates, theorems, De Morgan, NAND/NOR-only circuits, XOR, parity, alternate symbols.',
  notes: `
## Basic gates
| Gate | Expression | Output is 1 when |
|---|---|---|
| NOT | A' | A = 0 |
| AND | AB | all inputs 1 |
| OR | A + B | any input 1 |
| NAND | (AB)' | not all inputs 1 |
| NOR | (A + B)' | all inputs 0 |
| XOR | A ⊕ B = A'B + AB' | an **odd** number of inputs are 1 |
| XNOR | (A ⊕ B)' = AB + A'B' | an **even** number of inputs are 1 (equality) |

## Theorems you must know cold
- Identity / null: A+0 = A, A·1 = A, A+1 = 1, A·0 = 0
- Idempotent: A+A = A, A·A = A. Complement: A+A' = 1, A·A' = 0. Involution: (A')' = A
- Distributive: A(B+C) = AB+AC **and** A + BC = (A+B)(A+C)
- Absorption: A + AB = A, A(A+B) = A
- **A + A'B = A + B** and **A(A'+B) = AB**
- Consensus: AB + A'C + BC = AB + A'C
- **De Morgan**: (AB)' = A' + B', (A+B)' = A'B'. Generalised: break the bar, change the operator.
- Duality: swap AND↔OR and 0↔1 in a theorem to get another theorem.

> [!tip] To simplify algebraically, expand brackets, look for A + A'B, absorption and consensus, and show **each step** with the rule you used. Marks are per step.

### Worked example (past paper, 8 marks): simplify to SOP
F = [(c' + be)(a'e + b'c)]' · [(cd')' + e']

1. De Morgan on the first bracket: [(c'+be)(a'e+b'c)]' = (c'+be)' + (a'e+b'c)'
2. (c'+be)' = c(be)' = c(b'+e') = b'c + ce'
3. (a'e+b'c)' = (a+e')(b+c') = ab + ac' + be' + c'e'
4. (cd')' + e' = c' + d + e'
5. Multiply X = b'c + ce' + ab + ac' + be' + c'e' by (c' + d + e') and absorb: b'cd + ce' + abd + ac' + be' + c'e'
6. ce' + be' + c'e' = e'(c + b + c') = e', and abd is covered by the other terms (consensus)

**F = e' + ac' + ad + b'cd**

> [!tip] Check at the end with one or two input rows and write the rule beside every step; the marks are for the working.

## Universal gates: NAND-only and NOR-only
- **NOT** from NAND/NOR: tie the inputs together.
- **SOP → NAND-NAND**: AND-OR with bubbles pushed → two levels of NAND. (AB + CD)' ' = ((AB)'(CD)')'.
- **POS → NOR-NOR**: (A+B)(C+D) = ((A+B)' + (C+D)')'.

### Worked example: F = (x + y')(w' + z) with 2-input NOR gates only
F = ((x+y')' + (w'+z)')'
1. y' = NOR(y, y); w' = NOR(w, w): two inverters
2. G1 = NOR(x, y') = (x+y')'; G2 = NOR(w', z) = (w'+z)'
3. F = NOR(G1, G2)... but that gives (G1+G2)' = (x+y')(w'+z) ✓.

Total: 5 two-input NOR gates.

## XOR, XNOR, parity
A⊕B⊕C = 1 when an odd number of inputs are 1, so an XOR tree gives an **odd-parity-of-ones indicator** (equals *even parity bit* for the data). XOR as controlled inverter: A ⊕ 1 = A', A ⊕ 0 = A. XOR is associative and commutative.

## Alternate (De Morgan) symbols and bubbles
A NAND gate is equivalent to an OR gate with inverted inputs; a NOR gate is an AND gate with inverted inputs. **Bubble-to-bubble matching**: draw each gate in the symbol that makes the active level of its output match the bubble at the next gate's input. This makes circuits readable in terms of asserted signals.

## Timing basics
- Propagation delay t<sub>p</sub>: time from input crossing 50% to output crossing 50%. t<sub>pHL</sub> and t<sub>pLH</sub> can differ.
- Rise/fall time: 10% → 90% (or 90% → 10%) of the swing.
- An inverter output is the **complement of the input, delayed**. A common "find the errors" question: wrong frequency, wrong voltage range, or output not time-shifted/inverted.
`,
  problems: ['nand-xor', 'alarm-system'],
},
{
  id: 'arithmetic', title: 'Digital arithmetic', lec: 'L4–L6', icon: '➕',
  blurb: 'Half/full adders, 2’s complement, overflow, BCD addition, multipliers, fixed/floating point.',
  notes: `
## Adders
**Half adder** (adds 2 bits): S = A ⊕ B, C = AB.
**Full adder** (adds 2 bits + carry in): S = A ⊕ B ⊕ C<sub>in</sub>, C<sub>out</sub> = AB + C<sub>in</sub>(A ⊕ B).
**Ripple-carry (parallel) adder**: chain n full adders, C<sub>out</sub> of stage *i* feeds C<sub>in</sub> of stage *i*+1. Simple, but the delay grows with n because the carry must ripple through every stage.

## Signed numbers
| | Sign-magnitude | 2's complement |
|---|---|---|
| Range (n bits) | −(2<sup>n−1</sup>−1) … 2<sup>n−1</sup>−1 | −2<sup>n−1</sup> … 2<sup>n−1</sup>−1 |
| Zero | two zeros (+0, −0) | one zero |
| Negate | flip sign bit | invert all bits, **add 1** |
| Add/subtract | needs sign logic | ordinary binary adder |

**2's complement** weight of the MSB is −2<sup>n−1</sup>. For 8 bits: 0x80 = −128, 0xFF = −1, 0x7F = +127.
**Sign extension**: to widen a 2's complement number copy the MSB into the new bits (0xB6 → 0xFFB6).

## Add / subtract
- A − B = A + (B)' + 1: invert B and set carry-in to 1.
- One circuit for both: XOR each B bit with **SUB**, and feed SUB into C<sub>in</sub> of the first stage.

## Overflow
Overflow = the true result does not fit in n bits.
- **Signed (2's complement)**: overflow iff the operands have the *same* sign and the result has the *opposite* sign. In hardware **V = C<sub>in,MSB</sub> ⊕ C<sub>out,MSB</sub>**. Adding numbers of opposite sign can never overflow.
- **Unsigned**: overflow iff the final carry-out is 1 (for subtraction: borrow, i.e. carry-out = 0 when computing A+B'+1).

### Worked example (exam style): 8-bit signed, hex
**8C + 9A**: 8C = 1000 1100 (−116), 9A = 1001 1010 (−102). Binary sum = 1 0010 0110. Keep 8 bits: **26**. Two negatives gave a positive: **overflow = YES** (true value −218 < −128).

**3F − B6**: B6 = 1011 0110 → its 2's complement is 0100 1010 = 4A. 3F + 4A = **89**. 3F is +63 and B6 is −74, so the true answer is +137 > 127: **overflow = YES** (89 = 1000 1001 looks negative).

> [!trap] Always say whether there is overflow, and *why* (same-sign operands, opposite-sign result), even if the question only gives the arithmetic. Don't confuse the carry-out with the overflow flag.

## BCD addition
Adding two BCD digits (and carry in) with a 4-bit binary adder gives S<sub>3</sub>S<sub>2</sub>S<sub>1</sub>S<sub>0</sub> and C<sub>out</sub>. If the result exceeds 9, it is invalid BCD; add **6 (0110)** to correct and produce a decimal carry.

**X = C<sub>out</sub> + S<sub>3</sub>S<sub>2</sub> + S<sub>3</sub>S<sub>1</sub>** (X = 1 exactly when the binary sum exceeds 9; sums 10–15 have S3·(S2+S1) = 1, sums 16–19 set C<sub>out</sub>).

Circuit: adder 1 adds a, b, C<sub>in</sub>. Adder 2 adds the sum to **0 X X 0** (= 6 when X = 1, else 0). The BCD digit output is adder 2's sum and the BCD carry-out is X.

## Multiplication
Binary multiplication = shift-and-add of partial products (AND gates) summed by adders. For two 2-bit numbers x<sub>1</sub>x<sub>0</sub> × y<sub>1</sub>y<sub>0</sub>:
- z<sub>0</sub> = x<sub>0</sub>y<sub>0</sub>
- z<sub>1</sub> = x<sub>1</sub>y<sub>0</sub> ⊕ x<sub>0</sub>y<sub>1</sub>, carry c = x<sub>1</sub>y<sub>0</sub>·x<sub>0</sub>y<sub>1</sub>
- z<sub>2</sub> = x<sub>1</sub>y<sub>1</sub> ⊕ c, z<sub>3</sub> = x<sub>1</sub>y<sub>1</sub>·c

## Fixed vs floating point
- **Fixed point**: fixed number of fraction bits; simple/fast hardware, but limited range *and* precision.
- **Floating point (IEEE 754 single)**: 1 sign bit, 8 exponent bits (bias 127), 23 fraction bits; value = (−1)<sup>s</sup> × 1.f × 2<sup>e−127</sup>. Huge dynamic range, but costlier hardware and rounding error.
`,
  problems: ['half-adder', 'full-adder', 'ripple4', 'addsub4', 'bcd-adder', 'mult2'],
},
{
  id: 'kmap', title: 'Canonical forms & K-maps', lec: 'L7–L8', icon: '🗺️',
  blurb: 'Minterms/maxterms, SOP/POS, K-map grouping, don’t-cares, 5 variables, enables.',
  notes: `
## Minterms and maxterms
For n variables, **minterm m<sub>i</sub>** is the AND of all variables (true form where the bit is 1, complemented where 0), which is 1 only on row *i*. **Maxterm M<sub>i</sub>** is the OR of all variables (complemented where the bit is 1), which is 0 only on row *i*. M<sub>i</sub> = (m<sub>i</sub>)'.

- **Canonical SOP**: F = Σ m(rows where F = 1)
- **Canonical POS**: F = Π M(rows where F = 0)
- Same function: F(A,B,C) = Σm(1,2,5) = ΠM(0,3,4,6,7).

> [!trap] Maxterm for row 5 (101) of A,B,C is (A' + B + C'), the complements are *inverted* compared with the minterm.

## Active-high vs active-low
A signal is *asserted* when its stated condition is true. Active-high (no mark) = asserted at logic 1. Active-low (written X* or X') = asserted at logic 0. **Converting a function from active-high to active-low**: complement each *signal name* meaning, e.g. Redeem = Above50·(Sunday + After5) becomes Redeem* = Above50* + Sunday*·After5* (use De Morgan on the whole function). Check with one row of the truth table.

## Karnaugh maps
Rows/columns are in **Gray order** (00, 01, 11, 10) so neighbours differ in one variable.
1. Mark 1s (SOP) from the truth table or minterm list.
2. Form the **largest** rectangular groups of size 1, 2, 4, 8… (powers of 2). Groups may **wrap around** the edges; corners of a 4×4 map form one group.
3. Cover every 1 using the **fewest** groups; each group becomes a product term (keep the variables that don't change).
4. OR the product terms. (A 1 may be in several groups. Include essential prime implicants first.)

**POS from a K-map**: group the **0s**. This gives F' as SOP; complement it with De Morgan. Quicker: for each group of 0s write a **sum** term with variables *complemented* where the group has 1s.

**Don't-cares (X)**: treat X as 1 only when it makes a group bigger; otherwise ignore it.

### Worked example (past paper): F(A,B,C,D) = Σ m(0,2,5,7,8,9,10,13,15), minimum POS
${B.kmapHTML(['A','B','C','D'], [0,2,5,7,8,9,10,13,15])}

The zeros are m1, m3, m4, m6, m11, m12, m14. Loop them as {m1, m3}, {m4, m6, m12, m14}, {m3, m11}; each loop gives one sum term (complement the variables that are 1 in the loop):

**F = (A + B + D')(B' + D)(B + C' + D')**

(And the SOP is F = B'D' + BD + AB'C'.)

> [!exam] "Show the loops clearly": draw the map, circle each group, and label the product/sum term it produces. A correct minimal answer with unclear loops loses marks.

## Five variables
Draw two 4-variable maps (E = 0 and E = 1 or A = 0 and A = 1) and treat them as stacked layers: squares in the same position in both layers are adjacent.

## Enable / disable
AND gate with enable EN: Y = EN·X passes X when EN = 1, otherwise the output is forced to 0. OR gate with an active-low enable EN*: Y = EN* + X passes X when EN* = 0, otherwise the output is forced to 1. Tri-state buffers disable by going to Hi-Z.
`,
  problems: ['alarm-system'],
},
{
  id: 'logic-families', title: 'Digital circuits: CMOS, TTL & electrical specs', lec: 'L9–L12', icon: '🔌',
  blurb: 'Transistor-level CMOS analysis, noise margin, fan-out, tri-state, open-drain, Schmitt trigger, PLA.',
  notes: `
## CMOS basics
- **nMOS** conducts (ON) when its gate = **1**; connects output toward **GND**. (Drawn without a bubble.)
- **pMOS** conducts when its gate = **0**; connects output toward **V<sub>DD</sub>**. (Drawn with a bubble on the gate.)
- A static CMOS gate has a **pull-up network (pMOS)** and a complementary **pull-down network (nMOS)**: exactly one is ON for each valid input, so there is (almost) no static current.

| Gate | nMOS pull-down | pMOS pull-up |
|---|---|---|
| Inverter | 1 nMOS | 1 pMOS |
| NAND | **series** | **parallel** |
| NOR | **parallel** | **series** |

### How to analyse a CMOS circuit (exam method)
1. For each input combination mark each transistor ON/OFF (nMOS ON when gate=1, pMOS ON when gate=0).
2. Z = **1** if there is a conducting path from V<sub>DD</sub> to Z (and none to GND); Z = **0** if there is a path from Z to GND.
3. Write the truth table; list rows where Z = 0 → **canonical product-of-maxterms** Z = Π M(…).
4. Series = AND of conditions; parallel = OR of conditions. Pull-down path function **G** → Z = G'.

> [!trap] If both a path to V<sub>DD</sub> and a path to GND are ON, the output is a bad intermediate level (short circuit); a correct static CMOS gate never does this. If neither is ON, Z floats (Hi-Z).

## TTL vs CMOS
TTL uses bipolar transistors: higher static power, needs defined input levels. CMOS has near-zero static power, power ∝ **C·V<sub>DD</sub><sup>2</sup>·f** (dynamic), very high input resistance, and large noise margin. Unused CMOS inputs must be tied to a defined level.

## Voltage and current parameters
For device A driving device B:
- V<sub>OH(min)</sub> ≥ V<sub>IH(min)</sub> and V<sub>OL(max)</sub> ≤ V<sub>IL(max)</sub>
- I<sub>OH(max)</sub> ≥ I<sub>IH</sub> and I<sub>OL(max)</sub> ≥ I<sub>IL</sub>

**DC noise margin** = min{ V<sub>OH(min)</sub> − V<sub>IH(min)</sub> , V<sub>IL(max)</sub> − V<sub>OL(max)</sub> }
**DC fan-out** = min{ I<sub>OH</sub> / I<sub>IH</sub> , I<sub>OL</sub> / I<sub>IL</sub> }  (round **down**)

Typical standard TTL: V<sub>OH</sub>=2.4 V, V<sub>OL</sub>=0.4 V, V<sub>IH</sub>=2.0 V, V<sub>IL</sub>=0.8 V → noise margins 0.4 V high, 0.4 V low.

Dynamic: *lower is better*: power dissipation, propagation delay, rise & fall time. *Higher is better*: switching speed.

## Special outputs and inputs
| | Tri-state | Open-drain / open-collector |
|---|---|---|
| States | 0, 1, **Hi-Z** (disabled) | pulls low or is open (Hi-Z) |
| Needs pull-up resistor? | No | **Yes**, external |
| Enable pin? | Yes | No |
| Connect outputs together | OK if **at most one** is enabled (bus) | OK always: **wired-AND** (any output low pulls the line low) |

**Schmitt-trigger input**: two thresholds V<sub>T−</sub> < V<sub>T+</sub> (hysteresis). Cleans slow or noisy edges; output switches only when input passes V<sub>T+</sub> rising or V<sub>T−</sub> falling.

## PLA
A Programmable Logic Array has a programmable **AND plane** (generates product terms) feeding a programmable **OR plane** (sums them): implements several SOP functions, sharing product terms.
`,
  problems: [],
},
{
  id: 'comb-blocks', title: 'Combinational building blocks', lec: 'L13–L14 (Lecture 07)', icon: '🧱',
  blurb: 'Multiplexers, decoders, encoders, comparators; building functions from them.',
  notes: `
## Decoder (n → 2<sup>n</sup>)
Asserts exactly one output (**one-hot**) for each input code: output *i* = minterm *i* of the inputs (AND with **enable**). Any function of n variables = **OR of the decoder outputs** for its minterms.

\`\`\`verilog
module dec2to4 (input [1:0] a, input en, output reg [3:0] d);
  always @*
    if (en) d = 4'b0001 << a;   // one-hot
    else    d = 4'b0000;
endmodule
\`\`\`

## Multiplexer (2<sup>n</sup> → 1)
Output = data input selected by the n select lines. 4:1 mux: **Y = S<sub>1</sub>'S<sub>0</sub>'D<sub>0</sub> + S<sub>1</sub>'S<sub>0</sub>D<sub>1</sub> + S<sub>1</sub>S<sub>0</sub>'D<sub>2</sub> + S<sub>1</sub>S<sub>0</sub>D<sub>3</sub>**.

### Tutorial 6 Q1 (mux with constants)
Inputs: D3 = b, D2 = a, D1 = 1, D0 = 0, selects s1 s0: **f = s1'·s0 + s1·s0'·a + s1·s0·b**.

**A mux implements any function**: with the select lines connected to n−1 of the variables, the data inputs are 0, 1, the remaining variable, or its complement. E.g. F = Σm(1,2,6,7) with S1=A, S0=B → D0 = C, D1 = C', D2 = 0, D3 = 1.

## Encoder / priority encoder
Encoder: 2<sup>n</sup> one-hot inputs → n-bit code. A **priority encoder** handles several asserted inputs by encoding the highest-priority one and gives a **valid** output when any input is asserted (so code 00 can be told apart from "no input").

## Comparator
A > B, A = B, A < B. Equality is the AND of bitwise XNORs: EQ = (A<sub>3</sub>⊙B<sub>3</sub>)(A<sub>2</sub>⊙B<sub>2</sub>)… G = (NASA example in revision Q4).

## Seven-segment decoder
4-bit BCD input → 7 outputs a–g (active-high on common-cathode, active-low on common-anode displays!). A **case** statement gives the neatest Verilog (Lab 3).

## Design recipe for a combinational circuit
1. Define inputs/outputs and active levels. 2. Truth table. 3. K-map each output (or write directly). 4. Gates, or a mux/decoder. 5. **Verify with a few rows.**

> [!exam] "Design a circuit that tells when ABC = XYZ": G = (A⊙X)(B⊙Y)(C⊙Z). "...red indicator when XYZ > 600 psi" with LSB = 100 psi means XYZ > 6 → XYZ = 111 (7): **R = XYZ**.
`,
  problems: ['mux4-case', 'dec24-case', 'dec24-ferry', 'prienc42', 'comparator4', 'seg7'],
},
{
  id: 'verilog-comb', title: 'Verilog for combinational circuits', lec: 'L15–L18 (Lectures 08A/08B)', icon: '💻',
  blurb: 'Modules, wires vs regs, gate primitives, assign, always @*, if/case, parameters, bugs to spot.',
  notes: `
## The mindset
**Think in hardware.** Verilog describes a circuit made of blocks, not a program executed in order. Every line is hardware that exists at the same time.

## Module anatomy
\`\`\`verilog
module name (input a, b, input [3:0] x, output y, output reg [3:0] z);
  wire t;                       // internal net
  and g1 (t, a, b);             // gate primitive: output first
  assign y = t | x[0];          // continuous assignment
  always @* begin               // combinational behaviour
    z = x + 4'd1;
  end
endmodule
\`\`\`
- **Ports**: input / output (a port can be read; only outputs are written).
- **wire**: a connection; driven by \`assign\`, gate primitives or module outputs.
- **reg**: a variable that can be assigned inside \`always\`/\`initial\`. *reg does not always mean a register!* In \`always @*\` it is just a wire.
- Vectors: \`[3:0] x\`; bit-select \`x[2]\`, part-select \`x[3:1]\`, concatenation \`{a, b}\`, replication \`{4{a}}\`.
- Literals: \`4'b1010\`, \`8'hFF\`, \`12'd100\` (size'base value). Unsized = 32 bits.

## Operators
| Type | Operators |
|---|---|
| Bitwise | \`~ & | ^ ~^\` |
| Logical | \`! && ||\` (result is 1 bit) |
| Reduction | \`&x |x ^x ~&x ~|x ~^x\` (reduce a vector to 1 bit) |
| Arithmetic | \`+ - * / %\` |
| Compare | \`== != < <= > >=\` |
| Shift | \`<< >> >>>\` |
| Conditional | \`sel ? a : b\` (a mux!) |

> [!trap] \`&\` is bitwise (vector result); \`&&\` is logical (1-bit). \`~\` inverts every bit; \`!\` gives 1 bit.

## Three ways to describe the same circuit
\`\`\`verilog
// 1) gate level
and a1 (w1, a, b);  or o1 (y, w1, c);
// 2) dataflow
assign y = (a & b) | c;
// 3) behavioural
always @* if (c) y = 1; else y = a & b;     // y must be 'reg'
\`\`\`

## always @* rules (combinational)
- Use \`always @*\` (or list *every* signal read); use **blocking** assignment \`=\`.
- **Assign every output in every path**; otherwise the synthesiser infers a **latch**. Give a default value first, or end \`if\` with \`else\` and \`case\` with \`default\`.
- Each signal should be driven from **one** place only.

\`\`\`verilog
always @* begin
  y = 1'b0;                  // default: no latch
  case (sel)
    2'b00: y = a;
    2'b01: y = b;
    2'b10: y = c;
    default: y = 1'b0;
  endcase
end
\`\`\`
\`casez\` treats \`?\`/\`z\` bits in labels as don't-care (priority encoders): \`4'b1???: y = 2'd3;\`

## Module instantiation and parameters
\`\`\`verilog
module top (input [1:0] sel, input full, output [3:0] queue);
  dec2to4 u1 (.a(sel), .en(~full), .d(queue));   // named ports (preferred)
endmodule

module thermo #(parameter W = 8) (input [W-1:0] Tset, Tact, output Hon, Con);
  ...
endmodule
thermo #(.W(12)) U1 (.Tset(Tset), .Tact(Tact), .Hon(Hon), .Con(Con));   // override width
\`\`\`

## Find-the-bugs checklist (tutorial 7 Q3 style)
1. Output assigned in \`always\` but not declared **reg**.
2. Sensitivity list incomplete (\`always @(a,b)\` but also reads \`c\`, \`sel\`) → use \`@*\`.
3. \`case\` without \`default\` / \`if\` without \`else\` → **latch**.
4. Output narrower than assigned value (6-bit \`result\`, 4-bit data): fine but check.
5. Stray semicolon after \`endmodule\`.
6. Two drivers on one signal (\`assign\` and \`always\`, or two \`assign\`s).
7. Using \`<=\` in combinational code.

> [!tip] This site's Playground lists these as warnings: latch inferred, incomplete sensitivity list, multiple drivers, wire assigned in always.
`,
  problems: ['half-adder', 'mux2-assign', 'mux4-case', 'dec24-ferry', 'prienc42', 'parity', 'thermo', 'max3', 'bugfix-comb', 'gray4'],
},
{
  id: 'latches-ff', title: 'Latches, flip-flops & timing', lec: 'L19–L20 (Lecture 09)', icon: '🔒',
  blurb: 'SR/D latch, edge-triggered D and JK flip-flops, characteristic equations, timing diagrams.',
  notes: `
## Combinational vs sequential
Combinational: output = f(present inputs). **Sequential**: output depends on inputs **and state** (memory of the past). Memory elements: latches and flip-flops.

## SR latch (cross-coupled NOR)
| S | R | Q (next) |
|---|---|---|
| 0 | 0 | hold |
| 1 | 0 | set: Q = 1 |
| 0 | 1 | reset: Q = 0 |
| 1 | 1 | **forbidden** (both outputs 0; if S and R then drop together, result is unpredictable) |

**Gated (enabled) SR latch**: S and R only act while enable/clock is 1. **D latch**: S = D, R = D', so no forbidden state. It is **transparent**: while EN = 1, Q follows D; while EN = 0, Q holds.

## Flip-flops: edge-triggered
A flip-flop samples its inputs **only at the active clock edge** (rising edge = posedge) and holds Q otherwise.

| Type | Behaviour | Characteristic equation |
|---|---|---|
| **D** | Q⁺ = D | Q⁺ = D |
| **JK** | 00 hold, 01 reset, 10 set, 11 **toggle** | Q⁺ = JQ' + K'Q |
| **T** | T=1 toggles | Q⁺ = T ⊕ Q |

> [!key] **Latch vs flip-flop**: a latch is *level*-sensitive (transparent for a whole clock phase), a flip-flop is *edge*-triggered (Q can change only at the edge). In a timing diagram, a D latch output changes at *any* time D changes while EN = 1; a D flip-flop output changes only at a clock edge and takes the value D had **just before** the edge.

## Completing timing diagrams (tutorial 8 Q2)
1. Draw vertical lines at every active clock edge.
2. For a D flip-flop: at each edge Q becomes D (as it was just before the edge); between edges it holds.
3. For a latch: while EN is high Q follows D (with a short delay); when EN falls Q freezes.
4. For an SR latch with S = R = 1: shade the output as **undefined**.
5. JK: apply the J, K truth table at each edge.

## Setup and hold time
**Setup time t<sub>su</sub>**: D must be stable *before* the clock edge. **Hold time t<sub>h</sub>**: D must remain stable *after* the edge. Violating either may leave the flip-flop **metastable** (output undefined).
Minimum clock period ≥ t<sub>clk-to-Q</sub> + t<sub>logic</sub> + t<sub>su</sub>.

## Registers and shift registers
A **register** = n D flip-flops sharing a clock. A **shift register** chains them: Q of stage *i* → D of stage *i*+1. With 4-bit registers in a FIFO with an inverter in the middle (tutorial 8 Q3), the output is the input delayed by the number of stages, with the inversion applied. Draw each stage's value after every clock edge.

**Reset**: *synchronous* (checked only at the clock edge) vs *asynchronous* (acts immediately, independent of the clock).
`,
  problems: ['dff-sync', 'dff-async'],
},
{
  id: 'seq-verilog', title: 'Sequential circuits in Verilog', lec: 'L21–L22 (Lecture 10)', icon: '⏱️',
  blurb: 'Clocked always blocks, non-blocking assignment, registers, counters, shift registers, timing prediction.',
  notes: `
## The template
\`\`\`verilog
module reg8 (input clk, rst, en, input [7:0] d, output reg [7:0] q);
  always @(posedge clk) begin      // synchronous: sensitive to the clock edge only
    if (rst)      q <= 8'd0;       // synchronous reset
    else if (en)  q <= d;          // else q keeps its value (flip-flop with enable)
  end
endmodule
\`\`\`
**Every signal assigned in a clocked always block becomes a flip-flop** (a register). Use **non-blocking** \`<=\` for these assignments. Use **blocking** \`=\` in combinational \`always @*\`.

| | Combinational | Synchronous |
|---|---|---|
| Sensitivity | \`@*\` | \`@(posedge clk)\` |
| Assignment | blocking \`=\` | non-blocking \`<=\` |
| Each assignment is… | a wire (gates) | a register (flip-flop) |

**Asynchronous reset**: \`always @(posedge clk or posedge rst)\` (or \`negedge rst_n\` for active-low).

## Why non-blocking?
All right-hand sides are evaluated **first** with the *old* values; the left-hand sides all update at the end of the time step. So \`<=\` statements are order-independent and model real flip-flops: \`q3 <= q2; q2 <= q1; q1 <= d;\` is a 3-stage shift register. With blocking \`=\` the same lines would collapse into a single register.

## Predicting behaviour (very common exam question)
Past paper Q4a: \`C <= B; B <= A; A <= A ^ ~(B ^ C);\` with reset to 000. At each rising edge compute the *new* A, B, C from the **old** A, B, C:

| edge | A B C (before) | new C = B | new B = A | new A = A⊕~(B⊕C) | A B C (after) |
|---|---|---|---|---|---|
| 1 | 0 0 0 | 0 | 0 | 0⊕~0 = 0⊕1 = **1** | 1 0 0 |
| 2 | 1 0 0 | 0 | 1 | 1⊕~0 = 1⊕1 = **0** | 0 1 0 |
| 3 | 0 1 0 | 1 | 0 | 0⊕~(1⊕0) = 0⊕0 = **0** | 0 0 1 |
| 4 | 0 0 1 | 0 | 0 | 0⊕~(0⊕1) = 0 | 0 0 0 |

Outputs change just *after* each rising edge. The circuit: three D flip-flops, **A's D input = A XNOR(B XOR C)**-style gate network, B.D = A.Q, C.D = B.Q. Use **Playground → Step mode** to check your hand-drawn waveform.

## Counters
\`\`\`verilog
always @(posedge clk)
  if (rst)            q <= 5'd0;
  else if (q == 5'd20) q <= 5'd0;      // wrap at 20: counts 0..20
  else                q <= q + 5'd1;
\`\`\`
- Wrap at a variable value: compare with an input \`countmax\`.
- Down counter loaded from \`start_val\` on reset: \`if (rst) q <= start_val; else q <= q - 1;\`
- Count enable: add \`else if (en)\`.
- A *n*-bit counter wraps automatically (2<sup>n</sup> states).

## Pipelining (tutorial 9 Q1b)
A register after each combinational stage; each stage's input is the *registered* previous result, so the output is delayed by one clock per register. In the \`z <= x; r <= z*z\` recap example, the same \`a,b\` need **two** clock edges before they reach \`r\`.

## Common errors
- Mixing \`=\` and \`<=\` in one block.
- Driving one reg from two different always blocks.
- Forgetting reset (registers start undefined in a real device).
- A counter written with blocking assignment, or with \`q = q + 1\` outside a clock block (this is a combinational loop!).
- Using a **wire** for a signal assigned in a clocked block.
`,
  problems: ['dff-sync', 'dff-async', 'reg-en', 'cnt3', 'cnt20', 'cnt-max', 'cnt-down', 'updown', 'shift4', 'johnson', 'monitor-alarm'],
},
{
  id: 'fsm', title: 'Finite state machines', lec: 'L23–L24 (Lecture 11)', icon: '🚦',
  blurb: 'Moore/Mealy, state diagrams and tables, encoding, next-state and output equations, D flip-flop implementation.',
  notes: `
## What an FSM is
A **synchronous sequential circuit**: a state register (flip-flops) + **next-state logic** + **output logic**.
- **Moore**: outputs depend on the **state only**. Output changes after the clock edge.
- **Mealy**: outputs depend on the **state and the current inputs**. Output can change when inputs change; typically fewer states.

For *m* states you need ⌈log<sub>2</sub> m⌉ flip-flops (binary encoding), or *m* flip-flops (one-hot).

## Design procedure (from the lectures)
1. Draw the **state transition diagram** (name the states, label arcs with input, and outputs in states for Moore or on arcs for Mealy).
2. Build the state transition table (with names).
3. **Encode** the states (any unique assignment works, different encodings give different logic but the same behaviour).
4. Write the table with encoded states: inputs = (present state, input) → outputs = (next state, output).
5. **K-map** each next-state bit and each output → minimal equations.
6. Draw the circuit: D flip-flops with D<sub>i</sub> = next-state bit i, plus gates.

### Worked example (lecture): off → on1 → on2 → on3 → off
States off=00, on1=01, on2=10, on3=11; input *b* starts the sequence from off; output x = 1 in on1/on2/on3.
${(function(){
  const st=[{id:'00',label:'off\n00',x:70,y:100,sub:'x=0'},{id:'01',label:'on1\n01',x:230,y:100,sub:'x=1'},{id:'10',label:'on2\n10',x:390,y:100,sub:'x=1'},{id:'11',label:'on3\n11',x:550,y:100,sub:'x=1'}];
  const ed=[{from:'00',to:'00',label:"b'"},{from:'00',to:'01',label:'b'},{from:'01',to:'10',label:'1'},{from:'10',to:'11',label:'1'},{from:'11',to:'00',label:'1',curve:'bottom'}];
  return SC.fsmSVG(st,ed,{w:620,h:200});
})()}

| s1 s0 | b | n1 n0 | x |
|---|---|---|---|
| 0 0 | 0 | 0 0 | 0 |
| 0 0 | 1 | 0 1 | 0 |
| 0 1 | – | 1 0 | 1 |
| 1 0 | – | 1 1 | 1 |
| 1 1 | – | 0 0 | 1 |

n1 = s1'·s0 + s1·s0', n0 = s1'·s0'·b + s1·s0', x = s1 + s0. Circuit: 2 D flip-flops with D1 = n1, D0 = n0.

> [!exam] Typical 12-mark question: given a state diagram, (i) state table (ii) minimal SOP next-state/output equations (iii) circuit with D flip-flops. Practise under time: **Drill → FSM**.

## Reading a state diagram
- A circle = a state (name/encoding). In a Moore machine the output is written inside the circle.
- An arrow = a transition; label = input condition (Mealy: *input/output*).
- Every state must have a transition for **every** input combination (complete, mutually exclusive).
- Reset state: where it starts.

## Sequence detector example (tutorial 10)
Output 1 from the second consecutive 1, stays until two consecutive 0s. Moore states: **S0** (idle, out 0), **S1** (saw one 1, out 0), **S2** (out 1), **S3** (out 1, saw one 0). Transitions: S0 –1→ S1; S0 –0→ S0; S1 –1→ S2; S1 –0→ S0; S2 –1→ S2; S2 –0→ S3; S3 –1→ S2; S3 –0→ S0.

Input 0,1,0,1,1,0,1,1,0,0,0,1,0,1,1 → state after each: S0 S1 S0 S1 S2 S3 S2 S2 S3 S0 S0 S1 S0 S1 S2 → outputs 0,0,0,0,1,1,1,1,1,0,0,0,0,0,1.
`,
  problems: ['fsm-seq', 'moore-1011', 'traffic'],
},
{
  id: 'fsm-verilog', title: 'FSMs in Verilog', lec: 'L25–L26 (Lecture 12)', icon: '🤖',
  blurb: 'Three-block template, state encoding with localparam, Moore vs Mealy outputs, testbench sequences.',
  notes: `
## Standard template (memorise)
\`\`\`verilog
module detector (input clk, rst, in, output out);
  localparam S0 = 2'd0, S1 = 2'd1, S2 = 2'd2, S3 = 2'd3;
  reg [1:0] state, next;

  // 1. state register (synchronous)
  always @(posedge clk)
    if (rst) state <= S0;
    else     state <= next;

  // 2. next-state logic (combinational)
  always @* begin
    next = state;                       // default: stay (avoids latches)
    case (state)
      S0: if (in)  next = S1;
      S1: if (in)  next = S2; else next = S0;
      S2: if (!in) next = S3;
      S3: if (in)  next = S2; else next = S0;
      default: next = S0;
    endcase
  end

  // 3. output logic
  assign out = (state == S2) || (state == S3);     // Moore: state only
endmodule
\`\`\`
For a **Mealy** machine the output expression also uses \`in\`: \`assign out = (state == S1) & in;\`

## Rules
- Name states with **localparam** (readable; encoding is easy to change).
- State register = \`always @(posedge clk)\` with **non-blocking** assignment; next-state = \`always @*\` with **blocking** and a **default** assignment.
- \`case\` needs a \`default\` branch: unused state codes should return to the reset state.
- Output logic can be an \`assign\`, or an \`always @*\` block.
- With only \`assign\` statements (tutorial 10 b) write the next-state equations directly from the K-maps.

## Verilog ⇆ diagram
Read \`always @*\` + \`case\`: each \`case\` item is a circle; each \`if\` is an arrow with its condition. Draw the diagram **before** writing code.

## Testbench for an FSM
\`\`\`verilog
module tb;
  reg clk = 0, rst = 1, in = 0; wire out;
  detector dut (.clk(clk), .rst(rst), .in(in), .out(out));
  always #5 clk = ~clk;                         // period 10
  initial begin
    #12 rst = 0;
    // feed one bit per clock, just after the rising edge
    in = 0; #10 in = 1; #10 in = 0; #10 in = 1; #10 in = 1; #10 in = 0;
    #20 $finish;
  end
  initial $monitor("t=%0t in=%b out=%b", $time, in, out);
endmodule
\`\`\`
Paste into the **Playground**: the waveform viewer shows clk, in, state and out together.
`,
  problems: ['fsm-seq', 'moore-1011', 'traffic'],
},
];
