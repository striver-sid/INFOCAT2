/**
 * Classical Cryptography Algorithms Registry
 *
 * Maps supported algorithm identifiers to their respective pure JavaScript implementations:
 * - caesar -> caesarCipher.js
 * - playfair -> playfairCipher.js
 * - rail_fence -> railFenceCipher.js
 * - columnar_transposition -> columnarTranspositionCipher.js
 */

import caesarCipher from './caesarCipher.js';
import playfairCipher from './playfairCipher.js';
import railFenceCipher from './railFenceCipher.js';
import columnarTranspositionCipher from './columnarTranspositionCipher.js';

export {
  caesarCipher,
  playfairCipher,
  railFenceCipher,
  columnarTranspositionCipher,
};

/**
 * Registry mapping algorithm identifiers to their implementations.
 */
export const algorithmRegistry = Object.freeze({
  caesar: caesarCipher,
  playfair: playfairCipher,
  rail_fence: railFenceCipher,
  columnar_transposition: columnarTranspositionCipher,
});

/**
 * Retrieves the cipher implementation for a given algorithm identifier.
 * @param {string} identifier - 'caesar' | 'playfair' | 'rail_fence' | 'columnar_transposition'
 * @returns {{ encrypt: Function, decrypt: Function }}
 * @throws {Error} If identifier is not supported
 */
export const getCipher = (identifier) => {
  if (!identifier || typeof identifier !== 'string') {
    throw new TypeError(`Algorithm identifier must be a string, got: ${typeof identifier}.`);
  }

  const cipher = algorithmRegistry[identifier];
  if (!cipher) {
    const supported = Object.keys(algorithmRegistry).join(', ');
    throw new Error(`Unsupported algorithm '${identifier}'. Supported algorithms are: ${supported}.`);
  }

  return cipher;
};

/**
 * Universal encrypt dispatcher.
 * @param {string} identifier - Algorithm identifier
 * @param {string} text - Plaintext to encrypt
 * @param {any} key - Algorithm-specific key
 * @returns {string} Ciphertext
 */
export const encrypt = (identifier, text, key) => {
  const cipher = getCipher(identifier);
  return cipher.encrypt(text, key);
};

/**
 * Universal decrypt dispatcher.
 * @param {string} identifier - Algorithm identifier
 * @param {string} text - Ciphertext to decrypt
 * @param {any} key - Algorithm-specific key
 * @returns {string} Plaintext or recovered digraphs
 */
export const decrypt = (identifier, text, key) => {
  const cipher = getCipher(identifier);
  return cipher.decrypt(text, key);
};

export default {
  algorithmRegistry,
  getCipher,
  encrypt,
  decrypt,
  caesarCipher,
  playfairCipher,
  railFenceCipher,
  columnarTranspositionCipher,
};
