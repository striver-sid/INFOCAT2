import { messageRepository } from '../repositories/message.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { ALLOWED_ALGORITHMS, ALLOWED_STATUSES } from '../models/schema.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class MessageService {
  /**
   * Retrieves a single message by ID.
   * @param {number} id 
   * @returns {object}
   */
  getMessageById(id) {
    const message = messageRepository.findById(id);
    if (!message) {
      throw new NotFoundError(`Message with ID '${id}' was not found.`);
    }
    return message;
  }

  /**
   * Retrieves paginated inbox messages for a given user.
   * Ensures the user exists before querying messages.
   * @param {number} userId 
   * @param {{ page?: number, limit?: number }} pagination 
   * @returns {object}
   */
  getInboxMessages(userId, pagination = {}) {
    const user = userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID '${userId}' was not found.`);
    }

    return messageRepository.listInbox(userId, pagination);
  }

  /**
   * Retrieves paginated sent messages dispatched by a given user.
   * Ensures the user exists before querying messages.
   * @param {number} userId 
   * @param {{ page?: number, limit?: number }} pagination 
   * @returns {object}
   */
  getSentMessages(userId, pagination = {}) {
    const user = userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID '${userId}' was not found.`);
    }

    return messageRepository.listSent(userId, pagination);
  }

  /**
   * Creates a new ciphertext message with validation.
   * Ensures plaintext and encryption keys are strictly disallowed.
   * @param {{ senderId?: number, receiverId?: number, sender_id?: number, receiver_id?: number, algorithm: string, ciphertext: string, status?: string }} data 
   * @returns {object}
   */
  createMessage(data) {
    const { plaintext, key } = data;
    if (plaintext !== undefined || key !== undefined) {
      throw new ValidationError(
        'Plaintext and encryption keys must never be transmitted or persisted to the message-creation endpoint.'
      );
    }

    const sender_id = Number(data.senderId ?? data.sender_id);
    const receiver_id = Number(data.receiverId ?? data.receiver_id);
    const { algorithm, ciphertext, status = 'SENT' } = data;

    if (!sender_id || isNaN(sender_id) || sender_id <= 0) {
      throw new ValidationError("Field 'senderId' must be a positive integer.");
    }

    if (!receiver_id || isNaN(receiver_id) || receiver_id <= 0) {
      throw new ValidationError("Field 'receiverId' must be a positive integer.");
    }

    if (sender_id === receiver_id) {
      throw new ValidationError('Sender and receiver cannot be the same user in CipherMail.');
    }

    const sender = userRepository.findById(sender_id);
    if (!sender) {
      throw new NotFoundError(`Sender with ID '${sender_id}' was not found.`);
    }

    const receiver = userRepository.findById(receiver_id);
    if (!receiver) {
      throw new NotFoundError(`Receiver with ID '${receiver_id}' was not found.`);
    }

    if (!algorithm || !ALLOWED_ALGORITHMS.includes(algorithm)) {
      throw new ValidationError(
        `Invalid algorithm '${algorithm}'. Must be one of: ${ALLOWED_ALGORITHMS.join(', ')}.`
      );
    }

    if (!ciphertext || typeof ciphertext !== 'string' || ciphertext.trim().length === 0) {
      throw new ValidationError("Field 'ciphertext' is required and cannot be empty.");
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      throw new ValidationError(
        `Invalid status '${status}'. Must be one of: ${ALLOWED_STATUSES.join(', ')}.`
      );
    }

    return messageRepository.create({
      sender_id,
      receiver_id,
      algorithm,
      ciphertext: ciphertext.trim(),
      status: status || 'SENT',
    });
  }

  /**
   * Updates message status.
   * @param {number} id 
   * @param {string} status 
   * @returns {object}
   */
  updateMessageStatus(id, status) {
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      throw new ValidationError(
        `Invalid status '${status}'. Must be one of: ${ALLOWED_STATUSES.join(', ')}.`
      );
    }

    // Verify existence
    this.getMessageById(id);

    return messageRepository.updateStatus(id, status);
  }

  /**
   * Deletes a message by ID.
   * @param {number} id 
   * @returns {boolean}
   */
  deleteMessage(id) {
    // Verify existence
    this.getMessageById(id);

    return messageRepository.delete(id);
  }

  /**
   * Retrieves dashboard statistics and message counts for a user.
   * @param {number|string} userId 
   * @returns {object}
   */
  getUserStats(userId) {
    // Verify user existence
    const user = userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID '${userId}' was not found.`);
    }

    return messageRepository.getStats(userId);
  }
}

export const messageService = new MessageService();
export default messageService;
