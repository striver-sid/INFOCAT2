/**
 * Custom application HTTP errors for clean error handling.
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.status = statusCode;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request payload') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export default {
  AppError,
  NotFoundError,
  ValidationError,
};
