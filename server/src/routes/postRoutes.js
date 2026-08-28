import express from 'express';
import {
  createPost,
  getFeed,
  getPostById,
  deletePost,
} from '../controllers/postController.js';
import { toggleLike, sharePost } from '../controllers/likeController.js';
import protect from '../middleware/authMiddleware.js';
import commentRoutes from './commentRoutes.js';

const router = express.Router();

// Nest comments under posts: POST/GET /api/posts/:postId/comments
// mergeParams in commentRoutes.js is what lets that router see :postId.
router.use('/:postId/comments', commentRoutes);

router.get('/', getFeed);
router.get('/:id', getPostById);
router.post('/', protect, createPost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/share', protect, sharePost);

export default router;
