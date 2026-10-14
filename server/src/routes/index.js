import { Router } from 'express';
import healthRoutes from './health.routes.js';
import userRoutes from './user.routes.js';
import messageRoutes from './message.routes.js';
import cipherRoutes from './cipher.routes.js';

const router = Router();

// Mount Module Routes
router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/messages', messageRoutes);
router.use('/cipher', cipherRoutes);

// Root API v1 info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'CipherMail API',
    version: '1.2.0',
    description: 'Secure Internal Messaging System Using Classical Cryptography',
    endpoints: {
      health: '/api/v1/health',
      users: '/api/v1/users',
      userById: '/api/v1/users/:id',
      inbox: '/api/v1/messages/inbox/:userId',
      sent: '/api/v1/messages/sent/:userId',
      messageById: '/api/v1/messages/:id',
      createMessage: 'POST /api/v1/messages',
      encrypt: 'POST /api/v1/cipher/:algorithm/encrypt',
      decrypt: 'POST /api/v1/cipher/:algorithm/decrypt',
    },
  });
});

export default router;
