import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { userRepository } from '../src/repositories/user.repository.js';
import { messageRepository } from '../src/repositories/message.repository.js';
import { getDb, closeDatabase } from '../src/config/database.js';
import { createApp } from '../src/app.js';
import { ALLOWED_ALGORITHMS, ALLOWED_STATUSES } from '../src/models/schema.js';

describe('CipherMail Data Model & Persistence Tests', () => {
  let app;
  let server;
  let baseUrl;
  let testMessageId;

  before(async () => {
    app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api/v1`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('Predefined Demonstration Identities', () => {
    it('should have Alice and Bob seeded with correct demo emails', () => {
      const users = userRepository.findAll();
      assert.ok(users.length >= 2, 'Must contain at least 2 demo users');

      const alice = users.find((u) => u.email === 'alice@college.demo');
      const bob = users.find((u) => u.email === 'bob@college.demo');

      assert.ok(alice, 'Alice must be present in database');
      assert.equal(alice.name, 'Alice');
      assert.ok(bob, 'Bob must be present in database');
      assert.equal(bob.name, 'Bob');
    });

    it('should find user by ID and email', () => {
      const alice = userRepository.findByEmail('alice@college.demo');
      assert.ok(alice);
      const foundById = userRepository.findById(alice.id);
      assert.deepEqual(alice, foundById);
    });

    it('should return null for nonexistent user ID', () => {
      const nonexistent = userRepository.findById(99999);
      assert.equal(nonexistent, null);
    });
  });

  describe('Messages Repository & Database Constraints', () => {
    let alice;
    let bob;

    before(() => {
      alice = userRepository.findByEmail('alice@college.demo');
      bob = userRepository.findByEmail('bob@college.demo');
    });

    it('should create a ciphertext message with sender and receiver identities', () => {
      const created = messageRepository.create({
        sender_id: alice.id,
        receiver_id: bob.id,
        algorithm: 'caesar',
        ciphertext: 'KHOOR ZRUOG',
        status: 'SENT',
      });

      assert.ok(created);
      assert.ok(created.id);
      testMessageId = created.id;
      assert.equal(created.sender_id, alice.id);
      assert.equal(created.receiver_id, bob.id);
      assert.equal(created.algorithm, 'caesar');
      assert.equal(created.ciphertext, 'KHOOR ZRUOG');
      assert.equal(created.status, 'SENT');
      assert.equal(created.sender_name, 'Alice');
      assert.equal(created.receiver_name, 'Bob');
    });

    it('should enforce SQLite Foreign Key constraints on invalid sender_id', () => {
      assert.throws(() => {
        messageRepository.create({
          sender_id: 88888, // Nonexistent user
          receiver_id: bob.id,
          algorithm: 'playfair',
          ciphertext: 'GAKLMN',
          status: 'SENT',
        });
      }, /FOREIGN KEY constraint failed/);
    });

    it('should enforce SQLite Foreign Key constraints on invalid receiver_id', () => {
      assert.throws(() => {
        messageRepository.create({
          sender_id: alice.id,
          receiver_id: 99999, // Nonexistent user
          algorithm: 'rail_fence',
          ciphertext: 'HLODEORWL',
          status: 'SENT',
        });
      }, /FOREIGN KEY constraint failed/);
    });

    it('should enforce CHECK constraint on algorithm field', () => {
      assert.throws(() => {
        messageRepository.create({
          sender_id: alice.id,
          receiver_id: bob.id,
          algorithm: 'invalid_aes_256', // Disallowed algorithm
          ciphertext: 'CIPHERTEXT',
          status: 'SENT',
        });
      }, /CHECK constraint failed/);
    });

    it('should enforce CHECK constraint on status field', () => {
      assert.throws(() => {
        messageRepository.create({
          sender_id: alice.id,
          receiver_id: bob.id,
          algorithm: 'caesar',
          ciphertext: 'CIPHERTEXT',
          status: 'INVALID_STATUS', // Disallowed status
        });
      }, /CHECK constraint failed/);
    });

    it('should accept only valid algorithm identifiers', () => {
      for (const algo of ALLOWED_ALGORITHMS) {
        const msg = messageRepository.create({
          sender_id: alice.id,
          receiver_id: bob.id,
          algorithm: algo,
          ciphertext: `TEST_${algo.toUpperCase()}`,
        });
        assert.equal(msg.algorithm, algo);
        messageRepository.delete(msg.id);
      }
    });

    it('should list inbox messages sorted newest first with pagination', () => {
      // Bob should have the test message in inbox
      const inboxResult = messageRepository.listInbox(bob.id, { page: 1, limit: 10 });
      assert.ok(inboxResult.messages.length >= 1);
      assert.ok(inboxResult.pagination.total >= 1);
      assert.equal(inboxResult.pagination.page, 1);

      const found = inboxResult.messages.find((m) => m.id === testMessageId);
      assert.ok(found, 'Created message must appear in receiver inbox');
    });

    it('should list sent messages sorted newest first with pagination', () => {
      // Alice should have the test message in sent messages
      const sentResult = messageRepository.listSent(alice.id, { page: 1, limit: 10 });
      assert.ok(sentResult.messages.length >= 1);
      assert.ok(sentResult.pagination.total >= 1);

      const found = sentResult.messages.find((m) => m.id === testMessageId);
      assert.ok(found, 'Created message must appear in sender sent messages');
    });

    it('should update message status to DECRYPTED', () => {
      const updated = messageRepository.updateStatus(testMessageId, 'DECRYPTED');
      assert.ok(updated);
      assert.equal(updated.status, 'DECRYPTED');

      const reloaded = messageRepository.findById(testMessageId);
      assert.equal(reloaded.status, 'DECRYPTED');
    });

    it('should retrieve message by ID', () => {
      const msg = messageRepository.findById(testMessageId);
      assert.ok(msg);
      assert.equal(msg.id, testMessageId);
      assert.equal(msg.sender_name, 'Alice');
      assert.equal(msg.receiver_name, 'Bob');
    });

    it('should delete a message by ID', () => {
      const deleted = messageRepository.delete(testMessageId);
      assert.equal(deleted, true);

      const check = messageRepository.findById(testMessageId);
      assert.equal(check, null);
    });
  });

  describe('REST Endpoints Verification', () => {
    let aliceId;
    let bobId;
    let endpointMessageId;

    before(async () => {
      const usersRes = await fetch(`${baseUrl}/users`).then((r) => r.json());
      aliceId = usersRes.data.find((u) => u.name === 'Alice').id;
      bobId = usersRes.data.find((u) => u.name === 'Bob').id;

      // Seed a test message for endpoint checks
      const msg = messageRepository.create({
        sender_id: aliceId,
        receiver_id: bobId,
        algorithm: 'columnar_transposition',
        ciphertext: 'HLOELWROD',
        status: 'SENT',
      });
      endpointMessageId = msg.id;
    });

    after(() => {
      if (endpointMessageId) {
        messageRepository.delete(endpointMessageId);
      }
    });

    it('GET /api/v1/users returns all demo users', async () => {
      const res = await fetch(`${baseUrl}/users`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length >= 2);
    });

    it('GET /api/v1/users/:id returns 200 for valid user', async () => {
      const res = await fetch(`${baseUrl}/users/${aliceId}`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.name, 'Alice');
      assert.equal(body.data.email, 'alice@college.demo');
    });

    it('GET /api/v1/users/:id returns 404 for nonexistent user', async () => {
      const res = await fetch(`${baseUrl}/users/99999`);
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'NOT_FOUND');
    });

    it('GET /api/v1/users/:id returns 400 for invalid ID format', async () => {
      const res = await fetch(`${baseUrl}/users/invalid_id`);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });

    it('GET /api/v1/messages/inbox/:userId returns 200 with paginated messages', async () => {
      const res = await fetch(`${baseUrl}/messages/inbox/${bobId}?page=1&limit=5`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.pagination);
      assert.equal(body.pagination.page, 1);
      assert.equal(body.pagination.limit, 5);

      const found = body.data.find((m) => m.id === endpointMessageId);
      assert.ok(found);
      assert.equal(found.algorithm, 'columnar_transposition');
    });

    it('GET /api/v1/messages/inbox/:userId returns 404 for nonexistent user', async () => {
      const res = await fetch(`${baseUrl}/messages/inbox/99999`);
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'NOT_FOUND');
    });

    it('GET /api/v1/messages/sent/:userId returns 200 with paginated messages', async () => {
      const res = await fetch(`${baseUrl}/messages/sent/${aliceId}?page=1&limit=5`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.pagination);

      const found = body.data.find((m) => m.id === endpointMessageId);
      assert.ok(found);
    });

    it('GET /api/v1/messages/sent/:userId returns 404 for nonexistent user', async () => {
      const res = await fetch(`${baseUrl}/messages/sent/99999`);
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'NOT_FOUND');
    });

    it('GET /api/v1/messages/:id returns 200 for existing message', async () => {
      const res = await fetch(`${baseUrl}/messages/${endpointMessageId}`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, endpointMessageId);
      assert.equal(body.data.sender_name, 'Alice');
      assert.equal(body.data.receiver_name, 'Bob');
    });

    it('GET /api/v1/messages/:id returns 404 for nonexistent message', async () => {
      const res = await fetch(`${baseUrl}/messages/99999`);
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'NOT_FOUND');
    });

    it('GET /api/v1/messages/:id returns 400 for invalid ID format', async () => {
      const res = await fetch(`${baseUrl}/messages/not-an-id`);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('Database Persistence Across Connection Cycles', () => {
    it('persists records across database close and reopen cycles', () => {
      const alice = userRepository.findByEmail('alice@college.demo');
      const bob = userRepository.findByEmail('bob@college.demo');

      // 1. Create a persistent verification record
      const record = messageRepository.create({
        sender_id: bob.id,
        receiver_id: alice.id,
        algorithm: 'rail_fence',
        ciphertext: 'PERSISTENCE_VERIFICATION_PAYLOAD',
        status: 'SENT',
      });
      const persistenceId = record.id;

      // 2. Simulate complete database disconnect / server restart
      closeDatabase();

      // 3. Re-acquire database connection
      const reconnectedDb = getDb();
      assert.ok(reconnectedDb.open);

      // 4. Verify record exists and has unchanged data
      const verified = messageRepository.findById(persistenceId);
      assert.ok(verified, 'Record must persist across connection close and restart');
      assert.equal(verified.id, persistenceId);
      assert.equal(verified.ciphertext, 'PERSISTENCE_VERIFICATION_PAYLOAD');
      assert.equal(verified.algorithm, 'rail_fence');
      assert.equal(verified.sender_id, bob.id);
      assert.equal(verified.receiver_id, alice.id);

      // Clean up verification record
      messageRepository.delete(persistenceId);
    });
  });
});
