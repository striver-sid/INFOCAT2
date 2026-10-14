/**
 * Caesar Cipher Algorithm
 *
 * Mathematical substitution cipher that replaces each letter with the letter
 * shifted by `key` positions in the alphabet.
 *
 * Specification:
 * - Key: Integer in the range [0, 25].
 * - Preserves letter case (uppercase and lowercase).
 * - Preserves spaces, punctuation, digits, and special characters unmodified.
 * - Guarantees exact round-trip: decrypt(encrypt(text, key), key) === text.
 */

/**
 * Validates the Caesar cipher key.
 * @param {any} key - Key to validate
 * @returns {number} Normalized integer key in [0, 25]
 * @throws {TypeError|RangeError} If key is invalid
 */
export const validateCaesarKey = (key) => {
  if (key === null || key === undefined || key === '') {
    throw new TypeError('Caesar cipher key is required.');
  }

  const numKey = Number(key);
  if (!Number.isInteger(numKey)) {
    throw new TypeError(`Caesar cipher key must be an integer, got: ${typeof key} (${key}).`);
  }

  if (numKey < 0 || numKey > 25) {
    throw new RangeError(`Caesar cipher key must be between 0 and 25, got: ${numKey}.`);
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
 * Encrypts plaintext using Caesar cipher with given shift key.
 * @param {string} text - Plaintext to encrypt
 * @param {number|string} key - Shift key [0, 25]
 * @returns {string} Ciphertext
 */
export const encrypt = (text, key) => {
  const str = validateTextInput(text);
  const shift = validateCaesarKey(key);

  if (str.length === 0 || shift === 0) {
    return str;
  }

  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    // Uppercase letters A-Z (65-90)
    if (code >= 65 && code <= 90) {
      result += String.fromCharCode(((code - 65 + shift) % 26) + 65);
    }
    // Lowercase letters a-z (97-122)
    else if (code >= 97 && code <= 122) {
      result += String.fromCharCode(((code - 97 + shift) % 26) + 97);
    }
    // Non-alphabetic characters remain untouched
    else {
      result += str[i];
    }
  }

  return result;
};

/**
 * Decrypts ciphertext using Caesar cipher with given shift key.
 * @param {string} text - Ciphertext to decrypt
 * @param {number|string} key - Shift key [0, 25]
 * @returns {string} Plaintext
 */
export const decrypt = (text, key) => {
  const str = validateTextInput(text);
  const shift = validateCaesarKey(key);

  if (str.length === 0 || shift === 0) {
    return str;
  }

  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    // Uppercase letters A-Z (65-90)
    if (code >= 65 && code <= 90) {
      result += String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
    }
    // Lowercase letters a-z (97-122)
    else if (code >= 97 && code <= 122) {
      result += String.fromCharCode(((code - 97 - shift + 26) % 26) + 97);
    }
    // Non-alphabetic characters remain untouched
    else {
      result += str[i];
    }
  }

  return result;
};

export default {
  encrypt,
  decrypt,
  validateKey: validateCaesarKey,
};
