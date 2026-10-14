import { createApp } from './app.js';
import config from './config/env.js';
import { initDatabase, closeDatabase } from './config/database.js';

const startServer = async () => {
  try {
    // Initialize SQLite persistence layer
    initDatabase();

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🔐 CipherMail API Server Running`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🩺 Health: http://localhost:${config.port}${config.apiPrefix}/health`);
      console.log(`⚙️  Environment: ${config.nodeEnv}`);
      console.log(`====================================================`);
    });

    const gracefulShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);
      server.close(() => {
        console.log('[Server] HTTP server closed');
        closeDatabase();
        process.exit(0);
      });

      // Force exit after 5 seconds if not closed
      setTimeout(() => {
        console.error('[Server] Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
