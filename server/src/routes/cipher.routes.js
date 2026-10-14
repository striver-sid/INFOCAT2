import { Router } from 'express';
import { cipherController } from '../controllers/cipher.controller.js';

const router = Router();

/**
 * @route   POST /api/v1/cipher/:algorithm/encrypt
 * @desc    Encrypts text using the specified algorithm
 * @access  Public
 */
router.post('/:algorithm/encrypt', (req, res, next) => {
  cipherController.encrypt(req, res, next);
});

/**
 * @route   POST /api/v1/cipher/:algorithm/decrypt
 * @desc    Decrypts text using the specified algorithm
 * @access  Public
 */
router.post('/:algorithm/decrypt', (req, res, next) => {
  cipherController.decrypt(req, res, next);
});

export default router;
