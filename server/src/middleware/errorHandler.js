import config from '../config/env.js';

/**
 * Centralized Error Handling Middleware.
 * Catches all unhandled exceptions, validation errors, and bad requests.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const isDev = config.nodeEnv === 'development';

  // Handle malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON_BODY',
        message: 'The request body contains invalid JSON syntax.',
      },
    });
  }

  // Handle CORS rejection
  if (err.message && err.message.startsWith('CORS Error')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_FORBIDDEN',
        message: err.message,
      },
    });
  }

  console.error(`[Error] ${req.method} ${req.originalUrl} failed:`, err);

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal error occurred on the server.',
      ...(isDev && { stack: err.stack }),
    },
  });
};

export default errorHandler;
