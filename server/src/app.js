import express from 'express';
import helmet from 'helmet';
import config from './config/env.js';
import corsMiddleware from './middleware/cors.js';
import requestLogger from './middleware/logger.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

export const createApp = () => {
  const app = express();

  // Security Headers
  app.use(helmet());

  // Explicit CORS Policy
  app.use(corsMiddleware());

  // Request Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Request Logging
  app.use(requestLogger);

  // Mount API Routes (e.g. /api/v1)
  app.use(config.apiPrefix, apiRoutes);

  // Root welcome endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'CipherMail Backend API Server',
      status: 'online',
      version: '1.0.0',
      documentation: `${config.apiPrefix}/health`,
    });
  });

  // Catch-all 404 handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
