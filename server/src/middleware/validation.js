/**
 * Request validation middleware functions for User and Message endpoints.
 */

/**
 * Validates that an ID route parameter represents a valid positive integer.
 * @param {string} paramName - Parameter name (e.g. 'id', 'userId')
 */
export const validateNumericId = (paramName) => (req, res, next) => {
  const value = req.params[paramName];
  const parsed = parseInt(value, 10);

  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(value).trim()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid identifier '${value}' for parameter '${paramName}'. Must be a positive integer.`,
      },
    });
  }

  req.params[paramName] = parsed;
  next();
};

export const validateUserId = validateNumericId('userId');
export const validateIdParam = validateNumericId('id');

/**
 * Sanitizes and validates pagination query parameters.
 */
export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: "Query parameter 'page' must be a positive integer >= 1.",
        },
      });
    }
  }

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: "Query parameter 'limit' must be an integer between 1 and 100.",
        },
      });
    }
  }

  next();
};

export default {
  validateNumericId,
  validateUserId,
  validateIdParam,
  validatePagination,
};
