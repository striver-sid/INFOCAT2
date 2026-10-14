import { Router } from 'express';
import { messageController } from '../controllers/message.controller.js';
import { validateUserId, validateIdParam, validatePagination } from '../middleware/validation.js';

const router = Router();

/**
 * @route   GET /api/v1/messages/inbox/:userId
 * @desc    Get paginated inbox messages received by the user (newest first)
 * @access  Public
 */
router.get('/inbox/:userId', validateUserId, validatePagination, (req, res, next) => {
  messageController.getInbox(req, res, next);
});

/**
 * @route   GET /api/v1/messages/sent/:userId
 * @desc    Get paginated sent messages dispatched by the user (newest first)
 * @access  Public
 */
router.get('/sent/:userId', validateUserId, validatePagination, (req, res, next) => {
  messageController.getSent(req, res, next);
});

/**
 * @route   GET /api/v1/messages/stats/:userId
 * @desc    Get dashboard metrics, message counts, and status statistics for a user
 * @access  Public
 */
router.get('/stats/:userId', validateUserId, (req, res, next) => {
  messageController.getStats(req, res, next);
});

/**
 * @route   GET /api/v1/messages/:id
 * @desc    Get single ciphertext message by ID
 * @access  Public
 */
router.get('/:id', validateIdParam, (req, res, next) => {
  messageController.getMessageById(req, res, next);
});

/**
 * @route   POST /api/v1/messages
 * @desc    Create and store a newly encrypted ciphertext message (status: SENT)
 * @access  Public
 */
router.post('/', (req, res, next) => {
  messageController.createMessage(req, res, next);
});

/**
 * @route   PATCH /api/v1/messages/:id/status
 * @desc    Update status of an existing message (e.g. DECRYPTED)
 * @access  Public
 */
router.patch('/:id/status', validateIdParam, (req, res, next) => {
  messageController.updateStatus(req, res, next);
});

/**
 * @route   DELETE /api/v1/messages/:id
 * @desc    Permanently delete a message by ID from SQLite
 * @access  Public
 */
router.delete('/:id', validateIdParam, (req, res, next) => {
  messageController.deleteMessage(req, res, next);
});

export default router;
