import { getDb } from '../config/database.js';

export class UserRepository {
  /**
   * Retrieves all users sorted by ID.
   * @returns {Array<object>}
   */
  findAll() {
    const db = getDb();
    const query = db.prepare(`
      SELECT id, name, email, created_at, updated_at
      FROM users
      ORDER BY id ASC
    `);
    return query.all();
  }

  /**
   * Retrieves a single user by primary key ID.
   * @param {number|string} id 
   * @returns {object|null}
   */
  findById(id) {
    const db = getDb();
    const query = db.prepare(`
      SELECT id, name, email, created_at, updated_at
      FROM users
      WHERE id = ?
    `);
    return query.get(id) || null;
  }

  /**
   * Retrieves a single user by unique email.
   * @param {string} email 
   * @returns {object|null}
   */
  findByEmail(email) {
    const db = getDb();
    const query = db.prepare(`
      SELECT id, name, email, created_at, updated_at
      FROM users
      WHERE email = ? COLLATE NOCASE
    `);
    return query.get(email) || null;
  }

  /**
   * Inserts a new user record.
   * @param {{ name: string, email: string }} userData 
   * @returns {object}
   */
  create({ name, email }) {
    const db = getDb();
    const query = db.prepare(`
      INSERT INTO users (name, email)
      VALUES (?, ?)
    `);
    const info = query.run(name, email);
    return this.findById(info.lastInsertRowid);
  }

  /**
   * Returns total count of registered demo identities.
   * @returns {number}
   */
  count() {
    const db = getDb();
    const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
    return result ? result.count : 0;
  }
}

export const userRepository = new UserRepository();
export default userRepository;
