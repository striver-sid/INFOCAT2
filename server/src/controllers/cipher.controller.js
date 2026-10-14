import { getCipher } from '../algorithms/index.js';
import { ALLOWED_ALGORITHMS } from '../models/schema.js';
import { ValidationError } from '../utils/errors.js';

export class CipherController {
  /**
   * POST /api/v1/cipher/:algorithm/encrypt
   * Encrypts plaintext using the selected classical cipher.
   */
  async encrypt(req, res, next) {
    try {
      const { algorithm } = req.params;
      const { text, key } = req.body;

      if (!algorithm || !ALLOWED_ALGORITHMS.includes(algorithm)) {
        throw new ValidationError(
          `Invalid algorithm '${algorithm}'. Must be one of: ${ALLOWED_ALGORITHMS.join(', ')}.`
        );
      }

      if (text === undefined || text === null || typeof text !== 'string') {
        throw new ValidationError("Field 'text' must be a valid string.");
      }

      if (text.trim().length === 0) {
        throw new ValidationError("Field 'text' cannot be empty.");
      }

      if (key === undefined || key === null || (typeof key === 'string' && key.trim().length === 0)) {
        throw new ValidationError(`Encryption key is required for algorithm '${algorithm}'.`);
      }

      const cipher = getCipher(algorithm);
      let ciphertext;
      try {
        ciphertext = cipher.encrypt(text, key);
      } catch (cipherErr) {
        throw new ValidationError(`Encryption error: ${cipherErr.message}`);
      }

      return res.status(200).json({
        success: true,
        data: {
          algorithm,
          ciphertext,
          length: ciphertext.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/cipher/:algorithm/decrypt
   * Decrypts ciphertext using the selected classical cipher.
   */
  async decrypt(req, res, next) {
    try {
      const { algorithm } = req.params;
      const rawText = req.body.text !== undefined ? req.body.text : req.body.ciphertext;
      const { key } = req.body;

      if (!algorithm || !ALLOWED_ALGORITHMS.includes(algorithm)) {
        throw new ValidationError(
          `Invalid algorithm '${algorithm}'. Must be one of: ${ALLOWED_ALGORITHMS.join(', ')}.`
        );
      }

      if (rawText === undefined || rawText === null || typeof rawText !== 'string') {
        throw new ValidationError("Field 'text' or 'ciphertext' must be a valid string.");
      }

      if (rawText.trim().length === 0) {
        throw new ValidationError("Field 'text' or 'ciphertext' cannot be empty.");
      }

      if (key === undefined || key === null || (typeof key === 'string' && key.trim().length === 0)) {
        throw new ValidationError(`Decryption key is required for algorithm '${algorithm}'.`);
      }

      const cipher = getCipher(algorithm);
      let plaintext;
      try {
        plaintext = cipher.decrypt(rawText, key);
      } catch (cipherErr) {
        throw new ValidationError(`Decryption error: ${cipherErr.message}`);
      }

      return res.status(200).json({
        success: true,
        data: {
          algorithm,
          plaintext,
          length: plaintext.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cipherController = new CipherController();
export default cipherController;
