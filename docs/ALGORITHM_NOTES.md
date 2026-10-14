# Classical Cryptography Algorithm Notes & Cryptanalysis

This document details the mathematical formulations, specifications, implementations, and cryptanalytic vulnerabilities of the four classical ciphers integrated into **CipherMail**.

---

## 1. Caesar Shift Cipher

### Mathematical Formulation
The Caesar cipher is a monoalphabetic substitution cipher over the alphabet ring $\mathbb{Z}_{26}$:
- **Encryption**:
  $$C_i = (P_i + k) \pmod{26}$$
- **Decryption**:
  $$P_i = (C_i - k + 26) \pmod{26}$$
where $P_i, C_i \in \{0, 1, \dots, 25\}$ map to $\{A, B, \dots, Z\}$ and $k \in \{0, \dots, 25\}$.

### Implementation Conventions in CipherMail
- Preserves letter casing: lowercase letters shift across `'a'`–`'z'` and uppercase across `'A'`–`'Z'`.
- Preserves spaces, punctuation, symbols, and digits without alteration.
- **Round-Trip Guarantee**: Exact, 100% lossless round-trip reconstruction.

### Cryptanalysis & Weaknesses
- **Keyspace**: Trivially small ($|\mathcal{K}| = 26$). Can be brute-forced manually in seconds.
- **Frequency Analysis**: Single-letter frequency distribution is completely preserved and shifted by $k$. Comparing the most frequent ciphertext letter to the English letter 'E' immediately discloses $k$.

---

## 2. Playfair 5×5 Matrix Cipher

### Structural Specification
Invented by Charles Wheatstone in 1854 and popularized by Lord Playfair:
1. **Key Matrix**: A 5×5 grid constructed by filling unique letters of a keyword followed by unused letters of the alphabet. `'I'` and `'J'` are merged into one cell.
2. **Digraph Preprocessing**:
   - Text is normalized to uppercase A–Z.
   - Letters are grouped into pairs (digraphs).
   - If adjacent letters in a pair are identical (e.g. `LL`), a null filler letter (`X`, or `Q` if the letter is `X`) is inserted between them.
   - If the final string has odd length, it is padded with `X` (or `Z`).
3. **Encryption Rules for Pair $(c_1, c_2)$**:
   - **Same Row**: Shift each letter one position to the right (wrapping around to left).
   - **Same Column**: Shift each letter one position down (wrapping around to top).
   - **Rectangle**: Form a rectangle and swap column coordinates (horizontal corners).

### Normalization Caveat & Ambiguity
- **Lossy Formatting**: Original sentence casing, spaces, digits, and punctuation marks are removed during digraph preparation.
- **I / J Merging**: 'J' becomes 'I' and cannot be uniquely distinguished without context.
- **Padding Artifacts**: Appended 'X' padding remains in the reconstructed digraph stream.
- **Conclusion**: CipherMail guarantees exact reconstruction of the *normalized digraph stream*, but clearly documents that formatting cannot be automatically restored.

### Cryptanalysis & Weaknesses
- Although it flattens the unigram frequency distribution, digraph frequency analysis can break Playfair. In English, digraphs like `TH`, `HE`, `IN`, `ER`, and `AN` exhibit pronounced statistical peaks.

---

## 3. Rail Fence Cipher (Zigzag Transposition)

### Geometric Formulation
The Rail Fence cipher is a transposition technique where plaintext characters are written diagonally downward and upward along $k$ horizontal rails ($k \ge 2$), and then read sequentially row by row.

For $k = 3$ and plaintext `"CIPHERMAIL"`:
```
Rail 0: C . . . E . . . I .
Rail 1: . I . H . R . A . L
Rail 2: . . P . . . M . . .
```
Ciphertext: `CEI` + `IHRAL` + `PM` = `"CEIIHRALPM"`

### Implementation Conventions in CipherMail
- Preserves **all characters**: casing, spaces, punctuation, and numbers.
- Calculated exact cycle length: $T = 2(k - 1)$.
- **Round-Trip Guarantee**: Exact, 100% lossless round-trip reconstruction.

### Cryptanalysis & Weaknesses
- **Unigram Frequencies**: Preserved identically (e.g., character counts remain unchanged).
- **Small Keyspace**: In typical messages, the depth $k$ is an integer between 2 and the message length $N$, easily exhaustible via automated anagramming.

---

## 4. Row-Columnar Transposition Cipher

### Permutation Matrix Formulation
1. A keyword of length $W$ defines the matrix width.
2. The keyword characters are ranked in alphabetical order (with duplicate character ties broken by original left-to-right position).
3. Plaintext is written into the matrix row by row.
4. Ciphertext is read off column by column according to the alphabetical rank order.

Example with Key `"ZEBRA"` (Ranks: Z=5, E=2, B=1, R=4, A=0):
```
Columns:  Z  E  B  R  A
Rank:     4  2  1  3  0
Row 0:    S  E  C  U  R
Row 1:    E  M  A  I  L
```
Columns read in rank order (0, 1, 2, 3, 4): `RL` + `CA` + `EM` + `UI` + `SE`.

### Implementation Conventions in CipherMail
- Correctly accommodates incomplete final rows without artificial padding.
- Preserves all whitespace, special characters, casing, and punctuation.
- **Round-Trip Guarantee**: Exact, 100% lossless round-trip reconstruction.

### Cryptanalysis & Weaknesses
- Character frequencies remain invariant.
- Can be solved by testing possible column lengths (factors of total length) and matching common English bigrams (`TH`, `HE`, `QU`) across candidate column juxtapositions.
