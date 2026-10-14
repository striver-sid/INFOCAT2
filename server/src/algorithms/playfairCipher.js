/**
 * Playfair Cipher Algorithm
 *
 * Classical polygraphic substitution cipher that encrypts pairs of letters (digraphs)
 * using a 5×5 matrix constructed from a keyword.
 *
 * Classical Playfair Conventions:
 * 1. Matrix: 5×5 grid containing 25 letters. 'J' is merged into 'I'.
 * 2. Key Generation: Keyword letters with duplicates removed, followed by the rest
 *    of the alphabet (A-Z omitting J).
 * 3. Digraph Preparation:
 *    - Text is normalized to uppercase A-Z (excluding J, where J -> I).
 *    - Non-alphabetic characters (spaces, punctuation, digits) are excluded.
 *    - Repeated adjacent letters in the same digraph are split using filler 'X' (or 'Q' if the letter is 'X').
 *    - If the prepared string has an odd length, it is padded with 'X' (or 'Z' if the last letter is 'X').
 *
 * Cryptographic & Round-Trip Limitation Documentation:
 * Playfair is inherently lossy with respect to arbitrary plaintext formatting:
 * - Case, punctuation, digits, and whitespace are discarded during digraph normalization.
 * - 'J' is mapped to 'I' and cannot be uniquely distinguished upon decryption.
 * - Filler letters ('X' / 'Q') and padding ('X' / 'Z') are structural elements of the ciphertext.
 *
 * Therefore:
 * - encrypt(text, key) encrypts the prepared digraphs.
 * - decrypt(ciphertext, key) reconstructs the exact PREPARED DIGRAPH TEXT:
 *     decrypt(encrypt(text, key), key) === prepareText(text)
 * - We do NOT falsely claim that raw punctuated text with 'J's is reconstructed automatically.
 */

const ALPHABET_25 = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // Omits 'J'

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
 * Validates and normalizes the Playfair key.
 * @param {any} key - Key string
 * @returns {string} Normalized 25-letter key matrix string
 */
export const validatePlayfairKey = (key) => {
  if (key === null || key === undefined || typeof key !== 'string') {
    throw new TypeError('Playfair cipher key must be a non-empty string.');
  }

  // Extract alphabetic characters, convert to uppercase, map J -> I
  const cleanKey = key.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');

  if (cleanKey.length === 0) {
    throw new Error('Playfair cipher key must contain at least one alphabetic letter.');
  }

  // Build unique 25-letter matrix string
  let matrixStr = '';
  const seen = new Set();

  for (const char of cleanKey) {
    if (!seen.has(char) && ALPHABET_25.includes(char)) {
      seen.add(char);
      matrixStr += char;
    }
  }

  for (const char of ALPHABET_25) {
    if (!seen.has(char)) {
      seen.add(char);
      matrixStr += char;
    }
  }

  return matrixStr;
};

/**
 * Prepares input text into normalized digraphs according to Playfair rules.
 * Handles duplicate letters in a pair and odd-length padding.
 * @param {string} text - Raw input text
 * @returns {string} Prepared digraph string (always even length)
 */
export const prepareText = (text) => {
  const str = validateTextInput(text);
  if (str.length === 0) return '';

  const clean = str.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  if (clean.length === 0) return '';

  let prepared = '';
  let i = 0;

  while (i < clean.length) {
    const first = clean[i];

    if (i + 1 >= clean.length) {
      // Odd character at the end -> pad with X (or Z if last letter is X)
      const pad = first === 'X' ? 'Z' : 'X';
      prepared += first + pad;
      i += 1;
    } else {
      const second = clean[i + 1];
      if (first === second) {
        // Repeated letters in digraph -> insert filler X (or Q if letter is X)
        const filler = first === 'X' ? 'Q' : 'X';
        prepared += first + filler;
        i += 1; // Second letter stays for the next digraph
      } else {
        prepared += first + second;
        i += 2;
      }
    }
  }

  return prepared;
};

/**
 * Builds coordinate lookups for the 5x5 matrix.
 * @param {string} matrixStr 
 * @returns {{ charToCoord: Map<string, { r: number, c: number }>, coordToChar: string[][] }}
 */
