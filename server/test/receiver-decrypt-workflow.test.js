import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { userRepository } from '../src/repositories/user.repository.js';
import { messageRepository } from '../src/repositories/message.repository.js';

describe('Receiver-Side Message-Reading & Decryption Workflow Tests', () => {
  let app;
  let server;
  let baseUrl;
  let aliceId;
  let bobId;
  const createdMessageIds = [];

  before(async () => {
    app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api/v1`;
        resolve();
      });
    });

    const alice = userRepository.findByEmail('alice@college.demo');
    const bob = userRepository.findByEmail('bob@college.demo');
    aliceId = alice.id;
    bobId = bob.id;
  });

  after(async () => {
    // Clean up created messages from test database
    for (const id of createdMessageIds) {
      try {
        messageRepository.delete(id);
      } catch (err) {}
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // ========================================================
  // 1. CIPHER DECRYPTION & EXACT ROUND-TRIP VERIFICATION
  // ========================================================
  describe('POST /api/v1/cipher/:algorithm/decrypt', () => {
    it('Caesar Cipher: verifies exact lossless round-trip behavior', async () => {
      const originalText = 'Top Secret Directive: Move at 0400 hours! #Alpha';
      const key = 17;

      // Encrypt
      const encRes = await fetch(`${baseUrl}/cipher/caesar/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, key }),
      });
      assert.equal(encRes.status, 200);
      const encJson = await encRes.json();
      assert.equal(encJson.success, true);
      const ciphertext = encJson.data.ciphertext;

      // Decrypt
      const decRes = await fetch(`${baseUrl}/cipher/caesar/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ciphertext, key }),
      });
      assert.equal(decRes.status, 200);
      const decJson = await decRes.json();
      assert.equal(decJson.success, true);
      // Exact round-trip check
      assert.equal(decJson.data.plaintext, originalText);
    });

    it('Rail Fence Cipher: verifies exact lossless round-trip behavior', async () => {
      const originalText = 'CONFIDENTIAL: Coordinates (37.7749, -122.4194) confirmed.';
      const key = 4;

      // Encrypt
      const encRes = await fetch(`${baseUrl}/cipher/rail_fence/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, key }),
      });
      assert.equal(encRes.status, 200);
      const encJson = await encRes.json();
      const ciphertext = encJson.data.ciphertext;

      // Decrypt
      const decRes = await fetch(`${baseUrl}/cipher/rail_fence/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ciphertext, key }),
      });
      assert.equal(decRes.status, 200);
      const decJson = await decRes.json();
      // Exact round-trip check
      assert.equal(decJson.data.plaintext, originalText);
    });

    it('Row-Columnar Transposition: verifies exact lossless round-trip behavior', async () => {
      const originalText = 'Rendezvous at Sector 7 with key-carrier! Punctuation & spaces intact.';
      const key = 'TELEPORT';

      // Encrypt
      const encRes = await fetch(`${baseUrl}/cipher/columnar_transposition/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, key }),
      });
      assert.equal(encRes.status, 200);
      const encJson = await encRes.json();
      const ciphertext = encJson.data.ciphertext;

      // Decrypt
      const decRes = await fetch(`${baseUrl}/cipher/columnar_transposition/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ciphertext, key }),
      });
      assert.equal(decRes.status, 200);
      const decJson = await decRes.json();
      // Exact round-trip check
      assert.equal(decJson.data.plaintext, originalText);
    });

    it('Playfair Cipher: deciphers prepared digraph stream and handles normalization/padding', async () => {
      // Playfair normalizes to uppercase, maps J->I, splits double letters with X, pads odd length with X
      const text = 'HIDE THE GOLD';
      const key = 'PLAYFAIREXAMPLE';

      // Encrypt
      const encRes = await fetch(`${baseUrl}/cipher/playfair/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, key }),
      });
      assert.equal(encRes.status, 200);
      const encJson = await encRes.json();
      const ciphertext = encJson.data.ciphertext;

      // Decrypt
      const decRes = await fetch(`${baseUrl}/cipher/playfair/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ciphertext, key }),
      });
      assert.equal(decRes.status, 200);
      const decJson = await decRes.json();
      assert.equal(decJson.success, true);
      // Normalized digraph check: 'HIDETHEGOLD' is 11 chars -> padded with X to 'HIDETHEGOLDX'
      assert.equal(decJson.data.plaintext, 'HIDETHEGOLDX');
    });

    it('rejects decryption with invalid Caesar key (< 0 or > 25)', async () => {
      const res = await fetch(`${baseUrl}/cipher/caesar/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Khoor', key: -5 }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error.message, /between 0 and 25/);
    });

    it('rejects decryption with invalid Rail Fence key (< 2)', async () => {
      const res = await fetch(`${baseUrl}/cipher/rail_fence/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'SecretText', key: 1 }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error.message, /integer >= 2/);
    });

    it('rejects decryption with empty Columnar keyword', async () => {
      const res = await fetch(`${baseUrl}/cipher/columnar_transposition/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'SecretText', key: '   ' }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });

    it('rejects decryption with invalid Playfair keyword (no letters)', async () => {
      const res = await fetch(`${baseUrl}/cipher/playfair/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'BMODZBXDNXEK', key: '12345!@#' }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error.message, /at least one alphabetic letter/);
    });

    it('rejects decryption with unsupported algorithm', async () => {
      const res = await fetch(`${baseUrl}/cipher/vigenere/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'SecretText', key: 'KEY' }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error.message, /Invalid algorithm 'vigenere'/);
    });

    it('rejects decryption with missing or empty text', async () => {
      const res = await fetch(`${baseUrl}/cipher/caesar/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '   ', key: 3 }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });
  });

  // ========================================================
  // 2. MESSAGE STATUS UPDATE ENDPOINT: PATCH /messages/:id/status
  // ========================================================
  describe('PATCH /api/v1/messages/:id/status', () => {
    let testMessageId;

    before(async () => {
      // Create a test message in SQLite
      const created = messageRepository.create({
        sender_id: aliceId,
        receiver_id: bobId,
        algorithm: 'caesar',
        ciphertext: 'Khoor, Dolfh!',
        status: 'SENT',
      });
      testMessageId = created.id;
      createdMessageIds.push(testMessageId);
    });

    it('updates message status to DECRYPTED successfully', async () => {
      const res = await fetch(`${baseUrl}/messages/${testMessageId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DECRYPTED' }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.id, testMessageId);
      assert.equal(json.data.status, 'DECRYPTED');

      // Verify persistent change in SQLite
      const direct = messageRepository.findById(testMessageId);
      assert.equal(direct.status, 'DECRYPTED');
    });

    it('rejects invalid status value (not in ALLOWED_STATUSES)', async () => {
      const res = await fetch(`${baseUrl}/messages/${testMessageId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPROMISED' }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error.message, /Invalid status 'COMPROMISED'/);
    });

    it('returns 404 for nonexistent message ID', async () => {
      const res = await fetch(`${baseUrl}/messages/999999/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DECRYPTED' }),
      });

      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error.message, /Message with ID '999999' was not found/);
    });

    it('returns 400 for invalid message ID format', async () => {
      const res = await fetch(`${baseUrl}/messages/not-a-number/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DECRYPTED' }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });
  });

  // ========================================================
  // 3. COMPLETE RECEIVER WORKFLOW INTEGRATION
  // ========================================================
  describe('Complete Alice -> Bob Compose, Transmit, Read & Decrypt Cycle', () => {
    it('executes full workflow and verifies SQLite persistence across cycles', async () => {
      const rawSecret = 'CipherMail Zero-Knowledge Cryptographic Transmission Test 2026';
      const key = 5;

      // Step 1: Alice encrypts plaintext on client/backend
      const encRes = await fetch(`${baseUrl}/cipher/caesar/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawSecret, key }),
      });
      assert.equal(encRes.status, 200);
      const { ciphertext } = (await encRes.json()).data;

      // Step 2: Alice sends message to backend (ZERO plaintext/key transmitted)
      const sendRes = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: aliceId,
          receiverId: bobId,
          algorithm: 'caesar',
          ciphertext,
        }),
      });
      assert.equal(sendRes.status, 201);
      const createdMsg = (await sendRes.json()).data;
      createdMessageIds.push(createdMsg.id);
      assert.equal(createdMsg.status, 'SENT');

      // Step 3: Bob queries inbox
      const inboxRes = await fetch(`${baseUrl}/messages/inbox/${bobId}?page=1&limit=10`);
      assert.equal(inboxRes.status, 200);
      const inboxJson = await inboxRes.json();
      const matchingMsg = inboxJson.data.find((m) => m.id === createdMsg.id);
      assert.ok(matchingMsg, 'Created message must appear in Bob\'s inbox');
      assert.equal(matchingMsg.status, 'SENT');
      assert.equal(matchingMsg.ciphertext, ciphertext);
      // Ensure plaintext does not exist in response
      assert.equal(matchingMsg.plaintext, undefined);

      // Step 4: Bob submits key to decrypt ciphertext
      const decRes = await fetch(`${baseUrl}/cipher/${matchingMsg.algorithm}/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: matchingMsg.ciphertext, key }),
      });
      assert.equal(decRes.status, 200);
      const decJson = await decRes.json();
      assert.equal(decJson.success, true);
      assert.equal(decJson.data.plaintext, rawSecret);

      // Step 5: Bob updates message status to DECRYPTED
      const statusRes = await fetch(`${baseUrl}/messages/${matchingMsg.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DECRYPTED' }),
      });
      assert.equal(statusRes.status, 200);
      const statusJson = await statusRes.json();
      assert.equal(statusJson.data.status, 'DECRYPTED');

      // Step 6: Verify status persists upon re-fetching inbox (simulating browser reload)
      const refreshedInboxRes = await fetch(`${baseUrl}/messages/inbox/${bobId}?page=1&limit=10`);
      assert.equal(refreshedInboxRes.status, 200);
      const refreshedInbox = await refreshedInboxRes.json();
      const updatedInInbox = refreshedInbox.data.find((m) => m.id === createdMsg.id);
      assert.ok(updatedInInbox);
      assert.equal(updatedInInbox.status, 'DECRYPTED');
    });
  });

  // ========================================================
  // 4. MESSAGE DELETION: DELETE /api/v1/messages/:id
  // ========================================================
  describe('DELETE /api/v1/messages/:id', () => {
    it('deletes an existing message permanently from SQLite', async () => {
      // Create temporary message
      const created = messageRepository.create({
        sender_id: aliceId,
        receiver_id: bobId,
        algorithm: 'rail_fence',
        ciphertext: 'To_Be_Deleted',
        status: 'SENT',
      });

      const delRes = await fetch(`${baseUrl}/messages/${created.id}`, {
        method: 'DELETE',
      });
      assert.equal(delRes.status, 200);
      const delJson = await delRes.json();
      assert.equal(delJson.success, true);
      assert.match(delJson.message, /deleted successfully/);

      // Verify it is gone from SQLite
      const found = messageRepository.findById(created.id);
      assert.equal(found, null);

      // Verify GET returns 404
      const getRes = await fetch(`${baseUrl}/messages/${created.id}`);
      assert.equal(getRes.status, 404);
    });

    it('returns 404 when attempting to delete nonexistent message', async () => {
      const res = await fetch(`${baseUrl}/messages/999999`, {
        method: 'DELETE',
      });
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error.message, /Message with ID '999999' was not found/);
    });

    it('returns 400 for invalid message ID parameter', async () => {
      const res = await fetch(`${baseUrl}/messages/invalid-id`, {
        method: 'DELETE',
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });
  });

  // ========================================================
  // 5. USER DASHBOARD STATS: GET /api/v1/messages/stats/:userId
  // ========================================================
  describe('GET /api/v1/messages/stats/:userId', () => {
    it('returns live counts, status distribution, and algorithm statistics', async () => {
      const res = await fetch(`${baseUrl}/messages/stats/${bobId}`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.userId, bobId);
      assert.ok('inbox' in json.data);
      assert.ok('total' in json.data.inbox);
      assert.ok('sent' in json.data.inbox);
      assert.ok('decrypted' in json.data.inbox);
      assert.ok('sent' in json.data);
      assert.ok('statusCounts' in json.data);
      assert.ok('algorithms' in json.data);
    });

    it('returns 404 for nonexistent user stats', async () => {
      const res = await fetch(`${baseUrl}/messages/stats/999999`);
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
    });

    it('returns 400 for invalid user ID format', async () => {
      const res = await fetch(`${baseUrl}/messages/stats/xyz`);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });
  });
});
