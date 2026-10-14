import { apiClient } from './client.js';

/**
 * Fetches paginated inbox messages received by the user from GET /api/v1/messages/inbox/:userId.
 * @param {number|string} userId
 * @param {{ page?: number, limit?: number }} params
 * @returns {Promise<{ data: Array<object>, pagination: object }>}
 */
export async function fetchInboxMessages(userId, { page = 1, limit = 10 } = {}) {
  const queryParams = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await apiClient(`/messages/inbox/${userId}?${queryParams.toString()}`);
  return {
    data: response.data || [],
    pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

/**
 * Fetches paginated sent messages dispatched by the user from GET /api/v1/messages/sent/:userId.
 * @param {number|string} userId
 * @param {{ page?: number, limit?: number }} params
 * @returns {Promise<{ data: Array<object>, pagination: object }>}
 */
export async function fetchSentMessages(userId, { page = 1, limit = 10 } = {}) {
  const queryParams = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await apiClient(`/messages/sent/${userId}?${queryParams.toString()}`);
  return {
    data: response.data || [],
    pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

/**
 * Fetches single message metadata and ciphertext by ID from GET /api/v1/messages/:id.
 * @param {number|string} id 
 * @returns {Promise<object>}
 */
export async function fetchMessageById(id) {
  const response = await apiClient(`/messages/${id}`);
  return response.data;
}

/**
 * Sends newly encrypted ciphertext message to POST /api/v1/messages.
 * Transmits ONLY ciphertext and identity IDs.
 * Plaintext and encryption keys are strictly excluded.
 *
 * @param {{ senderId: number, receiverId: number, algorithm: string, ciphertext: string }} payload 
 * @returns {Promise<object>} Created message record
 */
export async function createMessage({ senderId, receiverId, algorithm, ciphertext }) {
  const response = await apiClient('/messages', {
    method: 'POST',
    body: JSON.stringify({
      senderId,
      receiverId,
      algorithm,
      ciphertext,
    }),
  });
  return response.data;
}

/**
 * Updates message status on the server (e.g. 'DECRYPTED') via PATCH /api/v1/messages/:id/status.
 * @param {number|string} id 
 * @param {string} status 
 * @returns {Promise<object>} Updated message record
 */
export async function updateMessageStatus(id, status) {
  const response = await apiClient(`/messages/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return response.data;
}

/**
 * Permanently deletes a message by ID from SQLite via DELETE /api/v1/messages/:id.
 * @param {number|string} id 
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function deleteMessage(id) {
  const response = await apiClient(`/messages/${id}`, {
    method: 'DELETE',
  });
  return response;
}

/**
 * Fetches dashboard statistics and status distribution for a user from GET /api/v1/messages/stats/:userId.
 * @param {number|string} userId 
 * @returns {Promise<object>}
 */
export async function fetchUserStats(userId) {
  const response = await apiClient(`/messages/stats/${userId}`);
  return response.data;
}

export default {
  fetchInboxMessages,
  fetchSentMessages,
  fetchMessageById,
  createMessage,
  updateMessageStatus,
  deleteMessage,
  fetchUserStats,
};
