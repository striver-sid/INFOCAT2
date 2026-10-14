# CipherMail Test Cases & Verification Matrix

The CipherMail backend automated test suite is built on the native Node.js Test Runner (`node:test` + `node:assert/strict`). It comprises **103 assertions across 21 test suites**, with zero external test runners or mock libraries.

---

## 1. Test Suite Summary

| Test File | Focus Area | Assertions | Status |
| :--- | :--- | :---: | :---: |
| `algorithms.test.js` | Classical cipher pure mathematical unit tests | 42 | PASS |
| `models-and-endpoints.test.js` | User/message persistence, constraints, foreign keys | 26 | PASS |
| `compose-and-cipher.test.js` | Cipher encrypt/decrypt API, zero-plaintext security | 14 | PASS |
| `receiver-decrypt-workflow.test.js` | Decryption round-trips, status PATCH, DELETE, stats | 21 | PASS |
| **Total** | **Full Application Test Matrix** | **103** | **100% PASS** |

---

## 2. Key Test Case Groups

### 2.1 Pure Cipher Algorithm Tests (`algorithms.test.js`)
- **Caesar Cipher**:
  - Encrypts standard text with positive shifts (0–25).
  - Preserves punctuation, uppercase, lowercase, numbers, and spaces.
  - Rejects negative shifts, shifts > 25, non-integer values, and null.
  - Validates exact round-trip: `decrypt(encrypt(text, key), key) === text`.
- **Playfair Cipher**:
  - Generates 5×5 key matrix merging 'I' and 'J'.
  - Digraph preparation inserts filler 'X' for duplicate letters (e.g. `BALLOON`).
  - Correctly applies same-row, same-column, and rectangle shift rules.
  - Documents and validates normalized digraph stream round-trip.
- **Rail Fence Cipher**:
  - Zigzag writing across depth $k \ge 2$.
  - Preserves all whitespace and symbols.
  - Rejects rails $< 2$ and non-numeric keys.
  - Validates exact round-trip.
- **Row-Columnar Transposition**:
  - Stable alphabetical column ranking with duplicate letter tie-breaking.
  - Incomplete final rows handled without padding.
  - Rejects empty or whitespace-only keywords.
  - Validates exact round-trip.

### 2.2 Security & Constraint Tests (`compose-and-cipher.test.js`)
- **Zero-Plaintext Enforcement**: `POST /api/v1/messages` strictly rejects payloads with `plaintext` or `key` fields (HTTP 400).
- **Self-Messaging Prevention**: Rejects `senderId === receiverId` with HTTP 400.
- **Nonexistent Identity**: Rejects nonexistent sender or receiver with HTTP 404.
- **Empty Ciphertext**: Rejects missing or whitespace-only ciphertext with HTTP 400.

### 2.3 Status Transition & Deletion Tests (`receiver-decrypt-workflow.test.js`)
- **Status Lifecycle**: `PATCH /messages/:id/status` accepts `DECRYPTED` and persists to SQLite.
- **Invalid Status**: Rejects status values outside `SENT` / `DECRYPTED` with HTTP 400.
- **Permanent Deletion**: `DELETE /messages/:id` removes record from SQLite; subsequent queries return 404.
- **Live User Dashboard Metrics**: `GET /messages/stats/:userId` aggregates accurate counts for inbox, sent, status breakdown, and algorithm usage.
