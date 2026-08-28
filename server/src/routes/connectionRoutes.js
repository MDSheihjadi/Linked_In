import express from 'express';
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getPendingRequests,
} from '../controllers/connectionController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/request/:userId', protect, sendRequest);
router.patch('/:requestId/accept', protect, acceptRequest);
router.patch('/:requestId/reject', protect, rejectRequest);
router.get('/pending', protect, getPendingRequests);

export default router;
