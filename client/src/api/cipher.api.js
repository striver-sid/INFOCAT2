import { apiClient } from './client.js';

/**
 * Encrypts plaintext using the specified backend cipher algorithm.
 * @param {string} algorithm - 'caesar' | 'playfair' | 'rail_fence' | 'columnar_transposition'
 * @param {string} text - Plaintext to encrypt
 * @param {any} key - Key value (shift number, keyword, or rails count)
 * @returns {Promise<{ algorithm: string, ciphertext: string, length: number }>}
 */
export async function encryptText(algorithm, text, key) {
  const response = await apiClient(`/cipher/${algorithm}/encrypt`, {
    method: 'POST',
    body: JSON.stringify({ text, key }),
  });
  return response.data;
}

/**
 * Decrypts ciphertext using the specified backend cipher algorithm.
 * @param {string} algorithm - 'caesar' | 'playfair' | 'rail_fence' | 'columnar_transposition'
 * @param {string} text - Ciphertext to decrypt
 * @param {any} key - Key value
 * @returns {Promise<{ algorithm: string, plaintext: string, length: number }>}
 */
export async function decryptText(algorithm, text, key) {
  const response = await apiClient(`/cipher/${algorithm}/decrypt`, {
    method: 'POST',
    body: JSON.stringify({ text, key }),
  });
  return response.data;
}

export default {
  encryptText,
  decryptText,
};
