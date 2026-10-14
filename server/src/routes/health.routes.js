import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Get system status, runtime metrics, and database health
 * @access  Public
 */
router.get('/', (req, res, next) => healthController.getHealth(req, res, next));

export default router;
