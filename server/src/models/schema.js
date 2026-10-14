/**
 * CipherMail Database Schema Definitions
 * Uses safe 'CREATE TABLE IF NOT EXISTS' statements and migrations
 * to prevent recreating or wiping data on application restarts.
 */

export const ALLOWED_ALGORITHMS = Object.freeze([
  'caesar',
  'playfair',
  'rail_fence',
  'columnar_transposition',
]);

export const ALLOWED_STATUSES = Object.freeze(['SENT', 'DECRYPTED']);

export const SCHEMA_SQL = `
-- Metadata tracking table
CREATE TABLE IF NOT EXISTS system_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Schema migration history
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  applied_at TEXT DEFAULT (datetime('now'))
);

-- Users table (Demonstration identities, non-authenticated)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Messages table (Only stores ciphertext and metadata - NO plaintext, NO keys)
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  algorithm TEXT NOT NULL CHECK (algorithm IN ('caesar', 'playfair', 'rail_fence', 'columnar_transposition')),
  ciphertext TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'DECRYPTED')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Query performance indexes for inbox and sent listing
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages (receiver_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id, created_at DESC, id DESC);
`;

/**
 * Predefined demo users required by specification.
 * No password authentication is used.
 */
export const DEMO_USERS = [
  { name: 'Alice', email: 'alice@college.demo' },
  { name: 'Bob', email: 'bob@college.demo' },
];

/**
 * Initializes schema tables and seeds default demonstration identities.
 * @param {import('better-sqlite3').Database} db 
 */
export const initSchema = (db) => {
  // Execute foundational tables and indexes
  db.exec(SCHEMA_SQL);

  // Check and apply migrations idempotently
  const checkMigration = db.prepare('SELECT id FROM schema_migrations WHERE version = ?');

  // Initial foundation migration
  if (!checkMigration.get('v1.0.0-initial-foundation')) {
    db.prepare(`
      INSERT INTO schema_migrations (version, description)
      VALUES (?, ?)
    `).run('v1.0.0-initial-foundation', 'Initial system metadata and migration tables');
  }

  // Users and messages schema migration
  if (!checkMigration.get('v1.1.0-users-and-messages')) {
    db.prepare(`
      INSERT INTO schema_migrations (version, description)
      VALUES (?, ?)
    `).run('v1.1.0-users-and-messages', 'Users and messages tables with foreign keys and check constraints');
  }

  // Ensure system initialization metadata exists
  const checkMetadata = db.prepare('SELECT key FROM system_metadata WHERE key = ?');
  if (!checkMetadata.get('system_initialized_at')) {
    const insertMetadata = db.prepare(`
      INSERT INTO system_metadata (key, value)
      VALUES (?, ?)
    `);
    insertMetadata.run('system_initialized_at', new Date().toISOString());
    insertMetadata.run('app_name', 'CipherMail');
  }

  // Seed demonstration users idempotently
  const checkUser = db.prepare('SELECT id FROM users WHERE email = ?');
  const insertUser = db.prepare(`
    INSERT INTO users (name, email)
    VALUES (?, ?)
  `);

  for (const user of DEMO_USERS) {
    const existing = checkUser.get(user.email);
    if (!existing) {
      insertUser.run(user.name, user.email);
      console.log(`[Database] Seeded demonstration identity: ${user.name} (${user.email})`);
    }
  }
};

export default {
  SCHEMA_SQL,
  DEMO_USERS,
  ALLOWED_ALGORITHMS,
  ALLOWED_STATUSES,
  initSchema,
};
