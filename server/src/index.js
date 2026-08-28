import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import commentDeleteRoutes from './routes/commentDeleteRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import errorHandler from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();

// --- Core middleware ---
app.use(express.json()); // parse JSON request bodies
app.use(cookieParser()); // parse cookies into req.cookies (needed for JWT auth)

// CORS must explicitly name the frontend origin (not '*') because we
// use credentials (cookies) — browsers reject wildcard origin + credentials.
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentDeleteRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- Error handling — must be LAST ---
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();

export default app;
