import { apiClient } from './client.js';

/**
 * Checks system and database health from backend GET /api/v1/health.
 * @returns {Promise<object>}
 */
export async function fetchSystemHealth() {
  return apiClient('/health');
}

export default {
  fetchSystemHealth,
};
