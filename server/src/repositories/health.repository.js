import { getDb } from '../config/database.js';

export class HealthRepository {
  /**
   * Pings SQLite database and retrieves system metadata record.
   * @returns {{ connected: boolean, latencyMs: number, metadata: object }}
   */
  checkDatabase() {
    const startTime = process.hrtime();
    const db = getDb();

    // Verify read query
    const pingResult = db.prepare('SELECT 1 as alive').get();
    
    // Retrieve metadata for verification
    const metadataRows = db.prepare('SELECT key, value FROM system_metadata').all();
    const metadata = metadataRows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    const diff = process.hrtime(startTime);
    const latencyMs = Number((diff[0] * 1000 + diff[1] / 1e6).toFixed(3));

    return {
      connected: pingResult?.alive === 1,
      latencyMs,
      metadata,
    };
  }
}

export const healthRepository = new HealthRepository();
export default healthRepository;
