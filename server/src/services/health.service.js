import config from '../config/env.js';
import { healthRepository } from '../repositories/health.repository.js';

export class HealthService {
  /**
   * Aggregates system, runtime, and database health metrics.
   * @returns {object} System health payload
   */
  async getSystemHealth() {
    let dbStatus;
    try {
      const dbCheck = healthRepository.checkDatabase();
      dbStatus = {
        status: dbCheck.connected ? 'connected' : 'disconnected',
        engine: 'SQLite3 (better-sqlite3)',
        latencyMs: dbCheck.latencyMs,
        storageMode: 'WAL (Write-Ahead Logging)',
        systemInitializedAt: dbCheck.metadata.system_initialized_at || null,
      };
    } catch (err) {
      dbStatus = {
        status: 'error',
        engine: 'SQLite3',
        error: err.message,
      };
    }

    const isHealthy = dbStatus.status === 'connected';

    return {
      success: isHealthy,
      status: isHealthy ? 'online' : 'degraded',
      message: isHealthy ? 'CipherMail API services are operational' : 'System services are degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(2)),
      environment: config.nodeEnv,
      version: '1.0.0',
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsageMb: {
          rss: Number((process.memoryUsage().rss / (1024 * 1024)).toFixed(2)),
          heapUsed: Number((process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2)),
          heapTotal: Number((process.memoryUsage().heapTotal / (1024 * 1024)).toFixed(2)),
        },
      },
      services: {
        database: dbStatus,
      },
    };
  }
}

export const healthService = new HealthService();
export default healthService;
