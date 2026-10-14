/**
 * Rail Fence Cipher Algorithm (Zigzag Cipher)
 *
 * Transposition cipher where plaintext is written downwards and upwards
 * along successive "rails" of an imaginary fence, then read off row by row.
 *
 * Specification:
 * - Key: Integer >= 2 (number of rails / depth).
 * - Preserves EVERY input character: case, spaces, punctuation, digits, and symbols.
 * - Guarantees exact round-trip: decrypt(encrypt(text, key), key) === text.
 */

/**
 * Validates the Rail Fence key.
 * @param {any} key - Number of rails
 * @returns {number} Normalized integer >= 2
 */
export const validateRailFenceKey = (key) => {
  if (key === null || key === undefined || key === '') {
    throw new TypeError('Rail Fence key is required.');
  }

  const numKey = Number(key);
  if (!Number.isInteger(numKey)) {
    throw new TypeError(`Rail Fence key must be an integer, got: ${typeof key} (${key}).`);
  }

  if (numKey < 2) {
    throw new RangeError(`Rail Fence key must be an integer >= 2, got: ${numKey}.`);
  }

  return numKey;
};

/**
 * Validates text parameter.
 * @param {any} text 
 * @returns {string}
 */
const validateTextInput = (text) => {
  if (typeof text !== 'string') {
    throw new TypeError(`Text input must be a string, got: ${typeof text}.`);
  }
  return text;
};

/**
 * Encrypts plaintext using Rail Fence Cipher.
 * Preserves all characters, cases, and whitespace.
 * @param {string} text - Plaintext to encrypt
 * @param {number|string} key - Number of rails (>= 2)
 * @returns {string} Ciphertext
 */
export const encrypt = (text, key) => {
  const str = validateTextInput(text);
  const numRails = validateRailFenceKey(key);

  if (str.length <= 1 || numRails >= str.length) {
    return str;
  }

  const rails = Array.from({ length: numRails }, () => []);
  let currentRail = 0;
  let direction = 1; // 1 for downwards, -1 for upwards

  for (let i = 0; i < str.length; i++) {
    rails[currentRail].push(str[i]);

    if (currentRail === 0) {
      direction = 1;
    } else if (currentRail === numRails - 1) {
      direction = -1;
    }

    currentRail += direction;
  }

  return rails.map((r) => r.join('')).join('');
};

/**
 * Decrypts Rail Fence ciphertext.
 * Restores exact original text preserving all spaces, punctuation, and cases.
 * @param {string} text - Ciphertext to decrypt
 * @param {number|string} key - Number of rails (>= 2)
 * @returns {string} Plaintext
 */
export const decrypt = (text, key) => {
  const str = validateTextInput(text);
  const numRails = validateRailFenceKey(key);

  if (str.length <= 1 || numRails >= str.length) {
    return str;
  }

  // Step 1: Trace zigzag path to find which rail each character index visited
  const railSequence = new Array(str.length);
  const railCounts = new Array(numRails).fill(0);
  let currentRail = 0;
  let direction = 1;

  for (let i = 0; i < str.length; i++) {
    railSequence[i] = currentRail;
    railCounts[currentRail]++;

    if (currentRail === 0) {
      direction = 1;
    } else if (currentRail === numRails - 1) {
      direction = -1;
    }

    currentRail += direction;
  }

  // Step 2: Slice the ciphertext into parts for each rail based on counts
  const railSegments = [];
  let offset = 0;
  for (let r = 0; r < numRails; r++) {
    const count = railCounts[r];
    railSegments[r] = str.slice(offset, offset + count).split('');
    offset += count;
  }

  // Step 3: Reconstruct original text by retracing the zigzag sequence
  let plaintext = '';
  for (let i = 0; i < str.length; i++) {
    const rail = railSequence[i];
    plaintext += railSegments[rail].shift();
  }

  return plaintext;
};

export default {
  encrypt,
  decrypt,
  validateKey: validateRailFenceKey,
};
