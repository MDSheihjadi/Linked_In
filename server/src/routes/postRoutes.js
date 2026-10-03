import express from 'express';
import { createPost, getFeed, getPostById, deletePost } from '../controllers/postController.js';
import { toggleLike, sharePost } from '../controllers/likeController.js';
import protect from '../middleware/authMiddleware.js';
import commentRoutes from './commentRoutes.js';

const router = express.Router();

router.use('/:postId/comments', commentRoutes);

router.get('/', getFeed);
router.get('/:id', getPostById);
router.post('/', protect, createPost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/share', protect, sharePost);

export default router;
