import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { userRepository } from '../src/repositories/user.repository.js';
import { messageRepository } from '../src/repositories/message.repository.js';

describe('Compose & Cipher Integration Tests', () => {
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

  // ==========================================
  // 1. CIPHER ENCRYPTION ENDPOINTS
  // ==========================================
  describe('POST /api/v1/cipher/:algorithm/encrypt', () => {
    it('encrypts using Caesar Cipher with valid key', async () => {
      const res = await fetch(`${baseUrl}/cipher/caesar/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello, Alice!', key: 3 }),
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.algorithm, 'caesar');
      assert.equal(json.data.ciphertext, 'Khoor, Dolfh!');
      assert.equal(json.data.length, 13);
    });

    it('encrypts using Playfair Cipher with valid keyword', async () => {
      const res = await fetch(`${baseUrl}/cipher/playfair/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'INSTRUMENTS', key: 'MONARCHY' }),
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.algorithm, 'playfair');
      assert.equal(json.data.ciphertext, 'GATLMZCLRQXA');
    });

    it('encrypts using Rail Fence Cipher with valid rail depth', async () => {
      const res = await fetch(`${baseUrl}/cipher/rail_fence/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'HELLO WORLD', key: 2 }),
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.algorithm, 'rail_fence');
      assert.equal(json.data.ciphertext, 'HLOWRDEL OL');
    });

    it('encrypts using Columnar Transposition with valid keyword', async () => {
      const res = await fetch(`${baseUrl}/cipher/columnar_transposition/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'CONFIDENTIAL', key: 'SECRET' }),
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.algorithm, 'columnar_transposition');
      assert.ok(json.data.ciphertext.length === 12);
    });

    it('rejects unsupported algorithm identifier with 400', async () => {
      const res = await fetch(`${baseUrl}/cipher/des_56/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Sample Text', key: 'KEY' }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'VALIDATION_ERROR');
    });

    it('rejects empty text payload with 400', async () => {
      const res = await fetch(`${baseUrl}/cipher/caesar/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '', key: 3 }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'VALIDATION_ERROR');
    });

    it('rejects missing key with 400', async () => {
      const res = await fetch(`${baseUrl}/cipher/caesar/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Sample text' }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'VALIDATION_ERROR');
    });

    it('rejects out-of-range Caesar key (> 25) with 400', async () => {
      const res = await fetch(`${baseUrl}/cipher/caesar/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Sample text', key: 30 }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });

    it('rejects invalid Rail Fence depth (< 2) with 400', async () => {
      const res = await fetch(`${baseUrl}/cipher/rail_fence/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Sample text', key: 1 }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });
  });

  // ==========================================
  // 2. CIPHER DECRYPTION ENDPOINTS
  // ==========================================
  describe('POST /api/v1/cipher/:algorithm/decrypt', () => {
    it('decrypts Caesar Cipher with valid key', async () => {
      const res = await fetch(`${baseUrl}/cipher/caesar/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Khoor, Dolfh!', key: 3 }),
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.plaintext, 'Hello, Alice!');
    });

    it('decrypts Playfair Cipher to prepared digraphs', async () => {
      const res = await fetch(`${baseUrl}/cipher/playfair/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'GATLMZCLRQXA', key: 'MONARCHY' }),
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.plaintext, 'INSTRUMENTSX');
    });

    it('decrypts Rail Fence Cipher exactly', async () => {
      const res = await fetch(`${baseUrl}/cipher/rail_fence/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'HLOWRDEL OL', key: 2 }),
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.plaintext, 'HELLO WORLD');
    });

    it('rejects invalid Playfair ciphertext length with 400', async () => {
      const res = await fetch(`${baseUrl}/cipher/playfair/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'ODD', key: 'MONARCHY' }),
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });
  });

  // ==========================================
  // 3. MESSAGE CREATION & ZERO-PLAINTEXT DISPATCH
  // ==========================================
  describe('POST /api/v1/messages (Message Creation)', () => {
    it('creates a message when provided valid ciphertext and identity IDs', async () => {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: aliceId,
          receiverId: bobId,
          algorithm: 'caesar',
          ciphertext: 'FRQILGHQWLDO PHVVDJH',
        }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.id);
      createdMessageIds.push(json.data.id);

      assert.equal(json.data.sender_id, aliceId);
      assert.equal(json.data.receiver_id, bobId);
      assert.equal(json.data.algorithm, 'caesar');
      assert.equal(json.data.ciphertext, 'FRQILGHQWLDO PHVVDJH');
      assert.equal(json.data.status, 'SENT');
      assert.equal(json.data.sender_name, 'Alice');
      assert.equal(json.data.receiver_name, 'Bob');
    });

    it('strictly rejects requests that include plaintext or encryption keys with 400', async () => {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: aliceId,
          receiverId: bobId,
          algorithm: 'caesar',
          ciphertext: 'FRQILGHQWLDO',
          plaintext: 'CONFIDENTIAL', // Prohibited!
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.error.message.includes('Plaintext and encryption keys must never be transmitted'));
    });

    it('strictly rejects requests that include key with 400', async () => {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: aliceId,
          receiverId: bobId,
          algorithm: 'caesar',
          ciphertext: 'FRQILGHQWLDO',
          key: 3, // Prohibited!
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });

    it('rejects message when sender and receiver are the same user with 400', async () => {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: aliceId,
          receiverId: aliceId, // Same identity
          algorithm: 'rail_fence',
          ciphertext: 'CIPHERTEXT',
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.error.message.includes('Sender and receiver cannot be the same user'));
    });

    it('rejects message when sender does not exist with 404', async () => {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 99999, // Nonexistent user
          receiverId: bobId,
          algorithm: 'caesar',
          ciphertext: 'CIPHERTEXT',
        }),
      });

      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'NOT_FOUND');
    });

    it('rejects message when receiver does not exist with 404', async () => {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: aliceId,
          receiverId: 99999, // Nonexistent user
          algorithm: 'caesar',
          ciphertext: 'CIPHERTEXT',
        }),
      });

      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'NOT_FOUND');
    });

    it('rejects invalid cipher algorithm with 400', async () => {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: aliceId,
          receiverId: bobId,
          algorithm: 'unsupported_cipher',
          ciphertext: 'CIPHERTEXT',
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });

    it('rejects empty ciphertext with 400', async () => {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: aliceId,
          receiverId: bobId,
          algorithm: 'caesar',
          ciphertext: '   ',
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });

    it('verifies created message appears in receiver inbox and sender sent ledger', async () => {
      // Create message from Bob to Alice using Columnar Transposition
      const createRes = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: bobId,
          receiverId: aliceId,
          algorithm: 'columnar_transposition',
          ciphertext: 'TRANS_CIPHERTEXT',
        }),
      });
      assert.equal(createRes.status, 201);
      const createBody = await createRes.json();
      const newMsgId = createBody.data.id;
      createdMessageIds.push(newMsgId);

      // 1. Check Alice's inbox (receiver)
      const inboxRes = await fetch(`${baseUrl}/messages/inbox/${aliceId}`).then((r) => r.json());
      const inboxMatch = inboxRes.data.find((m) => m.id === newMsgId);
      assert.ok(inboxMatch, 'Message must appear in receiver inbox');
      assert.equal(inboxMatch.sender_name, 'Bob');
      assert.equal(inboxMatch.ciphertext, 'TRANS_CIPHERTEXT');
      assert.equal(inboxMatch.algorithm, 'columnar_transposition');

      // 2. Check Bob's sent ledger (sender)
      const sentRes = await fetch(`${baseUrl}/messages/sent/${bobId}`).then((r) => r.json());
      const sentMatch = sentRes.data.find((m) => m.id === newMsgId);
      assert.ok(sentMatch, 'Message must appear in sender sent ledger');
      assert.equal(sentMatch.receiver_name, 'Alice');
    });
  });
});
