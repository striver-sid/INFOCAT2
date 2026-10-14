import cors from 'cors';
import config from '../config/env.js';

export const corsMiddleware = () => {
  const allowedOrigins = config.cors.origin;

  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins === '*' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error(`CORS Error: Origin '${origin}' is not authorized.`);
      error.status = 403;
      return callback(error, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400, // 24 hours
  };

  return cors(corsOptions);
};

export default corsMiddleware;
