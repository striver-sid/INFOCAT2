import { messageService } from '../services/message.service.js';

export class MessageController {
  /**
   * GET /api/v1/messages/inbox/:userId
   */
  async getInbox(req, res, next) {
    try {
      const { userId } = req.params;
      const { page, limit } = req.query;

      const result = messageService.getInboxMessages(userId, { page, limit });

      res.status(200).json({
        success: true,
        data: result.messages,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/messages/sent/:userId
   */
  async getSent(req, res, next) {
    try {
      const { userId } = req.params;
      const { page, limit } = req.query;

      const result = messageService.getSentMessages(userId, { page, limit });

      res.status(200).json({
        success: true,
        data: result.messages,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/messages/:id
   */
  async getMessageById(req, res, next) {
    try {
      const { id } = req.params;
      const message = messageService.getMessageById(id);

      res.status(200).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/messages
   * Accepts senderId, receiverId, algorithm, and ciphertext.
   * Plaintext and encryption keys are strictly disallowed.
   */
  async createMessage(req, res, next) {
    try {
      const message = messageService.createMessage(req.body);
      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/messages/:id/status
   * Updates message status (e.g. 'DECRYPTED' or 'SENT')
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = messageService.updateMessageStatus(id, status);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/messages/:id
   * Permanently deletes a message by ID from SQLite.
   */
  async deleteMessage(req, res, next) {
    try {
      const { id } = req.params;
      messageService.deleteMessage(id);
      res.status(200).json({
        success: true,
        message: `Message #${id} deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/messages/stats/:userId
   * Retrieves dashboard statistics and message counts for a user.
   */
  async getStats(req, res, next) {
    try {
      const { userId } = req.params;
      const stats = messageService.getUserStats(userId);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
export default messageController;
