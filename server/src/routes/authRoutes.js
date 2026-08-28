import express from 'express';
import { signup, login, logout } from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// A quick "who am I" endpoint — the frontend calls this on app load
// to check if the user is already logged in (cookie still valid),
// without needing to store user info in localStorage.
router.get('/me', protect, (req, res) => {
  res.status(200).json(req.user);
});

export default router;
