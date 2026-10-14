# CipherMail — Secure Internal Messaging System Using Classical Cryptography

CipherMail is a decoupled, educational secure messaging platform developed for college **Information Security Laboratory** instruction. It demonstrates the mathematical foundations and cryptanalysis of classical ciphers (Substitution and Transposition) paired with modern full-stack web engineering.

---

## 🚀 Quick Start & Verification

### 1. Prerequisites
- **Node.js**: v20+ or v22+
- **npm**: v10+

### 2. Installation
From the repository root:
```bash
# Install root orchestrator dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 3. Start Both Applications
Run the development environment manager (boots both API server and Vite client concurrently):
```bash
npm run dev
```

### 4. Verified Local URLs
| Application Tier | Local URL | Description |
| :--- | :--- | :--- |
| **Frontend Application** | [http://localhost:5173](http://localhost:5173) | Vite + React Single-Page Application |
| **Backend REST API** | [http://localhost:5000/api/v1](http://localhost:5000/api/v1) | Express API Gateway |
| **System Health Telemetry** | [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health) | Diagnostics & SQLite WAL status |

### 5. Run Automated Tests
Execute the native Node.js test runner across all 103 test assertions:
```bash
# Run backend tests
npm run test:server

# Or directly inside server directory
cd server && npm test
```

### 6. Production Build
Verify client production asset bundling:
```bash
cd client && npm run build
```

---

## 🏛️ System Architecture & Zero-Knowledge Guarantee

CipherMail enforces strict **Zero-Knowledge at Rest**:
- **Zero Plaintext / Zero Key Persistence**: `POST /api/v1/messages` rejects any request carrying `plaintext` or `key`. The SQLite database stores *strictly* encrypted ciphertext strings.
- **Ephemeral In-Memory Decryption**: Decryption keys and resulting plaintexts reside only in temporary component memory during active viewing. They are completely cleared upon closing the reader modal or navigating away, with **zero storage** in `localStorage`, `sessionStorage`, or backend logs.
- **Predefined Demonstration Identities**: Simulates internal communication between **Alice** (`alice@college.demo`, ID 1) and **Bob** (`bob@college.demo`, ID 2) with zero password auth overhead.

For full architectural diagrams and component models, consult [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🔐 Supported Classical Ciphers

CipherMail implements four classical cipher modules in pure ES6 modules:

| Cipher Name | Family | Key Type | Round-Trip Behavior |
| :--- | :--- | :--- | :--- |
| **Caesar Shift** | Substitution (Monoalphabetic) | Shift Integer `0 - 25` | Lossless (Preserves case, spaces, symbols) |
| **Playfair Matrix** | Substitution (Polygraphic) | Matrix Keyword String | Digraph Normalized (I/J merged, padded) |
| **Rail Fence** | Transposition (Geometric) | Rails Depth Integer $\ge 2$ | Lossless (Preserves case, spaces, symbols) |
| **Row-Columnar** | Transposition (Permutation) | Permutation Keyword String | Lossless (Handles incomplete final rows) |

For mathematical formulations, cryptanalysis, and limitation notes, consult [docs/ALGORITHM_NOTES.md](docs/ALGORITHM_NOTES.md).

---

## 📚 Complete Project Documentation Suite

- 🏛️ **Architecture & Data Flow**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 📡 **REST API Specifications**: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- 🔬 **Algorithm Notes & Cryptanalysis**: [docs/ALGORITHM_NOTES.md](docs/ALGORITHM_NOTES.md)
- 🧪 **Automated Test Matrix (103 Tests)**: [docs/TEST_CASES.md](docs/TEST_CASES.md)
- 🎓 **Lab Viva Examination Questions & Answers**: [docs/VIVA_QUESTIONS.md](docs/VIVA_QUESTIONS.md)

---

## 🎬 College Staff Live Demonstration Script

Follow this step-by-step walkthrough to present CipherMail during a laboratory evaluation:

1. **System Health & Dashboard Overview**:
   - Open [http://localhost:5173](http://localhost:5173).
   - Point out the **Security Operations Dashboard**, displaying live counts for Inbound Messages, Dispatched Messages, Pending Ciphertexts (`SENT`), and Deciphered Messages (`DECRYPTED`) fetched directly from SQLite via `GET /api/v1/messages/stats/:userId`.
   - Highlight the **Substitution vs. Transposition taxonomy** card and the academic disclaimer banner.
   - Point to the live health badge in the top navbar showing real-time round-trip latency to `GET /api/v1/health`.

2. **Alice Composes and Encrypts a Message**:
   - Navigate to **Compose** (`/compose`).
   - Active user is Alice. Select recipient: **Bob**.
   - Select **Rail Fence Zigzag Cipher** (Category: Transposition).
   - Set Key Depth to `3`.
   - Enter Plaintext: `"Confidential Lab Exam: Room 402 at 0900 hours!"`
   - Click **1. Encrypt Payload**.
   - Show the resulting ciphertext in the crypto-terminal card.
   - Click **2. Send Message**. Note the green confirmation banner and record ID.
   - *Technical Point to Explain*: Open DevTools Network tab and show the request payload to `POST /api/v1/messages`. Prove that **no plaintext or key** is transmitted to the server!

3. **Bob Receives and Deciphers the Message**:
   - Switch active user identity to **Bob** using the navbar selector.
   - Navigate to **Inbox** (`/inbox`).
   - Notice the newly arrived message row showing status `SENT` with a blue badge.
   - Click **Decrypt** on the message to open the `MessageReaderModal`.
   - Note that plaintext is **completely hidden** before decryption.
   - Enter an invalid key (e.g. `1`) and click **Decrypt Message**. Show the clear error message (*"Rail Fence depth must be an integer ≥ 2"*), and observe that status remains `SENT`.
   - Enter correct key `3` and click **Decrypt Message**.
   - The backend deciphers the ciphertext, the decrypted plaintext is revealed in the verified container, and status transitions to `DECRYPTED`.
   - Test **Hide Plaintext** (masks text with bullets) and **Copy Plaintext** (clipboard visual feedback).
   - Click **Return to Inbox**.

4. **Verify SQLite Database Persistence Across Browser Refresh**:
   - In Bob's inbox, observe the message row now displays the green `DECRYPTED` badge.
   - Press **F5** to reload the browser.
   - Show that the `DECRYPTED` status persisted in SQLite.
   - Click **Read** on the message. Emphasize that because keys and plaintexts are **ephemeral** and never stored in `localStorage` or `sessionStorage`, Bob must supply the key again to view the plaintext in memory.

5. **Message Search & Permanent Deletion**:
   - In Bob's inbox or Sent ledger, use the search bar to filter by sender, recipient, or ciphertext snippet.
   - Click the **Trash** icon next to a message.
   - Show the **Delete Confirmation Modal** protecting against accidental data loss.
   - Confirm deletion: the message is permanently removed from the SQLite database (`DELETE /api/v1/messages/:id`), and the table updates instantly.
