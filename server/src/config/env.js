import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from the server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const parseOrigins = (rawOrigins) => {
  if (!rawOrigins || rawOrigins === '*') {
    return rawOrigins === '*' ? '*' : ['http://localhost:5173'];
  }
  return rawOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);
};

export const config = Object.freeze({
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  cors: {
    origin: parseOrigins(process.env.CORS_ORIGIN),
    credentials: true,
  },
  database: {
    path: process.env.DB_PATH || path.resolve(__dirname, '../../data/ciphermail.db'),
  },
  apiPrefix: process.env.API_PREFIX || '/api/v1',
});

export default config;
