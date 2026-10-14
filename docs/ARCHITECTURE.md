# CipherMail System Architecture Document

## 1. Architectural Philosophy & Mission

CipherMail is an educational, multi-tier secure internal messaging platform built for Information Security laboratory instruction. It marries classical cryptography principles (substitution and transposition techniques) with production-grade full-stack engineering standards:

- **Decoupled Client-Server**: React 18 single-page application served via Vite 6 communicating over JSON REST APIs with a Node.js Express server.
- **Strict Cryptographic Zero-Knowledge at Rest**: Neither plaintext messages nor cipher keys are ever transmitted to or persisted in the database layer. SQLite stores only encrypted ciphertext strings and transmission metadata.
- **Ephemeral In-Memory Client Decryption**: Decryption keys and resulting plaintexts are kept exclusively in component memory while the inspection modal is active. Sensitive state is completely destroyed upon modal dismissal or navigation, with zero leakage to `localStorage` or `sessionStorage`.
- **Relational Integrity with Foreign Keys**: Persistence is backed by SQLite (`better-sqlite3`) with WAL (Write-Ahead Logging) mode, foreign key constraint enforcement, and column CHECK constraints for algorithm and status enumerations.

---

## 2. High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|  React 18 + Vite 6 (SPA) | Port 5173                                            |
|                                                                                 |
|   +------------------+  +------------------+  +-------------------------------+ |
|   |  Dashboard Page  |  |   Compose Page   |  |   Inbox & Sent Message Pages  | |
|   |  - Live Stats    |  |  - Key Selector  |  |   - Search & Filter Controls  | |
|   |  - Taxonomy Card |  |  - Client State  |  |   - MessageReaderModal        | |
|   |  - Lab Warnings  |  |  - Cipher Preview|  |   - DeleteConfirmationModal   | |
|   +------------------+  +------------------+  +-------------------------------+ |
|             \                    |                    /                         |
|              \                   |                   /                          |
|               +-------------------------------------+                           |
|               |  API Services Layer (Fetch Client)  |                           |
|               |  - cipher.api.js                    |                           |
|               |  - message.api.js                   |                           |
|               |  - user.api.js                      |                           |
|               +-------------------------------------+                           |
+-----------------------------------|---------------------------------------------+
                                    | HTTP / JSON (CORS Whitelisted)
                                    v
+---------------------------------------------------------------------------------+
|                                 SERVER TIER                                     |
|  Node.js + Express 4.21 Gateway | Port 5000                                     |
|                                                                                 |
|   +-------------------------------------------------------------------------+   |
|   | Middleware Stack: Helmet Security Headers, CORS, JSON Body Parser,      |   |
|   |                   HTTP Request Logger, Centralized Error Handling       |   |
|   +-------------------------------------------------------------------------+   |
|                                   |                                             |
|        +--------------------------+---------------------------+                 |
|        |                          |                           |                 |
|        v                          v                           v                 |
|   +------------------+   +-------------------+    +------------------------+    |
|   | Cipher Engine    |   | Message Service   |    | User & Health Services |    |
|   | - caesar         |   | - Zero-Plaintext  |    | - Seeded Demo Users    |    |
|   | - playfair       |   |   Validation      |    | - WAL Integrity Checks |    |
|   | - rail_fence     |   | - Status Lifecycle|    | - System Telemetry     |    |
|   | - columnar       |   | - Aggregations    |    |                        |    |
|   +------------------+   +-------------------+    +------------------------+    |
|                                   |                           |                 |
|                                   v                           v                 |
|                          +-----------------------------------------+            |
|                          | Repositories (Prepared SQL Statements)  |            |
|                          +-----------------------------------------+            |
+-----------------------------------|---------------------------------------------+
                                    | better-sqlite3 Native Binding
                                    v
+---------------------------------------------------------------------------------+
|                               PERSISTENCE TIER                                  |
|  SQLite 3 (server/data/ciphermail.db)                                            |
|                                                                                 |
|   [users]                                   [messages]                          |
|   - id (INTEGER PK AUTOINCREMENT)  <-----+  - id (INTEGER PK AUTOINCREMENT)     |
|   - name (TEXT NOT NULL)                 |  - sender_id (INTEGER FK -> users)   |
|   - email (TEXT NOT NULL UNIQUE)         +-- - receiver_id (INTEGER FK -> users)|
|   - role (TEXT NOT NULL)                    - algorithm (TEXT CHECK)            |
|   - created_at                              - ciphertext (TEXT NOT NULL)        |
|                                             - status (TEXT CHECK)               |
|                                             - created_at, updated_at            |
+---------------------------------------------------------------------------------+
```

---

## 3. Layered Component Responsibilities

### 3.1 Presentation Layer (`client/src`)
- **Pages**:
  - `DashboardPage.jsx`: Live inbound/outbound counts, message status breakdown, algorithm usage distribution, and educational taxonomy cards.
  - `ComposePage.jsx`: Sender/recipient identity binding, algorithm switcher, dynamic key controls, two-stage encryption & dispatch actions, terminal preview, clipboard actions.
  - `InboxPage.jsx`: Live search, pagination, status filtering, message reading modal, and deletion confirmation modal.
  - `SentPage.jsx`: Outbound ledger, recipient inspection, search filter, details modal, and deletion confirmation modal.
  - `AboutPage.jsx`: Theoretical notes on substitution vs. transposition, specifications, and viva examination prep.
- **Context**: `DemoUserContext.jsx` manages active identity (`Alice` vs `Bob`) across components without simulated auth.

### 3.2 Gateway & Routing Layer (`server/src/routes`)
- `cipher.routes.js`: Maps cryptographic operations under `/api/v1/cipher/:algorithm/encrypt` and `/api/v1/cipher/:algorithm/decrypt`.
- `message.routes.js`: Exposes message endpoints for creation, paginated inbox/sent querying, ID inspection, status updates, deletion, and dashboard metrics.
- `user.routes.js`: Identity listing and retrieval.
- `health.routes.js`: Telemetry, runtime diagnostics, and SQLite connection status.

### 3.3 Cryptographic Algorithms Engine (`server/src/algorithms`)
Independent pure ES6 modules exposing unified `encrypt(text, key)` and `decrypt(text, key)` signatures:
- `caesarCipher.js`: Modular arithmetic shift over $\mathbb{Z}_{26}$.
- `playfairCipher.js`: Digraph normalization, 5×5 matrix construction, rectangle/row/column shift rules.
- `railFenceCipher.js`: Geometric zigzag transposition across $N \ge 2$ rails.
- `columnarTranspositionCipher.js`: Matrix row insertion and alphabetical keyword column permutation.
- `index.js`: Algorithm registry providing canonical validation and lookups.

---

## 4. Security & Data Isolation Guarantees

1. **Zero-Knowledge Message Storage**:
   The `POST /api/v1/messages` endpoint implements strict structural inspection. If `req.body.plaintext` or `req.body.key` is defined, the controller immediately raises a `ValidationError` (400 Bad Request) and halts execution.
2. **Ephemeral Key Lifecycle**:
   Decryption keys entered in `MessageReaderModal` exist only within React state hooks (`useState`). When the modal is closed or the user switches context, state variables are overwritten and garbage collected.
3. **Database Constraint Security**:
   - `PRAGMA foreign_keys = ON;` is executed on every SQLite database connection initialization.
   - Algorithms are constrained to `'caesar'`, `'playfair'`, `'rail_fence'`, `'columnar_transposition'`.
   - Message status is constrained to `'SENT'` and `'DECRYPTED'`.
