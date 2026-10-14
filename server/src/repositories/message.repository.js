import { getDb } from '../config/database.js';

export class MessageRepository {
  /**
   * Persists a newly created ciphertext message.
   * Plaintext and encryption keys are NEVER persisted.
   * @param {{ sender_id: number, receiver_id: number, algorithm: string, ciphertext: string, status?: string }} messageData
   * @returns {object} The created message record
   */
  create({ sender_id, receiver_id, algorithm, ciphertext, status = 'SENT' }) {
    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, algorithm, ciphertext, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = insertStmt.run(sender_id, receiver_id, algorithm, ciphertext, status);
    return this.findById(info.lastInsertRowid);
  }

  /**
   * Retrieves a single message by ID with sender and receiver identity metadata.
   * @param {number|string} id 
   * @returns {object|null}
   */
  findById(id) {
    const db = getDb();
    const query = db.prepare(`
      SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.algorithm,
        m.ciphertext,
        m.status,
        m.created_at,
        m.updated_at,
        s.name AS sender_name,
        s.email AS sender_email,
        r.name AS receiver_name,
        r.email AS receiver_email
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE m.id = ?
    `);

    return query.get(id) || null;
  }

  /**
   * Lists inbox messages received by the user, newest first, with pagination.
   * @param {number|string} userId - Receiver's user ID
   * @param {{ page?: number, limit?: number }} paginationOptions
   * @returns {{ messages: Array<object>, pagination: { total: number, page: number, limit: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean } }}
   */
  listInbox(userId, { page = 1, limit = 10 } = {}) {
    const db = getDb();
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    // Total count for receiver
    const countStmt = db.prepare(`
      SELECT COUNT(*) AS total
      FROM messages
      WHERE receiver_id = ?
    `);
    const { total } = countStmt.get(userId);

    // Paginated rows sorted by newest first
    const listStmt = db.prepare(`
      SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.algorithm,
        m.ciphertext,
        m.status,
        m.created_at,
        m.updated_at,
        s.name AS sender_name,
        s.email AS sender_email,
        r.name AS receiver_name,
        r.email AS receiver_email
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE m.receiver_id = ?
      ORDER BY datetime(m.created_at) DESC, m.id DESC
      LIMIT ? OFFSET ?
    `);

    const messages = listStmt.all(userId, safeLimit, offset);
    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      messages,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  /**
   * Lists outbound sent messages dispatched by the user, newest first, with pagination.
   * @param {number|string} userId - Sender's user ID
   * @param {{ page?: number, limit?: number }} paginationOptions
   * @returns {{ messages: Array<object>, pagination: { total: number, page: number, limit: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean } }}
   */
  listSent(userId, { page = 1, limit = 10 } = {}) {
    const db = getDb();
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    // Total count for sender
    const countStmt = db.prepare(`
      SELECT COUNT(*) AS total
      FROM messages
      WHERE sender_id = ?
    `);
    const { total } = countStmt.get(userId);

    // Paginated rows sorted by newest first
    const listStmt = db.prepare(`
      SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.algorithm,
        m.ciphertext,
        m.status,
        m.created_at,
        m.updated_at,
        s.name AS sender_name,
        s.email AS sender_email,
        r.name AS receiver_name,
        r.email AS receiver_email
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE m.sender_id = ?
      ORDER BY datetime(m.created_at) DESC, m.id DESC
      LIMIT ? OFFSET ?
    `);

    const messages = listStmt.all(userId, safeLimit, offset);
    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      messages,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  /**
   * Updates the status of an existing message (e.g. 'DECRYPTED' or 'SENT').
   * @param {number|string} id 
   * @param {string} status 
   * @returns {object|null} Updated message or null if not found
   */
  updateStatus(id, status) {
    const db = getDb();
    const updateStmt = db.prepare(`
      UPDATE messages
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const info = updateStmt.run(status, id);
    if (info.changes === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Deletes a message by ID.
   * @param {number|string} id 
   * @returns {boolean} True if deleted, false if record was not found
   */
  delete(id) {
    const db = getDb();
    const deleteStmt = db.prepare(`
      DELETE FROM messages
      WHERE id = ?
    `);

    const info = deleteStmt.run(id);
    return info.changes > 0;
  }

  /**
   * Retrieves message statistics and status distribution for a user.
   * @param {number|string} userId
   * @returns {object}
   */
  getStats(userId) {
    const db = getDb();
    
    // Inbound messages (inbox)
    const inboxRow = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END), 0) as sent,
        COALESCE(SUM(CASE WHEN status = 'DECRYPTED' THEN 1 ELSE 0 END), 0) as decrypted
      FROM messages
      WHERE receiver_id = ?
    `).get(userId);

    // Dispatched messages (sent)
    const dispatchedRow = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END), 0) as sent,
        COALESCE(SUM(CASE WHEN status = 'DECRYPTED' THEN 1 ELSE 0 END), 0) as decrypted
      FROM messages
      WHERE sender_id = ?
    `).get(userId);

    // Algorithm breakdown across user's inbound and outbound messages
    const algRows = db.prepare(`
      SELECT algorithm, COUNT(*) as count
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY algorithm
    `).all(userId, userId);

    const algorithms = {
      caesar: 0,
      playfair: 0,
      rail_fence: 0,
      columnar_transposition: 0,
    };
    for (const r of algRows) {
      if (r.algorithm in algorithms) {
        algorithms[r.algorithm] = r.count;
      }
    }

    return {
      userId: Number(userId),
      inbox: {
        total: inboxRow?.total || 0,
        sent: inboxRow?.sent || 0,
        decrypted: inboxRow?.decrypted || 0,
      },
      sent: {
        total: dispatchedRow?.total || 0,
        sent: dispatchedRow?.sent || 0,
        decrypted: dispatchedRow?.decrypted || 0,
      },
      statusCounts: {
        totalMessages: (inboxRow?.total || 0) + (dispatchedRow?.total || 0),
        pendingSent: (inboxRow?.sent || 0) + (dispatchedRow?.sent || 0),
        decrypted: (inboxRow?.decrypted || 0) + (dispatchedRow?.decrypted || 0),
      },
      algorithms,
    };
  }
}

export const messageRepository = new MessageRepository();
export default messageRepository;
