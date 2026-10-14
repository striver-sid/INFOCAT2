import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from './env.js';
import { initSchema } from '../models/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

/**
 * Resolves the database file path reliably.
 */
const resolveDbPath = () => {
  let dbPath = config.database.path;
  if (!path.isAbsolute(dbPath)) {
    dbPath = path.resolve(__dirname, '../../', dbPath);
  }
  return dbPath;
};

/**
 * Initializes and connects to the SQLite database.
 * Preserves existing database files across restarts.
 * @returns {import('better-sqlite3').Database}
 */
export const initDatabase = () => {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = resolveDbPath();
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const fileExisted = fs.existsSync(dbPath);

  try {
    dbInstance = new Database(dbPath, {
      verbose: config.nodeEnv === 'development' ? (message) => {
        // Only log non-routine queries in development if desired
      } : null,
      fileMustExist: false,
    });

    // Performance and concurrency settings
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    dbInstance.pragma('busy_timeout = 5000');
    dbInstance.pragma('synchronous = NORMAL');

    // Run safe idempotent schema migrations
    initSchema(dbInstance);

    const statusMsg = fileExisted
      ? `Existing SQLite database loaded from: ${dbPath}`
      : `New SQLite database initialized at: ${dbPath}`;
    console.log(`[Database] ${statusMsg}`);

    return dbInstance;
  } catch (error) {
    console.error('[Database] Failed to initialize SQLite database:', error.message);
    throw error;
  }
};

/**
 * Returns the active SQLite database instance.
 * Automatically initializes if not yet created.
 * @returns {import('better-sqlite3').Database}
 */
export const getDb = () => {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
};

/**
 * Closes the database connection gracefully.
 */
export const closeDatabase = () => {
  if (dbInstance && dbInstance.open) {
    dbInstance.close();
    dbInstance = null;
    console.log('[Database] SQLite connection closed cleanly');
  }
};

export default {
  initDatabase,
  getDb,
  closeDatabase,
};
