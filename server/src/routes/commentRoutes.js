import express from 'express';
import { addComment, getComments } from '../controllers/commentController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });
router.post('/', protect, addComment);
router.get('/', getComments);

export default router;