const buildMatrixLookup = (matrixStr) => {
  const charToCoord = new Map();
  const coordToChar = [];

  for (let r = 0; r < 5; r++) {
    coordToChar[r] = [];
    for (let c = 0; c < 5; c++) {
      const char = matrixStr[r * 5 + c];
      coordToChar[r][c] = char;
      charToCoord.set(char, { r, c });
    }
  }

  return { charToCoord, coordToChar };
};

/**
 * Encrypts plaintext using Playfair Cipher.
 * @param {string} text - Plaintext to encrypt
 * @param {string} key - Keyword string
 * @returns {string} Ciphertext digraphs
 */
export const encrypt = (text, key) => {
  validateTextInput(text);
  const matrixStr = validatePlayfairKey(key);
  const prepared = prepareText(text);

  if (prepared.length === 0) {
    return '';
  }

  const { charToCoord, coordToChar } = buildMatrixLookup(matrixStr);
  let ciphertext = '';

  for (let i = 0; i < prepared.length; i += 2) {
    const c1 = prepared[i];
    const c2 = prepared[i + 1];

    const pos1 = charToCoord.get(c1);
    const pos2 = charToCoord.get(c2);

    let enc1, enc2;

    // Rule 1: Same row -> shift right
    if (pos1.r === pos2.r) {
      enc1 = coordToChar[pos1.r][(pos1.c + 1) % 5];
      enc2 = coordToChar[pos2.r][(pos2.c + 1) % 5];
    }
    // Rule 2: Same column -> shift down
    else if (pos1.c === pos2.c) {
      enc1 = coordToChar[(pos1.r + 1) % 5][pos1.c];
      enc2 = coordToChar[(pos2.r + 1) % 5][pos2.c];
    }
    // Rule 3: Rectangle -> swap columns
    else {
      enc1 = coordToChar[pos1.r][pos2.c];
      enc2 = coordToChar[pos2.r][pos1.c];
    }

    ciphertext += enc1 + enc2;
  }

  return ciphertext;
};

/**
 * Decrypts Playfair ciphertext.
 * Returns the exact prepared digraph sequence that generated the ciphertext.
 * @param {string} text - Ciphertext to decrypt
 * @param {string} key - Keyword string
 * @returns {string} Decrypted prepared digraph text
 */
export const decrypt = (text, key) => {
  validateTextInput(text);
  const matrixStr = validatePlayfairKey(key);

  const cleanCipher = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');

  if (cleanCipher.length === 0) {
    return '';
  }

  if (cleanCipher.length % 2 !== 0) {
    throw new Error('Playfair ciphertext length must be an even number of characters.');
  }

  const { charToCoord, coordToChar } = buildMatrixLookup(matrixStr);
  let decrypted = '';

  for (let i = 0; i < cleanCipher.length; i += 2) {
    const c1 = cleanCipher[i];
    const c2 = cleanCipher[i + 1];

    const pos1 = charToCoord.get(c1);
    const pos2 = charToCoord.get(c2);

    if (!pos1 || !pos2) {
      throw new Error(`Ciphertext contains invalid character outside Playfair matrix: ${c1}${c2}`);
    }

    let dec1, dec2;

    // Rule 1: Same row -> shift left
    if (pos1.r === pos2.r) {
      dec1 = coordToChar[pos1.r][(pos1.c - 1 + 5) % 5];
      dec2 = coordToChar[pos2.r][(pos2.c - 1 + 5) % 5];
    }
    // Rule 2: Same column -> shift up
    else if (pos1.c === pos2.c) {
      dec1 = coordToChar[(pos1.r - 1 + 5) % 5][pos1.c];
      dec2 = coordToChar[(pos2.r - 1 + 5) % 5][pos2.c];
    }
    // Rule 3: Rectangle -> swap columns
    else {
      dec1 = coordToChar[pos1.r][pos2.c];
      dec2 = coordToChar[pos2.r][pos1.c];
    }

    decrypted += dec1 + dec2;
  }

  return decrypted;
};

export default {
  encrypt,
  decrypt,
  prepareText,
  validateKey: validatePlayfairKey,
};
