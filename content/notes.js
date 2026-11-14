/* Learn topics. Each: id, title, lec (lecture refs), blurb, sources (ground-truth PDFs, md inline), notes (markdown), problems (ids).
 * Cite course PDFs inline with [src:KEY pN] (see content/sources.js). Anything not in the course PDFs goes in a > [!extra] box. */
window.SC = window.SC || {};
SC.topics = [
{
  id: 'number-systems', title: 'Number systems & codes', lec: 'Week 1 self-study (1, 2a, 2b)', icon: '🔢',
  blurb: 'Bases 2/8/10/16, conversions with fractions, BCD, Gray, ASCII, parity.',
  sources: '[src:2a] [src:2b] [src:tut1]',
  notes: `
## Positional number systems
A base-*N* digit in position *p* carries weight N<sup>p</sup> (negative *p* after the point). Binary N=2, octal N=8, decimal N=10, hex N=16 (A=10 … F=15). [src:2a p3-10]

An *n*-bit unsigned number has 2<sup>n</sup> values, range 0 … 2<sup>n</sup>−1. To store values up to *N* you need ⌈log<sub>2</sub>(N+1)⌉ bits. Tutorial 1: the largest 16-bit binary number is 65535, the largest 16-bit BCD number is 9999, and a value up to 350000 needs 19 bits. [src:tut1 Q1-2]

## Conversions
| From → To | Method | Source |
|---|---|---|
| Base N → decimal | multiply each digit by its weight and add | [src:2a p12] |
| Decimal → base N (integer part) | divide repeatedly by N; the first remainder is the LSD, the last is the MSD | [src:2a p13-14] |
| Decimal → base N (fraction part) | multiply the fraction repeatedly by N; the integer parts, in order, are the digits after the point | [src:2a p17-21] |
| Binary ↔ hex / octal | starting from the binary point, replace every 4 bits (hex) or 3 bits (octal) | [src:2a p22-25] |

### Worked example (past paper, 4 marks): 214.307 to hexadecimal, 6 significant digits [src:pp1819s2 Q1a]
Integer part: 214 ÷ 16 = 13 rem **6**; 13 ÷ 16 = 0 rem **13 = D** → **D6**.
Fraction: 0.307×16 = 4.912 → **4**; 0.912×16 = 14.592 → **E**; 0.592×16 = 9.472 → **9**; 0.472×16 = 7.552 → **7**.
Result: **D6.4E97<sub>16</sub>** (six digits: D 6 4 E 9 7).

> [!trap] A fraction rarely terminates. The question tells you how many significant digits to give. Stop when you have them, and show every multiplication step: marks are for the working.

## Codes
**BCD**: each decimal digit is coded as its own 4-bit binary value; 1010–1111 are illegal. 957 = 1001 0101 0111 in BCD but 11 1011 1101 in straight binary. BCD needs more bits than binary and its arithmetic is slower, so high-speed computers don't use it. [src:2b p5-10]

**Gray code**: a *minimum-change* code (only one bit changes from one step to the next), *unweighted*, and usually *cyclical* (last and first codewords also differ in one bit). Useful wherever several bits changing at once could cause an error; not suitable for arithmetic. 14 in Gray code is 1001. [src:2b p12-18; 2b p24]

3-bit Gray sequence: 000, 001, 011, 010, 110, 111, 101, 100.

> [!exam] Past paper: "Write out a 3-bit Gray code sequence. Briefly describe its merit over a straight binary code in repeating an 8-step process." [src:pp1819s2 Q1b] Answer: only **one bit changes** per step (including the wrap-around 100→000), so there is no race between bits changing at slightly different speeds. In straight binary, 011→100 changes three bits and a transient wrong code (e.g. 111 or 000) can appear: the slides show the same race for BCD 01→10. [src:2b p14-17]

> [!extra] The slides don't give a conversion formula. A quick method: Binary→Gray: g<sub>n−1</sub>=b<sub>n−1</sub>, g<sub>i</sub> = b<sub>i+1</sub> ⊕ b<sub>i</sub> (i.e. g = b ⊕ (b>>1)). Gray→binary: b<sub>n−1</sub>=g<sub>n−1</sub>, b<sub>i</sub> = b<sub>i+1</sub> ⊕ g<sub>i</sub>. Check: 1110 → 1110 ⊕ 0111 = 1001 ✓.

**ASCII**: 7-bit code (128 symbols), bits b7 (MSB) … b1; usually written in hex after padding a 0 at the MSB. Upper and lower case letters have different codes. **You are not required to memorise the ASCII table** (the question will give it), though '0' = 0x30, 'A' = 0x41, 'a' = 0x61 are handy. [src:2b p20-23]

**Parity bit**: an extra bit sent with the data. *Even parity*: the parity bit makes the total number of 1s even (*odd parity*: odd) **before** transmitting; sender and receiver must agree on which. It detects a **single-bit error**; a 2-bit error leaves the parity unchanged and goes undetected, and parity cannot say *which* bit is wrong. [src:2b p25-30] A multi-input XOR is an odd-function generator, so an XOR tree of the data bits gives the even-parity bit, and XORing every received bit (parity included) gives 1 when an even-parity word is in error. [src:3 p59]

**Prefixes**: SI k/M/G = 10<sup>3</sup>/10<sup>6</sup>/10<sup>9</sup>; binary (JEDEC K/M/G, IEC Ki/Mi/Gi) = 2<sup>10</sup>/2<sup>20</sup>/2<sup>30</sup>. [src:2b p31-32]
`,
  problems: [],
},
{
  id: 'boolean', title: 'Boolean algebra & gates', lec: 'L1–L3 (+ bubbles from L10)', icon: '🧩',
  blurb: 'Gates, theorems, De Morgan, NAND/NOR-only circuits, XOR, parity, alternate symbols, timing.',
  sources: '[src:3] [src:6 p25-27] [src:6 p52-53] [src:tut2] [src:tut5]',
  notes: `
## Basic gates
| Gate | Expression | Output is 1 when | Source |
|---|---|---|---|
| NOT | A' | A = 0 | [src:3 p16-17] |
| Buffer | A | A = 1 (no change in logic) | [src:3 p18] |
| AND | AB | all inputs 1 | [src:3 p13-15] |
| OR | A + B | at least one input 1 | [src:3 p9-12] |
| NAND | (AB)' | not all inputs 1 (0 only when all are 1) | [src:3 p40-45] |
| NOR | (A + B)' | all inputs 0 | [src:3 p40-45] |
| XOR | A ⊕ B = AB' + A'B | an **odd** number of inputs are 1 | [src:3 p56] |
| XNOR | (A ⊕ B)' = AB + A'B' | an **even** number of inputs are 1 (equality) | [src:3 p57] |

**Order of precedence**: NOT on a single variable, then parentheses, then AND, then OR. So A + BC' means A + (B·C'). [src:3 p22]

Logic levels: TTL logic 0 is 0–0.8 V and logic 1 is 2.0–5 V; CMOS (74AC) logic 0 is 0–1.5 V and logic 1 is 3.5–5 V. In between is indeterminate. [src:3 p4]

## Theorems you must know cold [src:3 p29-38]
- Single variable: X·0 = 0, X+1 = 1, X·1 = X, X+0 = X, X·X = X, X+X = X, X·X' = 0, X+X' = 1, (X')' = X
- **Duality**: a theorem stays true if you swap 0↔1 and ·↔+ throughout. [src:3 p30]
- Commutative, associative, distributive: A(B+C) = AB+AC, (A+B)(C+D) = AC+BC+AD+BD, and the dual form A + BC = (A+B)(A+C)
- **Absorption** (the slides list both): A + AB = A and **A + A'B = A + B** [src:3 p33]
- **Consensus**: AB + A'C + BC = AB + A'C [src:3 p35]
- **De Morgan**: (A+B)' = A'B', (AB)' = A' + B'. Generalised: add or remove an inverter on each variable and interchange AND with OR. [src:3 p36-38]

> [!tip] To simplify algebraically, expand brackets, look for A + A'B, absorption and consensus, and show **each step** with the rule you used. Marks are per step.

### Worked example (past paper, 8 marks): simplify to SOP [src:pp1819s2 Q1c]
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
NAND gates alone can make NOT, AND and OR, so they can implement any function; the same is true of NOR. [src:3 p46-48]
- **NOT** from NAND/NOR: tie the inputs together.
- **SOP → NAND-NAND**: AB + CD = ((AB)'·(CD)')': two levels of NAND.
- **POS → NOR-NOR**: (A+B)(C+D) = ((A+B)' + (C+D)')': two levels of NOR.
- Tutorial 2: (A+B)(C+D) needs **8** two-input NANDs but only **3** two-input NORs. [src:tut2 Q5]

### Worked example (past paper, 4 marks): F = (x + y')(w' + z) with 2-input NOR gates only [src:pp1819s2 Q1d]
F = ((x+y')' + (w'+z)')'
1. y' = NOR(y, y); w' = NOR(w, w): two inverters
2. G1 = NOR(x, y') = (x+y')'; G2 = NOR(w', z) = (w'+z)'
3. F = NOR(G1, G2) = (G1 + G2)' = G1'·G2' = (x+y')(w'+z) ✓

Total: **5** two-input NOR gates.

## XOR, XNOR, parity
XOR is a **bit-wise comparator**: the output is 1 when the two inputs differ. [src:3 p58] A multi-input XOR is an **odd-function generator**: output 1 when an odd number of inputs are 1, and A⊕B⊕C = (A⊕B)⊕C = A⊕(B⊕C). [src:3 p59] That is why an XOR tree is the parity generator/checker of L3. [src:key]

## Alternate symbols and bubble-to-bubble matching
The alternate symbol of a gate comes from De Morgan: **add or remove a bubble at every input and the output, and swap the AND shape for OR (or OR for AND)**. NAND = OR with bubbled inputs; NOR = AND with bubbled inputs. Both symbols describe the same gate with the same truth table. [src:3 p50-52]

Reading a diagram drawn with **bubble-to-bubble matching**: say "0" where there is a bubble and "1" otherwise. Example: an OR-with-bubbled-inputs feeding a bubbled input is read as "X = 1 when C = 0 and at the same time A = 0 or B = 0". [src:3 p53-55] Connection diagrams that follow these rules show active levels clearly (L10). [src:6 p25-27; tut5 Q2]

## Timing basics
- **Propagation delay**: from the input crossing **50%** to the output crossing 50%. t<sub>PHL</sub> = delay when the output goes High→Low, t<sub>PLH</sub> = Low→High. E.g. 9–19 ns for a 74HC00. [src:6 p52-53]
- **Rise time / fall time**: **10% → 90%** (or 90% → 10%) of the output swing. [src:6 p53]
- A realistic timing diagram shows the output changing a little after the inputs, with sloped edges. [src:3 p20]

> [!exam] Revision Q7: "The input of a TTL inverter is a 1 kHz square wave … point out and correct the three errors in the timing diagram." The official answer: (1) **frequency**: 1 kHz means a period of 1 ms; (2) **voltage range**: a TTL logic-0 output must be 0–0.8 V; (3) the inverter output must be **the opposite of the input at all times**. [src:rev Q7; revA Q7]
`,
  problems: ['nand-xor', 'alarm-system'],
},
{
  id: 'arithmetic', title: 'Digital arithmetic', lec: 'L4–L6 (+ fixed/floating point from L12)', icon: '➕',
  blurb: 'Half/full adders, 2’s complement, overflow, add/subtract circuit, multiplication, BCD addition, fixed/floating point.',
  sources: '[src:4] [src:7 p12-16] [src:tut3]',
  notes: `
## Adders
**Half adder** (adds 2 bits): Sum = A ⊕ B, Carry = A·B. [src:4 p5]
**Full adder** (adds 3 bits): Sum = A ⊕ B ⊕ C<sub>in</sub>, C<sub>out</sub> = AB + BC<sub>in</sub> + AC<sub>in</sub> = AB + C<sub>in</sub>(A ⊕ B). The second form is **two half adders and an OR gate**. [src:4 p6-10]

<div class="cfig" data-fig="full-adder"></div>

**Parallel (ripple) adder**: N full adders cascaded, C<sub>out</sub> of stage *i* into C<sub>in</sub> of stage *i*+1. All bits are fed in at once, but the speed is limited by **carry propagation** through the FAs. [src:4 p12-13] A **carry-look-ahead** circuit reduces this delay; many IC adders have one built in. [src:4 p52]

<div class="cfig" data-fig="ripple"></div>

## Signed numbers
| | Sign-magnitude | 2's complement |
|---|---|---|
| Range (N bits) | −(2<sup>N−1</sup>−1) … +(2<sup>N−1</sup>−1) | −2<sup>N−1</sup> … +(2<sup>N−1</sup>−1) |
| Zero | two zeros (0000 0000 = +0, 1000 0000 = −0) | one zero |
| Negate | flip the sign bit | invert every bit, then **add 1** |
| Values | equal numbers of + and − | one more negative than positive |
Sources: [src:4 p14-23]

- **Short-cut 2's complement**: from the LSB, copy bits up to and including the first 1, then invert all the remaining bits. [src:4 p19-20]
- Special patterns: 100…0 = −2<sup>N−1</sup>, 111…1 = −1, 011…1 = 2<sup>N−1</sup>−1. For 8 bits: 0x80 = −128, 0xFF = −1, 0x7F = +127. [src:4 p27]
- Exception: the most negative number (−8 in 4 bits, −128 in 8 bits) has no positive counterpart; its 2's complement is itself. [src:4 p32]
- **Sign extension**: fill the extra MSBs with the sign bit: 101 = 1101 = 11101; 0xB6 → 0xFFB6. [src:4 p31]
- To get the decimal value of a negative number: take its 2's complement, then convert the magnitude (10011 → 01101 = 13, so −13). [src:4 p28-29]

## Add / subtract
- Add the sign bits like any other bit and **ignore the carry out** of the MSB. [src:4 p34-37]
- **A − B = A + (−B)**, where −B is the 2's complement of B. Both operands must have the **same number of bits** so the sign bits line up. [src:4 p38-40]
- One circuit for both (Fig 6-12): each Y bit goes through an XOR controlled by **Add/Sub**, and Add/Sub also drives C<sub>0</sub>. Add/Sub = 0 → X + Y; Add/Sub = 1 → X + Y' + 1 = X − Y. [src:4 p45-48]

<div class="cfig" data-fig="addsub"></div>

## Overflow [src:4 p42-43]
Overflow = the result of two N-bit operands cannot be represented in N bits. The slides' rules:
- **Addition**: no overflow if the operands have **opposite** signs. Overflow when the operands have the **same** sign but the sum has the **opposite** sign.
- **Subtraction**: no overflow if the operands have the **same** sign (think of it as adding −B).

> [!extra] Hardware shortcut (not on the slides): signed overflow V = C<sub>in</sub> into the MSB ⊕ C<sub>out</sub> of the MSB. For *unsigned* numbers the carry out of the MSB is the overflow. Neither is required by the slides; the sign rule above is.

### Worked example (past paper, 4 marks): 8-bit signed, hex [src:pp1819s2 Q2a]
**8C + 9A**: 8C = 1000 1100 (−116), 9A = 1001 1010 (−102). Binary sum = 1 0010 0110. Keep 8 bits: **26**. Two negatives gave a positive: **overflow = YES** (true value −218 < −128).

**3F − B6**: B6 = 1011 0110 → its 2's complement is 0100 1010 = 4A. 3F + 4A = **89**. 3F is +63 and B6 is −74, so the true answer is +137 > 127: **overflow = YES** (89 = 1000 1001 looks negative).

> [!trap] Always say whether there is overflow, and *why* (same-sign operands, opposite-sign result), even if the question only gives the arithmetic. Don't confuse the carry-out with overflow.

## Multiplication and division [src:4 p53-58]
- **Unsigned**: like decimal long multiplication: shift and add partial products.
- **2's complement**: if the multiplier is positive, do the same (sign-extend each partial product). If the multiplier is **negative**, its MSB has weight −2<sup>N−1</sup>: split the multiplier into the MSB (negative part) and the rest (positive part). E.g. 1011 × 1101 = 1011 × (1000 + 0101): the 1000 part is done by **shift and 2's complement**, the 0101 part by **shift and sign-extension**, then add.
- Tutorial 3 check: 110101 × 1110 = (−11) × (−2) = 22 = **00 0001 0110**; 010110 × 1101 = 22 × (−3) = −66 = **11 1011 1110**. [src:tut3 Q5]
- **Division**: unsigned uses long division; for signed numbers convert to unsigned, divide, then apply the sign.

**2×2 multiplier circuit** (revision Q5): z<sub>0</sub> = x<sub>0</sub>y<sub>0</sub>, z<sub>3</sub> = x<sub>1</sub>x<sub>0</sub>y<sub>1</sub>y<sub>0</sub>, z<sub>2</sub> = x<sub>1</sub>y<sub>1</sub>(x<sub>0</sub>' + y<sub>0</sub>'), z<sub>1</sub> = x<sub>1</sub>y<sub>0</sub>(y<sub>1</sub>' + x<sub>0</sub>') + x<sub>0</sub>y<sub>1</sub>(x<sub>1</sub>' + y<sub>0</sub>'). [src:revA Q5]

## BCD addition [src:4 p59-61]
If the sum of two BCD digits is ≤ 9, BCD addition is the same as binary addition. If it is more than 9, correct it by **adding 6 (0110)** to skip the six invalid codes, and carry 1 to the next digit.

Past paper (8 marks): build a BCD digit adder from two 4-bit binary adders. [src:pp1819s2 Q2b]
- **X = C<sub>out</sub> + S<sub>3</sub>S<sub>2</sub> + S<sub>3</sub>S<sub>1</sub>** is 1 exactly when the binary sum exceeds 9: sums 10–15 have S3 = 1 and (S2 or S1) = 1; sums 16–19 set C<sub>out</sub>.
- Adder 1 adds a, b, C<sub>in</sub>. Adder 2 adds the sum to **0 X X 0** (= 6 when X = 1, else 0). The BCD digit is adder 2's sum and the BCD carry-out is X.

## Parallel addition with registers
Fig 6-9: CLEAR* clears the A register; LOAD pulses bring X then Y into the B register; TRANSFER pulses store the adder output in A, so A ends up holding X + Y. Leave enough time between LOAD and TRANSFER for the carries to settle. [src:4 p49-51]

## Fixed vs floating point (L12) [src:7 p12-16]
- **Fixed point**: the radix point sits at a fixed position. Usually used for integers only; for non-integers the drawbacks are a relatively **small range** and possible **loss of significant digits** during computation.
- **Floating point**: the machine version of scientific notation, Z = S × R<sup>E</sup>: S is the significand (a signed fractional fixed-point number), R the radix, E the exponent (a signed integer).
- **IEEE 754 single precision (32 bits)**: bit 31 = sign of the significand, bits 30–23 = exponent (8 bits), bits 22–0 = significand magnitude (23 bits). **Double (64 bits)**: bit 63 sign, bits 62–52 exponent (11 bits), bits 51–0 significand (52 bits). Radix 2; significand in sign-magnitude.

> [!slides] Slide 7 p16 says the exponent is "in 2's complement notation". Answer exam questions using the slides' description.

> [!extra] Strictly, real IEEE 754 stores the exponent with a **bias** (127 for single, 1023 for double) and an implied leading 1: value = (−1)<sup>s</sup> × 1.f × 2<sup>e−127</sup>. The slides don't go into this.
`,
  problems: ['half-adder', 'full-adder', 'ripple4', 'addsub4', 'bcd-adder', 'mult2'],
},
{
  id: 'kmap', title: 'Canonical forms & K-maps', lec: 'L7–L8', icon: '🗺️',
  blurb: 'Minterms/maxterms, SOP/POS, active levels, K-map grouping, don’t-cares, 5 variables, enable/disable.',
  sources: '[src:5] [src:6 p20-23] [src:tut4] [src:rev]',
  notes: `
## Minterms and maxterms [src:5 p5-11]
For N inputs there are 2<sup>N</sup> minterms. **Minterm m<sub>i</sub>** is the AND of all variables (complemented where the bit of *i* is 0); it is 1 only for input combination *i*. **Maxterm M<sub>i</sub>** is the OR of all variables (complemented where the bit is 1); it is 0 only for combination *i*. With inputs a b c d: m13 = abc'd and M13 = a' + b' + c + d'; m2 = a'b'cd' and M2 = a + b + c' + d.

The slides' names:
- **Canonical** form: **sum of minterms (SOm)** F = Σm(rows where F = 1), and **product of maxterms (POM)** F = ΠM(rows where F = 0).
- **Standard** (simplified) form: **SOP** and **POS**. A product term need not contain every variable, unlike a minterm. [src:5 p18-21]
- Example: F(X,Y,Z) = Σm(1,2,4,7) = ΠM(0,3,5,6). [src:5 p15-16]

> [!trap] Maxterm for row 5 (101) of A,B,C is (A' + B + C'): the complements are *inverted* compared with the minterm.

## Active-high vs active-low [src:6 p20-23; 5 p13-17]
A signal is **active high** if it produces its named effect when it is 1, **active low** (written X*, e.g. RESET*, Write*) if it does so when it is 0. **Asserted** = active high signal at 1 or active low signal at 0; **negated** otherwise. The slides link the forms to active levels: SOm goes with an active-HIGH output (F as ODD), POM with an active-LOW output (F as EVEN*). [src:5 p13; 5 p17]

**Converting a function to active-low signals** (revision Q3): Redeem = Above50·(Sunday + After5) with everything active high. With every signal active low, Redeem* = (Redeem)' and Above50* = (Above50)' etc., so by De Morgan **Redeem* = Above50* + Sunday*·After5***: Redeem* = 0 only when Above50* = 0 and either Sunday* = 0 or After5* = 0. [src:revA Q3]

## Karnaugh maps [src:5 p26-35]
Squares are labelled so that adjacent squares differ in only one variable (Gray order 00, 01, 11, 10). The slides' rules:
1. Loop 1s to get an SOP expression; each loop of 1s gives a product term.
2. Only 2<sup>n</sup> neighbouring 1s can be looped together. No looping along the diagonal. Loops may wrap round the edges (the four corners of a 4-variable map are neighbours).
3. All 1s must be looped. Use the **biggest** loops and the **fewest** loops. A square may be looped more than once.
4. 0s can be looped the same way to get a POS expression; each loop of 0s gives a sum term (write each variable complemented where the loop has a 1). [src:5 p38]

**Don't-cares (X)** [src:5 p39-46]: input conditions that never occur or whose output doesn't matter. When looping 1s (SOP), a looped X counts as 1 and an unlooped X as 0. When looping 0s (POS), a looped X counts as 0 and an unlooped X as 1. Loop an X only if it helps make a bigger loop. Different choices can give several equally minimal answers (the BCD < 6 example has five).

### Worked example (past paper, 5 marks): F(A,B,C,D) = Σ m(0,2,5,7,8,9,10,13,15), minimum POS [src:pp1819s2 Q1e]
${B.kmapHTML(['A','B','C','D'], [0,2,5,7,8,9,10,13,15])}

The zeros are m1, m3, m4, m6, m11, m12, m14. Loop them as {m1, m3}, {m4, m6, m12, m14}, {m3, m11}; each loop gives one sum term (complement the variables that are 1 in the loop):

**F = (A + B + D')(B' + D)(B + C' + D')**

(And the SOP is F = B'D' + BD + AB'C'.)

> [!exam] "Show the loops clearly": draw the map, circle each group, and label the product/sum term it produces. A correct minimal answer with unclear loops loses marks.

## Five variables
Draw two 4-variable maps, one for A = 0 and one for A = 1, and treat them as stacked layers: squares in the same position in both maps are adjacent. Revision Q8: Z = A'B'CE' + A'B'C'D' + B'D'E' + B'CD' + CDE' + BDE' simplifies to **Z = A'B'D' + B'D'E' + B'CD' + CDE' + BDE'**. [src:rev Q8; revA Q8]

## Design procedure [src:5 p47]
Specification → truth table → Boolean expression (SOP usually) → simplify (algebra, K-map or Quine–McCluskey) → implement, respecting any restriction such as "2-input NAND gates only".

## Enable / disable [src:5 p48-50]
A circuit is **enabled** when its output may respond to its inputs, **disabled/inhibited** when it may not. A disabled output is held at 0 (typically for an active-high output) or at 1 (typically for an active-low output). AND gate with enable: Y = EN·X passes X when EN = 1 and is held at 0 otherwise. Example: Open = ChildSafe·Unlock.
`,
  problems: ['alarm-system'],
},
{
  id: 'logic-families', title: 'Digital circuits: CMOS, TTL & electrical specs', lec: 'L9–L12', icon: '🔌',
  blurb: 'TTL vs CMOS, transistor-level CMOS analysis, noise margin, fan-out, power, delay, tri-state, open-drain, Schmitt trigger, PLA.',
  sources: '[src:6] [src:7 p2-11] [src:tut5]',
  notes: `
## TTL and CMOS families [src:6 p11-19]
- **TTL** uses bipolar junction transistors; **CMOS** uses MOSFETs. Series differ in power, delay and speed but not in pin layout or logic function: TTL 74, 74H, 74L, 74ALS…; CMOS 4000 (old), 74C, 74HC (pin-compatible with TTL), **74HCT** (electrically compatible with TTL).
- Supply: TTL V<sub>CC</sub> = 5 V; CMOS V<sub>DD</sub> = 3 to 18 V (5 V when mixed with TTL).
- **Floating inputs**: a floating TTL input acts like logic 1 (1.4–1.8 V) but picks up noise. A floating CMOS input is disastrous (the IC may overheat): tie every unused input to V<sub>DD</sub>, GND or another input. [src:6 p19]
- Scale of integration by number of gates: SSI < 12, MSI 12–99, LSI 100–9999, VLSI 10 000–99 999, ULSI 100 000–999 999, GSI ≥ 1 000 000. [src:6 p8]

## CMOS basics [src:6 p35-41]
- **nMOS** conducts (ON) when its gate = **1**; it connects the output toward **GND**. (Drawn without a bubble.)
- **pMOS** conducts when its gate = **0**; it connects the output toward **V<sub>DD</sub>**. (Drawn with a bubble on the gate.)
- A static CMOS gate has a **pull-up network (pMOS)** and a complementary **pull-down network (nMOS)**: for each valid input exactly one of them is ON.

| Gate | nMOS pull-down | pMOS pull-up |
|---|---|---|
| Inverter | 1 nMOS | 1 pMOS |
| NAND | **series** | **parallel** |
| NOR | **parallel** | **series** |
Source: [src:6 p38-39]

<div class="cfig" data-fig="cmos"></div>

### How to analyse a CMOS circuit (past-paper method) [src:pp1819s2 Q2d; tut5 Q3]
1. For each input combination mark each transistor ON/OFF (nMOS ON when gate=1, pMOS ON when gate=0).
2. Z = **1** if there is a conducting path from V<sub>DD</sub> to Z; Z = **0** if there is a path from Z to GND.
3. Write the truth table; list rows where Z = 0 → **canonical product of maxterms** Z = Π M(…).
4. Series = AND of conditions; parallel = OR of conditions. If the pull-down path conducts when G = 1, then Z = G'.

> [!extra] If both a path to V<sub>DD</sub> and a path to GND conduct, the output is at a bad intermediate level (short circuit); if neither conducts, Z floats. A correctly designed static CMOS gate never does either.

## Voltage parameters and noise margin [src:6 p45-48]
- V<sub>OH(min)</sub>: minimum output voltage produced for logic 1. V<sub>OL(max)</sub>: maximum output voltage produced for logic 0.
- V<sub>IH(min)</sub>: minimum input voltage recognised as logic 1. V<sub>IL(max)</sub>: maximum input voltage recognised as logic 0.
- **High-state DC noise margin** = V<sub>OH(min)</sub> − V<sub>IH(min)</sub>. **Low-state DC noise margin** = V<sub>IL(max)</sub> − V<sub>OL(max)</sub>. If a question asks for a single "noise margin", give both and say the smaller one limits the design.
- For A to drive B: is V<sub>OH</sub>(A) higher than V<sub>IH</sub>(B)? Is V<sub>OL</sub>(A) less than V<sub>IL</sub>(B)?

Typical values from the slides [src:6 p48]:

| Family | V<sub>OH</sub> | V<sub>IH</sub> | V<sub>IL</sub> | V<sub>OL</sub> | NM high | NM low |
|---|---|---|---|---|---|---|
| 5 V LSTTL | 2.7 | 2.0 | 0.8 | 0.5 | 0.7 | 0.3 |
| 5 V CMOS | 4.44 | 3.5 | 1.5 | 0.5 | 0.94 | 1.0 |

So 5 V TTL **cannot** drive 5 V CMOS directly (2.7 V < 3.5 V), while 5 V CMOS can drive TTL.

## Current parameters and fan-out [src:6 p49-50]
I<sub>IH</sub> / I<sub>IL</sub>: maximum current into an input at logic 1 / logic 0. I<sub>OH</sub> / I<sub>OL</sub>: maximum current from an output at logic 1 / logic 0 (0.02–24 mA depending on family; CMOS input leakage is tiny, about 1 µA). **Fan-out** = the number of standard loads an output can drive; more loads reduce the noise margins and the switching speed.

> [!extra] The slides define fan-out but don't write the formula. The usual calculation (used in past-paper "can A drive B / DC fan-out" questions): fan-out = min{ I<sub>OH</sub>/I<sub>IH</sub>, I<sub>OL</sub>/I<sub>IL</sub> }, rounded **down**.

## Power, speed and delay [src:6 p51-53]
- **Power dissipation**: for CMOS most power is used when the output switches: **P = CV<sup>2</sup>f**, proportional to the switching frequency and the square of the supply voltage. Static power (no switching) is usually very small.
- **Propagation delay** t<sub>PHL</sub>, t<sub>PLH</sub> (50% to 50%) and **rise/fall time** (10% to 90%): see the Boolean topic.
- Smaller delay, rise/fall time and power are better; higher switching speed is better.

## Tri-state and open-drain outputs [src:6 p54-65]
| | Tri-state | Open-drain / open-collector |
|---|---|---|
| States | 0, 1, **Hi-Z** (behaves like an open circuit) when disabled | pulls low, or is open |
| External pull-up resistor? | No | **Yes**, to make the output 1 |
| Outputs tied together | allowed, but only **one (or none)** may be enabled at a time, otherwise bus contention can damage the devices (e.g. ROM/RAM on a shared data bus) | allowed: **wired-AND**, Z = U·V·W (any output low pulls the line low) |

Open-drain outputs can also drive an LED directly. [src:6 p63]

## Schmitt-trigger input (L12) [src:7 p3-6]
Two thresholds V<sub>T−</sub> and V<sub>T+</sub>: the output switches only when the input rises above V<sub>T+</sub> or falls below V<sub>T−</sub> (**hysteresis**). With a slowly rising or noisy input a standard inverter's output fluctuates; a Schmitt-trigger inverter gives clean transitions.

## PLA (L12) [src:7 p7-11]
Programmable logic devices (PLDs) include the PLA, PAL, CPLD and FPGA. A **Programmable Logic Array** has a programmable **AND plane** that makes product terms (P1 = AB, P2 = A'B'C'D', …) feeding a programmable **OR plane** that sums them (O1 = AB + A'B'C'D', …), so several SOP functions can share product terms. X marks a programmed connection.
`,
  problems: [],
},
{
  id: 'comb-blocks', title: 'Combinational building blocks', lec: 'L13 (Lecture 07)', icon: '🧱',
  blurb: 'Design process, 7-segment decoder, decoders, multiplexers, comparators, timing diagrams.',
  sources: '[src:07] [src:08B p14-16] [src:tut6] [src:rev Q4]',
  notes: `
## Combinational design process [src:07 p5-9]
A combinational circuit is a function: each input combination always gives the same output. Two steps:
1. **Capture the function**: a truth table or equations, whichever makes sense. (Detecting three adjacent 1s in an 8-bit input would need a 256-row table, so write y = abc + bcd + cde + def + efg + fgh instead.)
2. **Convert to a circuit**: create an equation for each output (from the truth table if you used one), then a circuit for each equation.

## Seven-segment decoder [src:07 p12-15]
Maps a binary number to the segments a–g that must light: write a truth table with one column per segment, then an equation and a circuit per segment. In Verilog a **case** statement is neatest (Lab 3).

## Decoder (n → 2<sup>n</sup>) [src:07 p17-20]
Takes a binary input and gives a **one-hot** output: only the output whose position equals the input value is 1. An N-input decoder has 2<sup>N</sup> outputs (2-4, 3-8, 6-64 decoders). Internally one AND gate per output detects its input combination. **With enable e**: e = 0 → all outputs 0; e = 1 → normal.

\`\`\`verilog
module dec2to4 (input [1:0] a, input en, output reg [3:0] d);
  always @*
    if (en) d = 4'b0001 << a;   // one-hot
    else    d = 4'b0000;
endmodule
\`\`\`
The slides' Verilog version lists every input value in a \`case\` (3-to-8 decoder). [src:08B p14] Tutorial 6 Q3 (ferry ramps) uses a 2-4 decoder with enable = NOT full. [src:tut6 Q3]

> [!extra] Not on the slides but common in exams: any function of n variables = **OR of the decoder outputs** for its minterms.

## Multiplexer (n → 1) [src:07 p23-26]
Selects one of several inputs; the select input decides which is connected to the output. A 2-input mux needs a 1-bit select, a 4-input mux a 2-bit select, an **n-input mux a log<sub>2</sub>(n)-bit select**. A 4-bit 2×1 mux is four 2×1 muxes sharing one select line. 4:1 mux: **Y = S<sub>1</sub>'S<sub>0</sub>'D<sub>0</sub> + S<sub>1</sub>'S<sub>0</sub>D<sub>1</sub> + S<sub>1</sub>S<sub>0</sub>'D<sub>2</sub> + S<sub>1</sub>S<sub>0</sub>D<sub>3</sub>**.

<div class="cfig" data-fig="mux2"></div>

### Tutorial 6 Q1 (mux with constants) [src:tut6 Q1]
Inputs: D3 = b, D2 = a, D1 = 1, D0 = 0, selects s1 s0: **f = s1'·s0 + s1·s0'·a + s1·s0·b**.

> [!extra] **A mux implements any function**: put n−1 of the variables on the selects; each data input is then 0, 1, the remaining variable or its complement. E.g. F = Σm(1,2,6,7) with S1=A, S0=B → D0 = C, D1 = C', D2 = 0, D3 = 1. (Past papers have asked for a design "with a 4:1 mux and an inverter".)

## Comparators
XOR is a bit-wise comparator: 1 when the bits differ. [src:3 p58] So XNOR is 1 when they are equal, and **equality of two numbers is the AND of bitwise XNORs**.

> [!exam] Revision Q4 (NASA fuel tank): the green light G is on when ABC = XYZ: **G = (A⊙X)(B⊙Y)(C⊙Z)**. A red light R must turn on when the pressure rises **above 600 psi**, and the LSB of XYZ is worth 100 psi. The official answer takes XYZ = 110 as 600–699 psi and 111 as 700–799 psi, so **R = XY**. [src:revA Q4]

> [!extra] Encoders and priority encoders (2<sup>n</sup> one-hot inputs → n-bit code, plus a *valid* output) are not in the SC1005 slides. They appear here only as Verilog practice.

## Timing diagrams [src:07 p28]
A timing diagram shows inputs changing over time and the resulting outputs; the output at any instant is found from the input values at that instant. (Lecture 09 adds the propagation delay.)

## Checklist for a design question
1. Define inputs/outputs and active levels. 2. Truth table or equation. 3. K-map each output. 4. Gates, or a mux/decoder. 5. **Verify with a few rows.**
`,
  problems: ['mux4-case', 'dec24-case', 'dec24-ferry', 'prienc42', 'comparator4', 'seg7'],
},
{
  id: 'verilog-comb', title: 'Verilog for combinational circuits', lec: 'L14–L16 (Lectures 08A, 08B)', icon: '💻',
  blurb: 'Modules, primitives, wires vs regs, assign, vectors, literals, parameters, always @*, if/case, latches, bugs to spot.',
  sources: '[src:08A] [src:08B] [src:13 p2-14] [src:tut6] [src:tut7]',
  notes: `
## The mindset
**Think in hardware.** Verilog describes a circuit made of blocks, not a program executed in order. Each statement describes a piece of hardware; the order of gate instances and \`assign\` statements doesn't matter. [src:13 p2; 08A p24]

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
- **Ports** \`input\`/\`output\` act like wires: you can read any port but only write outputs. Ports of the same direction can share one declaration. [src:08A p8-9; 08A p19; 13 p3]
- **Gate primitives**: \`and, nand, or, nor, not, xor, xnor\`. The single **output is always the first argument**; more than two inputs are allowed: \`or (z, a, b, c, d);\` A gate name (g1) is optional. [src:08A p14-18]
- **wire**: a named connection. 1-bit wires used in instantiations need not be declared; the tools infer them. [src:08A p16; 08A p25]
- **reg**: signals assigned **inside an always block must be declared reg**. A reg cannot be assigned by \`assign\` or connected to a module instance's output. Declare an output as \`output reg\` to assign it in an always block. *reg doesn't mean a register*: in \`always @*\` it is just combinational logic. [src:08B p7-8; 13 p3]
- Verilog is **case-sensitive**; statements end with \`;\`; comments are \`//\` and \`/* */\` (not nestable); identifiers start with a letter or _. [src:08A p26]

## Vectors and literals [src:08A p45-54]
- \`wire [7:0] d;\` MSB has the higher index, LSB is 0. Bit-select \`d[2]\`, part-select \`d[4:3]\`.
- **Widths should match**: Verilog lets you do bad things silently, so check synthesis warnings. [src:08A p49]
- Literals \`<size>'<radix><value>\`: \`4'b0000\`, \`8'h4F\`, \`8'b0100_1111\` (underscores for readability). A literal assigned to a **wider** signal is **zero-padded at the MSB**; to a **narrower** signal it is **truncated at the MSB** (\`wire [3:0] x = 6'b110011\` gives 0011). [src:08A p51-52]
- Concatenation \`{a, b}\`; replication \`{4{a[3]}}\`, e.g. sign extension \`{{4{a[3]}}, a[3:0]}\`. [src:08A p53-54]

## Operators
| Type | Operators | Source |
|---|---|---|
| Logical | \`&& || !\` | [src:08A p38] |
| Bitwise | \`& | ~ ^\` (and \`~|\` for NOR) | [src:08A p38; 08A p41] |
| Arithmetic | \`+ - * /\` (division is not generally synthesizable) | [src:08A p43] |
| Compare | \`< <= > >= == !=\` (true = 1, false = 0) | [src:08A p43] |
| Conditional | \`sel ? x1 : x0\` (a multiplexer) | [src:08A p42; 13 p10-11] |

> [!extra] Also valid Verilog but not on the slides: reduction operators (\`&x |x ^x\` reduce a vector to 1 bit; \`^x\` is its parity) and shifts (\`<< >>\`). Unsized literals are 32 bits.

> [!trap] \`&\` is bitwise (vector result); \`&&\` is logical (1-bit). \`~\` inverts every bit; \`!\` gives 1 bit.

## Three ways to describe the same circuit [src:08A p37-39; 08B p9]
\`\`\`verilog
// 1) gate level (structural)
and a1 (w1, a, b);  or o1 (y, w1, c);
// 2) continuous assignment (dataflow)
assign y = (a & b) | c;
// 3) behavioural
always @* if (c) y = 1; else y = a & b;     // y must be 'reg'
\`\`\`
All \`assign\` statements happen concurrently. Assignments in an \`always @*\` block synthesise exactly the same circuit as the equivalent \`assign\`s.

## always @* rules [src:08B p4-6; 08B p19-25]
- The sensitivity list must contain **every signal that affects the outputs**; leaving one out (\`always @(a, b)\` when the block also reads c) gives the wrong circuit. Use \`always @*\`.
- Use **blocking** \`=\` in combinational always blocks; there, statement order matters and **the last assignment to a signal wins**. [src:10 p13; 08B p20]
- Never use \`assign\` inside an always block. Use \`begin … end\` around more than one statement. [src:08B p6; 08B p11]
- **Assign every output in every path**; otherwise the signal must keep its value: a **latch**. Fix it with a default assignment at the top of the block, or an \`else\` / \`default\` for every branch. [src:08B p22-25]
- A signal assigned in an always block must **never** be assigned anywhere else (another always block or an \`assign\`). Separate always blocks run concurrently, so their order doesn't matter. [src:08B p19; 08B p21]

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
No \`break\` is needed between case items. [src:08B p13]

> [!extra] \`casez\` treats \`?\`/\`z\` bits in case labels as don't-care, handy for priority encoders (\`4'b1???: y = 2'd3;\`). It is not in the slides.

## Module instantiation and parameters [src:08A p29-34; 08A p56-58; 13 p7]
\`\`\`verilog
module top (input [1:0] sel, input full, output [3:0] queue);
  dec2to4 u1 (.a(sel), .en(~full), .d(queue));   // named connection (preferred)
endmodule

module thermo #(parameter W = 8) (input [W-1:0] Tset, Tact, output Hon, Con);
  ...
endmodule
thermo #(.W(12)) U1 (.Tset(Tset), .Tact(Tact), .Hon(Hon), .Con(Con));   // redefine the width
\`\`\`
**Ordered** instantiation (\`add_half M1 (A, B, w1, w2);\`) connects by position, which breaks if the port order changes, so the slides prefer **named** connections \`.port(signal)\`. Tutorial 7 Q2 asks exactly for the parameterised thermostat. [src:tut7 Q2]

## Find-the-bugs (Tutorial 7 Q3) [src:tut7 Q3]
\`module thingamajig\` has \`output [5:0] result\`, \`always @ (a,b)\`, a \`case\` on sel with three items, and \`endmodule;\`. The errors:
1. \`result\` is assigned in an always block but is not declared **reg**.
2. The sensitivity list is incomplete (\`c\` and \`sel\` are missing) → use \`@*\`.
3. The \`case\` has no \`default\` (sel = 2'b11 is not covered) → a **latch** is inferred.
4. Stray semicolon after \`endmodule\`.

(The 4-bit inputs are zero-padded into the 6-bit \`result\`. That is legal, just worth noticing.) Part (b) wants the whole thing as one conditional assignment: \`assign result = (sel == 2'b00) ? a : (sel == 2'b01) ? b : (sel == 2'b10) ? c : 6'd0;\`

Other things to look for: two drivers on one signal, \`<=\` in combinational code.

> [!tip] This site's Playground lists these as warnings: latch inferred, incomplete sensitivity list, multiple drivers, wire assigned in always.
`,
  problems: ['half-adder', 'mux2-assign', 'mux4-case', 'dec24-ferry', 'prienc42', 'parity', 'thermo', 'max3', 'bugfix-comb', 'gray4'],
},
{
  id: 'latches-ff', title: 'Latches, flip-flops & timing', lec: 'L17–L18 (Lecture 09)', icon: '🔒',
  blurb: 'SR/D latches, propagation delay and clocks, edge-triggered flip-flops, registers, timing diagrams.',
  sources: '[src:09] [src:tut8]',
  notes: `
## Combinational vs sequential [src:09 p2-3]
Combinational: output = f(present inputs). **Sequential**: the output depends on the current inputs **and previous inputs**; the circuit has **state** (memory).

## SR latch [src:09 p6-12]
The most basic circuit for storing a bit (e.g. a flight-attendant call light: Call → S, Cancel → R).

| S | R | Q<sup>+</sup> | Function |
|---|---|---|---|
| 0 | 0 | Q | store |
| 0 | 1 | 0 | reset |
| 1 | 0 | 1 | set |
| 1 | 1 | – | **undefined** |

If S and R are both 1 and then both de-asserted at the same time, the output may **oscillate**; one gate is usually a little faster, so it settles, but which way is impossible to know. [src:09 p8]

<div class="cfig" data-fig="sr-latch"></div>

**Enabled (gated) SR latch**: responds to S and R only while E is high (level-sensitive), so glitches while E is low don't matter. [src:09 p11]

<div class="cfig" data-fig="sr-enabled"></div>

**D latch (transparent latch)**: an inverter makes R = S', so the invalid input is impossible. While enable is high, Q follows D (transparent); while enable is low, Q holds. [src:09 p13-15] Active-low versions use NAND instead of NOR. [src:09 p16]

<div class="cfig" data-fig="d-latch"></div>

## Propagation delay and the clock [src:09 p18-22]
- A gate's output changes a short time after its input: the **propagation delay**. The delay through a circuit is the sum of the gate delays along a path. It can differ per input-output pair; if you report one number, use the **worst (longest) path**.
- The **clock** toggles between 0 and 1 at a fixed rate. Period = one complete cycle; **frequency = 1/period**: 10 ns → 100 MHz, 1 ns → 1 GHz, 4 ns → 250 MHz.

<div class="cfig" data-fig="clock"></div>

## Edge-triggered flip-flops [src:09 p24-33]
With a chain of transparent latches, how far the input travels in one clock phase depends on how long the clock is high. A **flip-flop** fixes this: it changes its output only at a clock **edge**.
- Built **master–slave** from two D latches: the master is enabled while the clock is low, the slave while it is high, so Q only changes at the rising edge. [src:09 p27-29]
- **Course convention**: *latch* = level-sensitive, *flip-flop* = edge-triggered, and flip-flops are **positive-edge-triggered unless stated**. Edge-triggered symbols have a small triangle on the clock input. [src:09 p32]
- **D flip-flop**: Q takes the value of D at the rising edge.
- **JK flip-flop**: Q becomes 1 if J is asserted at the rising edge, 0 if K is asserted, and **toggles** if both are. **T flip-flop**: toggles at the rising edge if T = 1. [src:09 p33]

<div class="cfig" data-fig="dff-ms"></div>


<div class="cfig" data-fig="ff-symbols"></div>


<div class="cfig" data-fig="ff-step"></div>

> [!extra] Characteristic equations (not written on the slides): D: Q<sup>+</sup> = D. JK: Q<sup>+</sup> = JQ' + K'Q. T: Q<sup>+</sup> = T ⊕ Q.

> [!key] **Latch vs flip-flop**: in a timing diagram, a D latch output changes at *any* time D changes while EN = 1; a D flip-flop output changes only at a rising clock edge and takes the value D had **just before** the edge. [src:09 p30-31]

<div class="cfig" data-fig="latch-vs-ff"></div>

## Completing timing diagrams (Tutorial 8 Q2) [src:tut8 Q2]
The tutorial drives an SR latch (no enable), an enabled SR latch, an enabled D latch, a JK flip-flop and a D flip-flop from the same clk/in1/in2 waveforms.
1. Draw vertical lines at every rising clock edge.
2. D flip-flop: at each edge Q becomes D (as it was just before the edge); between edges it holds.
3. Latch: while enable is high Q follows D; when enable falls Q freezes.
4. SR latch with S = R = 1 then released together: **shade the output as undefined**.
5. JK: apply the J, K rules at each edge.

## Registers [src:09 p36-38]
A **register** = several D flip-flops sharing a clock, storing a multi-bit value; even a 1-bit value is stored in a "register". In timing diagrams you can show a register's value as a number (say if it is decimal or hex); it changes only at rising edges.

A **shift register / FIFO** chains registers: stage *i*'s output feeds stage *i*+1. [src:10 p24-29; 10 p41] Tutorial 8 Q3: a FIFO of 4-bit registers with a bitwise inversion in the middle; the output is the input delayed by the number of stages, with every bit inverted. Track each register's value after every edge. [src:tut8 Q3]

> [!extra] Setup time (D stable *before* the edge), hold time (D stable *after* the edge), metastability, and the minimum clock period t<sub>clk→Q</sub> + t<sub>logic</sub> + t<sub>setup</sub> are standard ideas but are **not in the SC1005 slides**.
`,
  problems: ['dff-sync', 'dff-async'],
},
{
  id: 'seq-verilog', title: 'Sequential circuits in Verilog', lec: 'L19–L20 (Lecture 10)', icon: '⏱️',
  blurb: 'Clocked always blocks, reset, non-blocking assignment, counters, shift registers, FIFOs, predicting waveforms.',
  sources: '[src:10] [src:13 p15-19] [src:tut9]',
  notes: `
## The template [src:10 p4-10]
\`\`\`verilog
module simplereg (input [7:0] d, input clk, rst, output reg [7:0] q);
  always @(posedge clk) begin      // synchronous: happens at the rising edge only
    if (rst) q <= 8'b0000_0000;    // synchronous reset
    else     q <= d;
  end
endmodule
\`\`\`
- \`always @(posedge clk)\` makes a register/D flip-flop. For falling-edge use \`@(negedge clk)\`. All synchronous blocks should use the same clock. [src:10 p5-6]
- **Synchronous reset**: at a rising edge, if reset is asserted, load the reset value. **Asynchronous reset**: whenever reset is asserted; add it to the sensitivity list: \`always @(posedge clk or posedge rst)\`. The slides say modern FPGA design uses **synchronous** reset and every synchronous component should have one. [src:10 p7-10]
- Active-low reset: \`if (!rst) q <= 0; else …\` [src:10 p9]

**Each assignment in a synchronous always block results in a register** (its D input driven by the logic on the right-hand side). Unconnected registers can still share one always block. [src:10 p11-12; 10 p47]

| | Combinational | Synchronous |
|---|---|---|
| Sensitivity | signal list or \`*\` | \`(posedge clk)\` |
| Assignment | blocking \`=\` | non-blocking \`<=\` |
| Each assignment is… | a wire driven by logic | a register |
Source: [src:13 p19]

## Why non-blocking? [src:10 p13; 10 p26; 10 p50]
The slides' rule: in combinational blocks always use **blocking** \`=\` (order matters); in synchronous blocks always use **non-blocking** \`<=\` (order does **not** matter). When reading synchronous code, the right-hand sides are the values **just before** the rising edge and the left-hand sides update **just after** it. So \`q1 <= y; q2 <= q1; q3 <= q2; q <= q3;\` is a 4-stage shift register in any statement order, and an input takes 4 clock cycles to reach q.

<div class="cfig" data-fig="shift-reg"></div>

> [!extra] If the same lines used blocking \`=\` in a clocked block, each line would see the value just written above it, so all stages would get y at the same edge: no longer a shift register.

## Predicting behaviour (past paper, 13 marks) [src:pp1819s2 Q4a]
\`C <= B; B <= A; A <= A ^ ~(B ^ C);\` with rst = 0 and A = B = C = 0 at the start (as drawn in Figure Q4b). At each rising edge compute the *new* A, B, C from the **old** A, B, C:

| edge | A B C (before) | new C = B | new B = A | new A = A⊕~(B⊕C) | A B C (after) |
|---|---|---|---|---|---|
| 1 | 0 0 0 | 0 | 0 | 0⊕~0 = 0⊕1 = **1** | 1 0 0 |
| 2 | 1 0 0 | 0 | 1 | 1⊕~0 = 1⊕1 = **0** | 0 1 0 |
| 3 | 0 1 0 | 1 | 0 | 0⊕~(1⊕0) = 0⊕0 = **0** | 0 0 1 |
| 4 | 0 0 1 | 0 | 0 | 0⊕~(0⊕1) = 0 | 0 0 0 |

Outputs change just *after* each rising edge. Part (i) asks for the circuit: three D flip-flops, with D<sub>A</sub> = A XNOR (B XOR C), D<sub>B</sub> = Q<sub>A</sub>, D<sub>C</sub> = Q<sub>B</sub>. Use **Playground → Step mode** to check your hand-drawn waveform.

## Counters [src:10 p16-22]
\`\`\`verilog
always @(posedge clk)
  if (rst)       q <= 4'b0000;
  else if (load) q <= cnt_in;           // load a custom value
  else if (down) q <= q - 1'b1;          // up/down counter
  else           q <= q + 1'b1;
\`\`\`
Inside the block, q on the right-hand side is the **old** value. Tutorial 9 Q3: (a) a 5-bit counter that counts to 20 then wraps to 0 (\`if (q == 5'd20) q <= 0; else q <= q + 1;\`); (b) wrap at an input \`countmax\` instead; (c) a 6-bit down counter loaded from \`start_val\` on reset. [src:tut9 Q3] An n-bit counter wraps by itself after 2<sup>n</sup> states.

## Shift registers, serial transfer, FIFOs, memories
- Shift register with a vector: \`q[0] <= y; q[4:1] <= q[3:0];\` and \`assign q_out = q[4];\` Add \`if (sh)\` to shift only sometimes, \`rt\` for direction, \`ld\` to load a whole word. [src:10 p27-33]
- **Parallel-to-serial** (load, then shift out one bit per clock) and **serial-to-parallel** converters. [src:10 p35-40]
- **FIFO**: a shift register whose stages are multi-bit registers. [src:10 p41]
- **Memory**: an array of registers; a decoder on the address enables one register when **we** (write enable) is asserted, and a mux on the address selects the one to read. [src:10 p42-46]

## Registers between stages (Tutorial 9 Q1b) [src:tut9 Q1; 10 p48-49; 13 p18]
A register after each combinational stage delays the result by one clock per register. In the recap example \`always @(posedge clk) begin z <= x; r <= z*z; end\` with \`x = a + b\` combinational, a new a, b takes **two** clock edges to reach r.

## Common errors
- Assigning one signal from more than one place (two always blocks, or an always block and an \`assign\`). [src:10 p50; 13 p20]
- Forgetting the reset. [src:10 p7]
- Mixing \`=\` and \`<=\` in one block; using \`=\` for registers.
- Tutorial 9 Q1a: a counter that does not behave as intended; read the code against these rules. [src:tut9 Q1]
`,
  problems: ['dff-sync', 'dff-async', 'reg-en', 'cnt3', 'cnt20', 'cnt-max', 'cnt-down', 'updown', 'shift4', 'johnson', 'monitor-alarm'],
},
{
  id: 'fsm', title: 'Finite state machines', lec: 'L21–L22 (Lectures 11, 12)', icon: '🚦',
  blurb: 'State diagrams and tables, Moore vs Mealy, state merging, encoding, next-state and output equations, D flip-flop implementation.',
  sources: '[src:11] [src:12 p2-17] [src:tut10]',
  notes: `
## What an FSM is [src:11 p12-13; 12 p2-4]
A finite number of states and the transitions between them. In synchronous design the FSM stays in one state for each clock cycle; at every rising edge it may move to another state depending on the inputs at that edge. Hardware: a **state register** + **next-state logic** + **output logic**.
- **Moore**: outputs depend on the **state only**; written inside (or beside) the state bubbles, with a legend. [src:11 p14-16; 11 p35]
- **Mealy**: outputs depend on the **state and the current inputs**, so they can change mid-state when an input changes. Written on the arrows after a slash (input/output). A little harder to design and analyse, but can be more compact. [src:11 p35-36]

<div class="cfig" data-fig="fsm-structure"></div>

For *m* states the state register needs **⌈log<sub>2</sub> m⌉** bits. [src:12 p5]

## Reading and drawing a state diagram [src:11 p4-9]
- A circle = a state; an arrow = a transition; the condition on the arrow says when it happens.
- **Conditions not shown result in self-transitions** (the slides' convention to keep diagrams simple): if no outgoing arrow matches the inputs, the FSM stays where it is. [src:11 p7]
- With several inputs, use a **legend** (e.g. "10" means en = 1, dn = 0). [src:11 p9]
- Make sure the conditions on different arrows leaving a state can't be true at the same time (the door-lock example adds b'g' etc. so that pressing every button at once doesn't unlock). [src:11 p25]
- Always define a **reset** state. [src:12 p17]

## Design procedure [src:12 p14]
1. Draw the **state transition diagram** using names for the states.
2. Construct the state transition table using names (optional).
3. **Encode** the states (any encoding works as long as each state is unique; different encodings give different circuits but identical behaviour).
4. Write the state transition table with the encoded states.
5. Determine the logic equations for the next-state bits and the outputs (**K-maps**).
6. Implement the circuit: D flip-flops with D<sub>i</sub> = next-state bit i, plus gates.

### Worked example (lecture): off → on1 → on2 → on3 → off [src:11 p17-19; 12 p7-12]
Input *b* starts the sequence from off; output x = 1 in on1, on2, on3. Encoding off=00, on1=01, on2=10, on3=11.
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

**x = s1 + s0, n1 = s1'·s0 + s1·s0' = s1 ⊕ s0, n0 = s1'·s0'·b + s1·s0'** (exactly the slide's equations). Circuit: 2 D flip-flops with D1 = n1, D0 = n0. [src:12 p11-12]

> [!exam] Typical 12-mark question: given a state diagram, (i) state table (ii) minimal SOP next-state/output equations (iii) circuit with D flip-flops. Practise under time: **Drill → FSM**.

## Simplifying: merging equivalent states [src:11 p26-33]
In the vending machine ($1.50 drink, $1 and 50c coins, outputs vend and change), several states have the same credit and react identically to every future input, so they can be **merged** by redrawing the arrows into one state.

## Sequence detector example (Tutorial 10) [src:tut10 Q1]
Output 1 from the second consecutive 1, and stay 1 until two consecutive 0s. Moore states: **S0** (idle, out 0), **S1** (saw one 1, out 0), **S2** (out 1), **S3** (out 1, saw one 0). Transitions: S0 –1→ S1; S0 –0→ S0; S1 –1→ S2; S1 –0→ S0; S2 –1→ S2; S2 –0→ S3; S3 –1→ S2; S3 –0→ S0.

<div class="cfig" data-fig="tut10-fsm"></div>

Part (c), input 0,1,0,1,1,0,1,1,0,0,0,1,0,1,1 → state after each: S0 S1 S0 S1 S2 S3 S2 S2 S3 S0 S0 S1 S0 S1 S2 → outputs 0,0,0,0,1,1,1,1,1,0,0,0,0,0,1.

> [!extra] One-hot encoding (one flip-flop per state) is a common alternative; the slides use binary encoding.
`,
  problems: ['fsm-seq', 'moore-1011', 'traffic'],
},
{
  id: 'fsm-verilog', title: 'FSMs in Verilog', lec: 'L22–L23 (Lectures 12, 13)', icon: '🤖',
  blurb: 'Three-part structure, parameter state names, default next state, Moore vs Mealy outputs, assign-only version.',
  sources: '[src:12] [src:13] [src:tut10]',
  notes: `
## Standard structure (memorise) [src:12 p19-30]
\`\`\`verilog
module detector (input clk, rst, in, output out);
  parameter S0 = 2'b00, S1 = 2'b01, S2 = 2'b10, S3 = 2'b11;   // state names
  reg [1:0] st, nst;                                          // current and next state

  // 1. state register: always the same structure
  always @(posedge clk)
    if (rst) st <= S0;
    else     st <= nst;

  // 2. next-state logic (combinational)
  always @* begin
    nst = st;                           // default: stay (also avoids latches)
    case (st)
      S0: if (in)  nst = S1;
      S1: if (in)  nst = S2; else nst = S0;
      S2: if (!in) nst = S3;
      S3: if (in)  nst = S2; else nst = S0;
      default: nst = S0;                // invalid states go to the initial state
    endcase
  end

  // 3. output logic
  assign out = (st == S2) || (st == S3);     // Moore: state only
endmodule
\`\`\`
For a **Mealy** machine the output expression also uses the input, e.g. \`assign out = (st == S1) & in;\`

## Rules from the slides [src:12 p17; 12 p21-33]
- Name the states with **\`parameter\`** constants (the slides' choice; \`localparam\` also works) so the code never deals with raw binary values.
- Both \`st\` and \`nst\` are \`reg\` because both are assigned in always blocks.
- **Keep the state register separate**: a simple block that copies next state to current state at each clock edge, with **reset to a valid state**. Writing the whole FSM in one synchronous always block is possible but harder to verify.
- Next-state block: \`always @*\`, blocking \`=\`, a **default assignment at the top** (\`nst = st;\`), next state assigned in every case, and a \`default\` case that sends invalid states back to the initial state. Reset matters most when the number of states isn't a power of two.
- Output: a separate \`assign\` (or always block), or combined into the next-state block with a default (\`u = 1'b0;\`), in which case the output port must be \`reg\`.

## Assign-only version (Tutorial 10 b) [src:12 p15-16; tut10 Q1]
Encode the states, derive the next-state and output equations with K-maps, then write one \`assign\` per equation plus the state-register block. The lecture's pulse3 module:
\`\`\`verilog
module pulse3 (input b, input clk, rst, output x);
  wire n1, n0;  reg s1, s0;
  assign n1 = s1 ^ s0;
  assign n0 = (~s1 & ~s0 & b) | (s1 & ~s0);
  assign x  = s1 | s0;
  always @(posedge clk)
    if (rst) begin s1 <= 1'b0; s0 <= 1'b0; end
    else     begin s1 <= n1;   s0 <= n0;   end
endmodule
\`\`\`

## Verilog ⇆ diagram
Read \`always @*\` + \`case\`: each \`case\` item is a circle; each \`if\` is an arrow with its condition; a missing \`else\` is a self-loop (from the \`nst = st\` default). Draw the diagram **before** writing code.

## Recap: what Lecture 13 says to take away [src:13 p19-21]
Think in hardware blocks, not instructions; if you can't picture the circuit it probably won't work; keep it simple and split things up. Combinational always: \`*\`, blocking, each assignment is logic. Synchronous always: \`posedge clk\`, non-blocking, each assignment is a register. Each signal is assigned from one place only.

> [!extra] **Testbenches** are not examined: Lecture 13 lists "simulation and verification" as not covered. [src:13 p21] They are still the easiest way to check your FSM here:
> \`\`\`verilog
> module tb;
>   reg clk = 0, rst = 1, in = 0; wire out;
>   detector dut (.clk(clk), .rst(rst), .in(in), .out(out));
>   always #5 clk = ~clk;                         // period 10
>   initial begin
>     #12 rst = 0;
>     in = 0; #10 in = 1; #10 in = 0; #10 in = 1; #10 in = 1; #10 in = 0;
>     #20 $finish;
>   end
>   initial $monitor("t=%0t in=%b out=%b", $time, in, out);
> endmodule
> \`\`\`
> Paste it into the **Playground**: the waveform viewer shows clk, in, state and out together.
`,
  problems: ['fsm-seq', 'moore-1011', 'traffic'],
},
];
