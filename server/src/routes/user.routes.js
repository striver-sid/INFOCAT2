import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { validateIdParam } from '../middleware/validation.js';

const router = Router();

/**
 * @route   GET /api/v1/users
 * @desc    List all demonstration identities
 * @access  Public (No authentication)
 */
router.get('/', (req, res, next) => userController.getUsers(req, res, next));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Retrieve demonstration identity by ID
 * @access  Public
 */
router.get('/:id', validateIdParam, (req, res, next) => userController.getUserById(req, res, next));

export default router;
