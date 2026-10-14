import { apiClient } from './client.js';

/**
 * Fetches all demonstration identities from GET /api/v1/users.
 * @returns {Promise<Array<object>>}
 */
export async function fetchUsers() {
  const response = await apiClient('/users');
  return response.data || [];
}

/**
 * Fetches a single user identity by ID.
 * @param {number|string} id 
 * @returns {Promise<object>}
 */
export async function fetchUserById(id) {
  const response = await apiClient(`/users/${id}`);
  return response.data;
}

export default {
  fetchUsers,
  fetchUserById,
};
