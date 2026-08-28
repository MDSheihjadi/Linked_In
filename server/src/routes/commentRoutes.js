import express from 'express';
import { addComment, getComments } from '../controllers/commentController.js';
import protect from '../middleware/authMiddleware.js';

// mergeParams lets this router (mounted at /posts/:postId/comments)
// access :postId from the parent router.
const router = express.Router({ mergeParams: true });

router.post('/', protect, addComment);
router.get('/', getComments);

export default router;
