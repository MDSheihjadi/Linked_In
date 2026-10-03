import express from 'express';
import { getUserProfile, getUserPosts, updateProfile } from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/:id', getUserProfile);
router.get('/:id/posts', getUserPosts);
router.patch('/:id', protect, updateProfile);

export default router;
