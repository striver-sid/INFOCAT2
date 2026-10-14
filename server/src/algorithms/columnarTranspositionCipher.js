/**
 * Row-Columnar Transposition Cipher Algorithm
 *
 * Transposition cipher where plaintext is written row by row into a matrix
 * with width equal to the keyword length, and columns are read off in the
 * alphabetical order of the keyword characters.
 *
 * Specification:
 * - Keyword: Non-empty string.
 * - Column Ranking: Columns are ranked alphabetically by keyword characters.
 * - Duplicate Ties: Broken by original position in the keyword (stable order).
 * - Row Writing: Input is written into the matrix row-by-row.
 * - Incomplete Final Rows: Correctly handled without artificial padding.
 * - Preserves ALL characters: case, punctuation, digits, spaces, and symbols.
 * - Guarantees exact round-trip: decrypt(encrypt(text, key), key) === text.
 */

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
 * Validates the keyword.
 * @param {any} key - Keyword string
 * @returns {string} Validated keyword
 */
export const validateColumnarKey = (key) => {
  if (key === null || key === undefined || typeof key !== 'string') {
    throw new TypeError('Columnar transposition key must be a non-empty string.');
  }

  const trimmed = key.trim();
  if (trimmed.length === 0) {
    throw new Error('Columnar transposition key cannot be empty or whitespace only.');
  }

  return trimmed;
};

/**
 * Computes the ranked column order based on the keyword.
 * Columns are sorted alphabetically by character; duplicate letters break ties
 * by their original position (index).
 *
 * @param {string} key - Keyword
 * @returns {number[]} Array of original column indices in ranked read order
 */
export const getRankedColumns = (key) => {
  const chars = [];
  for (let i = 0; i < key.length; i++) {
    chars.push({ char: key[i].toUpperCase(), originalIndex: i });
  }

  // Sort alphabetically; break ties by originalIndex
  chars.sort((a, b) => {
    if (a.char < b.char) return -1;
    if (a.char > b.char) return 1;
    return a.originalIndex - b.originalIndex;
  });

  return chars.map((c) => c.originalIndex);
};

/**
 * Encrypts plaintext using Row-Columnar Transposition.
 * Preserves all spaces, punctuation, case, and handles incomplete final rows.
 *
 * @param {string} text - Plaintext to encrypt
 * @param {string} key - Keyword
 * @returns {string} Ciphertext
 */
export const encrypt = (text, key) => {
  const str = validateTextInput(text);
  const keyword = validateColumnarKey(key);

  const totalLength = str.length;
  const numCols = keyword.length;

  if (totalLength === 0 || numCols === 1) {
    return str;
  }

  const numRows = Math.ceil(totalLength / numCols);
  const remainder = totalLength % numCols;

  // Build grid row-by-row
  const grid = Array.from({ length: numRows }, () => new Array(numCols));
  let strIdx = 0;

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (strIdx < totalLength) {
        grid[r][c] = str[strIdx++];
      } else {
        grid[r][c] = null; // Incomplete final row (no padding)
      }
    }
  }

  // Get alphabetical column read order
  const rankedCols = getRankedColumns(keyword);
  let ciphertext = '';

  // Read columns in ranked order
  for (const colIdx of rankedCols) {
    // Determine number of characters in this column
    const colLen = remainder === 0 || colIdx < remainder ? numRows : numRows - 1;
    for (let r = 0; r < colLen; r++) {
      if (grid[r][colIdx] !== null && grid[r][colIdx] !== undefined) {
        ciphertext += grid[r][colIdx];
      }
    }
  }

  return ciphertext;
};

/**
 * Decrypts Columnar Transposition ciphertext.
 * Correctly reconstructs text with incomplete final rows without artificial padding.
 *
 * @param {string} text - Ciphertext to decrypt
 * @param {string} key - Keyword
 * @returns {string} Plaintext
 */
export const decrypt = (text, key) => {
  const str = validateTextInput(text);
  const keyword = validateColumnarKey(key);

  const totalLength = str.length;
  const numCols = keyword.length;

  if (totalLength === 0 || numCols === 1) {
    return str;
  }

  const numRows = Math.ceil(totalLength / numCols);
  const remainder = totalLength % numCols;

  // Calculate the character length of each column in the original grid
  const colLengths = new Array(numCols);
  for (let c = 0; c < numCols; c++) {
    colLengths[c] = remainder === 0 || c < remainder ? numRows : numRows - 1;
  }

  // Get ranked order of columns
  const rankedCols = getRankedColumns(keyword);

  // Distribute ciphertext characters back to their respective columns
  const columnChars = Array.from({ length: numCols }, () => []);
  let cipherIdx = 0;

  for (const colIdx of rankedCols) {
    const len = colLengths[colIdx];
    for (let i = 0; i < len; i++) {
      if (cipherIdx < totalLength) {
        columnChars[colIdx].push(str[cipherIdx++]);
      }
    }
  }

  // Reconstruct original plaintext row-by-row
  let plaintext = '';
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (columnChars[c].length > 0) {
        plaintext += columnChars[c].shift();
      }
    }
  }

  return plaintext;
};

export default {
  encrypt,
  decrypt,
  getRankedColumns,
  validateKey: validateColumnarKey,
};
