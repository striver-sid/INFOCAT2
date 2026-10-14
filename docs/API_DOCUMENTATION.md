# CipherMail API Documentation (v1.1)

Base URL: `http://localhost:5000/api/v1`

All responses follow a consistent JSON envelope pattern:
```json
{
  "success": true,
  "data": { ... }
}
```
In case of error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | INTERNAL_ERROR",
    "message": "Descriptive human-readable error explanation."
  }
}
```

---

## 1. System Telemetry & Health

### `GET /health`
Returns runtime uptime, memory metrics, node environment, and SQLite database connectivity status.

**Response (200 OK):**
```json
{
  "status": "online",
  "timestamp": "2026-10-14T02:15:30.000Z",
  "uptime": 124.5,
  "services": {
    "database": {
      "status": "connected",
      "engine": "SQLite3 (better-sqlite3)",
      "file": "ciphermail.db",
      "mode": "WAL"
    }
  }
}
```

---

## 2. Cryptographic Endpoints

### `POST /cipher/:algorithm/encrypt`
Encrypts input plaintext using the selected classical algorithm.

- **Route Parameter**:
  - `algorithm`: `caesar` | `playfair` | `rail_fence` | `columnar_transposition`
- **Request Body**:
  ```json
  {
    "text": "Hello, Alice!",
    "key": 3
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "algorithm": "caesar",
      "ciphertext": "Khoor, Dolfh!",
      "length": 13,
      "timestamp": "2026-10-14T02:16:00.000Z"
    }
  }
  ```

### `POST /cipher/:algorithm/decrypt`
Decrypts ciphertext using the specified classical cipher and decryption key.

- **Route Parameter**:
  - `algorithm`: `caesar` | `playfair` | `rail_fence` | `columnar_transposition`
- **Request Body**:
  ```json
  {
    "text": "Khoor, Dolfh!",
    "key": 3
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "algorithm": "caesar",
      "plaintext": "Hello, Alice!",
      "length": 13,
      "timestamp": "2026-10-14T02:16:05.000Z"
    }
  }
  ```

---

## 3. Message Lifecycle Endpoints

### `GET /messages/inbox/:userId`
Retrieves paginated inbound messages addressed to a specific user (newest first).

- **Route Parameter**: `userId` (integer > 0)
- **Query Parameters**:
  - `page`: default `1`
  - `limit`: default `10` (max `100`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 46,
        "sender_id": 1,
        "sender_name": "Alice",
        "sender_email": "alice@college.demo",
        "receiver_id": 2,
        "receiver_name": "Bob",
        "receiver_email": "bob@college.demo",
        "algorithm": "caesar",
        "ciphertext": "Khoor, Dolfh!",
        "status": "SENT",
        "created_at": "2026-10-14 02:00:00",
        "updated_at": "2026-10-14 02:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

### `GET /messages/sent/:userId`
Retrieves paginated outbound messages dispatched by a specific user.

- **Route Parameter**: `userId` (integer > 0)
- **Query Parameters**: `page`, `limit`
- **Response (200 OK)**: Same structure as inbox endpoint, filtered by `sender_id`.

### `GET /messages/stats/:userId`
Retrieves live counts, status distribution, and algorithm utilization for a given user.

- **Route Parameter**: `userId` (integer > 0)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "userId": 2,
      "inbox": { "total": 5, "sent": 3, "decrypted": 2 },
      "sent": { "total": 4, "sent": 2, "decrypted": 2 },
      "statusCounts": { "totalMessages": 9, "pendingSent": 5, "decrypted": 4 },
      "algorithms": {
        "caesar": 3,
        "playfair": 2,
        "rail_fence": 2,
        "columnar_transposition": 2
      }
    }
  }
  ```

### `POST /messages`
Stores a newly encrypted ciphertext message in SQLite.

- **Constraint**: Strictly rejects `plaintext` or `key` fields (HTTP 400).
- **Request Body**:
  ```json
  {
    "senderId": 1,
    "receiverId": 2,
    "algorithm": "rail_fence",
    "ciphertext": "Zlroge o,dcytih3al!-KowdeVrfcto:Bb eprwt ai!"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 47,
      "sender_id": 1,
      "receiver_id": 2,
      "algorithm": "rail_fence",
      "ciphertext": "Zlroge o,dcytih3al!-KowdeVrfcto:Bb eprwt ai!",
      "status": "SENT",
      "created_at": "2026-10-14 02:05:00",
      "updated_at": "2026-10-14 02:05:00"
    }
  }
  ```

### `PATCH /messages/:id/status`
Updates message delivery status upon verified client decryption.

- **Route Parameter**: `id` (integer > 0)
- **Request Body**:
  ```json
  {
    "status": "DECRYPTED"
  }
  ```
- **Response (200 OK)**: Returns updated message record with `updated_at` refreshed.

### `DELETE /messages/:id`
Permanently deletes a message record from the SQLite database.

- **Route Parameter**: `id` (integer > 0)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Message #47 deleted successfully."
  }
  ```

---

## 4. User Endpoints

### `GET /users`
Lists predefined demonstration identities (Alice and Bob).

### `GET /users/:id`
Retrieves a single user record by ID.
