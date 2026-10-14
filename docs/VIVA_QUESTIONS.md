# Information Security Lab Viva Questions & Model Answers

This comprehensive guide prepares students for college lab viva examinations, technical demonstrations, and oral evaluations for the **CipherMail** project.

---

### Category 1: Classical Cryptography & Mathematical Foundations

#### Q1: What is the primary difference between a Substitution cipher and a Transposition cipher?
**Answer:**
- In a **Substitution cipher** (e.g. Caesar, Playfair), the identities of characters are replaced by other characters or symbols, but their positions in the sequence remain the same. Substitution achieves Claude Shannon's property of **Confusion**.
- In a **Transposition cipher** (e.g. Rail Fence, Columnar Transposition), the identities of the characters are unchanged, but their relative positions are scrambled (permuted). Transposition achieves Shannon's property of **Diffusion**.

#### Q2: How does the Caesar cipher work mathematically?
**Answer:**
The Caesar cipher maps each character $p$ in alphabet $\mathbb{Z}_{26}$ (where A=0, B=1, ..., Z=25) by an integer shift $k \in \{0, \dots, 25\}$:
$$\text{Encryption: } c = (p + k) \pmod{26}$$
$$\text{Decryption: } p = (c - k + 26) \pmod{26}$$
Because $26 = 2 \times 13$, the keyspace is trivially small ($|\mathcal{K}| = 26$), making exhaustive brute-force attack trivial.

#### Q3: How is a Playfair 5×5 matrix constructed, and why are I and J combined?
**Answer:**
A 5×5 matrix contains $5 \times 5 = 25$ cells. Since the English alphabet has 26 letters, one letter must be eliminated or merged. Traditionally, 'I' and 'J' are merged into the same cell. The matrix is populated by writing unique letters of the key phrase, followed by remaining alphabet letters in sequence.

#### Q4: What are the three encryption rules for digraphs in Playfair?
**Answer:**
For each pair of letters $(c_1, c_2)$:
1. **Same row**: Shift each letter one cell to the right (wrap to start of row).
2. **Same column**: Shift each letter one cell down (wrap to top of column).
3. **Rectangle**: Replace each letter with the character in its own row and the other letter's column.

#### Q5: Why is Playfair's plaintext reconstruction considered lossy?
**Answer:**
During preparation, text is normalized to uppercase, non-alphabetic characters (spaces, punctuation, digits) are stripped, identical adjacent letters are separated with 'X' or 'Q', and odd-length texts are padded with 'X'. When deciphered, the output is the normalized digraph stream; original spacing and casing cannot be reconstructed without external context.

#### Q6: How does the Rail Fence cipher determine character placement?
**Answer:**
Characters are written diagonally down and up across $k$ rails. The trajectory oscillates in a zigzag pattern with a period of:
$$T = 2(k - 1)$$
Characters on rail 0 and rail $k-1$ appear once per period, while intermediate rails have two characters per period. The ciphertext is formed by reading off rail 0, then rail 1, through rail $k-1$.

#### Q7: How does Row-Columnar Transposition break keyword ties?
**Answer:**
When duplicate characters appear in the keyword (e.g. "BANANA"), ties are broken in a stable left-to-right order. The first 'A' receives rank 0, the second 'A' rank 1, and the third 'A' rank 2.

---

### Category 2: Cryptanalysis & Security

#### Q8: What is Frequency Analysis, and which ciphers are vulnerable to it?
**Answer:**
Frequency analysis examines the statistical frequency of letters in a ciphertext. In natural English, 'E' occurs ~12.7%, followed by 'T', 'A', 'O', 'I', 'N'.
- **Caesar**: Highly vulnerable. The most frequent ciphertext letter directly reveals the shift $k$.
- **Rail Fence & Columnar**: Letter frequencies are 100% identical to English plaintext frequencies because no character identities change, immediately revealing that a transposition cipher was used.
- **Playfair**: Resists unigram analysis because it operates on pairs, but remains vulnerable to bigram frequency analysis.

#### Q9: Why are classical ciphers not used in modern secure systems?
**Answer:**
Classical ciphers lack computational security against modern computing power. Modern systems use algorithms like AES (symmetric block cipher with 128/256-bit keys, substitution-permutation networks), RSA (asymmetric factoring), or ECC (elliptic curve discrete logarithm), providing indistinguishability under chosen-ciphertext attack (IND-CCA2).

---

### Category 3: System Architecture & Implementation

#### Q10: How does CipherMail enforce zero-knowledge at rest in SQLite?
**Answer:**
The server's `POST /api/v1/messages` endpoint explicitly inspects incoming payloads:
```js
if (data.plaintext !== undefined || data.key !== undefined) {
  throw new ValidationError("Plaintext and encryption keys must never be transmitted.");
}
```
In SQLite, the `messages` table schema only stores `id, sender_id, receiver_id, algorithm, ciphertext, status, created_at, updated_at`. Decryption keys are held temporarily in React memory and destroyed when the user closes the reader modal.

#### Q11: Why is SQLite WAL mode used in CipherMail?
**Answer:**
Write-Ahead Logging (WAL) allows concurrent reads while writes are occurring. It provides ACID compliance, fast performance without full database file locks, and prevents database corruption during concurrent HTTP requests.

#### Q12: What HTTP status codes are used across CipherMail?
**Answer:**
- `200 OK`: Successful retrieval, decryption, update, or deletion.
- `201 Created`: Message successfully encrypted and stored.
- `400 Bad Request`: Validation failure (invalid key, empty text, invalid algorithm, same sender/receiver).
- `404 Not Found`: Nonexistent user or message ID.
- `500 Internal Server Error`: Unhandled server exceptions.
