import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/authRoutes.js';
import postRoutes from '../routes/postRoutes.js';
import errorHandler from '../middleware/errorMiddleware.js';

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  process.env.JWT_SECRET = 'test_secret';

  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use(errorHandler);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) await c.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Helper: signs up a user and returns a supertest agent that carries
// their session cookie on every subsequent request, like a browser tab.
async function signedUpAgent(email) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/signup').send({
    name: `User ${email}`,
    email,
    password: 'password123',
  });
  return { agent, userId: res.body._id };
}

describe('POST /api/posts', () => {
  test('requires authentication', async () => {
    const res = await request(app).post('/api/posts').send({ content: 'hi' });
    expect(res.status).toBe(401);
  });

  test('creates a post owned by the logged-in user, ignoring any author sent in the body', async () => {
    const { agent, userId } = await signedUpAgent('alice@example.com');
    const someoneElsesId = new mongoose.Types.ObjectId().toString();

    const res = await agent
      .post('/api/posts')
      .send({ content: 'My first post', author: someoneElsesId }); // attempted spoof

    expect(res.status).toBe(201);
    expect(res.body.author._id).toBe(userId); // spoof attempt was ignored
  });

  test('rejects empty content', async () => {
    const { agent } = await signedUpAgent('bob@example.com');
    const res = await agent.post('/api/posts').send({ content: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/posts (feed pagination)', () => {
  test('returns posts newest-first with a working cursor', async () => {
    const { agent } = await signedUpAgent('carol@example.com');
    for (let i = 0; i < 15; i++) {
      await agent.post('/api/posts').send({ content: `Post ${i}` });
    }

    const page1 = await request(app).get('/api/posts?limit=10');
    expect(page1.body.posts).toHaveLength(10);
    expect(page1.body.nextCursor).not.toBeNull();
    // newest first: last post created should be first in the list
    expect(page1.body.posts[0].content).toBe('Post 14');

    const page2 = await request(app).get(
      `/api/posts?limit=10&cursor=${page1.body.nextCursor}`
    );
    expect(page2.body.posts).toHaveLength(5);
    expect(page2.body.nextCursor).toBeNull(); // reached the end

    // No overlap between pages
    const page1Ids = page1.body.posts.map((p) => p._id);
    const page2Ids = page2.body.posts.map((p) => p._id);
    expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false);
  });
});

describe('DELETE /api/posts/:id (ownership enforcement)', () => {
  test("a user cannot delete another user's post", async () => {
    const { agent: alice } = await signedUpAgent('alice2@example.com');
    const { agent: bob } = await signedUpAgent('bob2@example.com');

    const createRes = await alice.post('/api/posts').send({ content: "Alice's post" });
    const postId = createRes.body._id;

    const deleteRes = await bob.delete(`/api/posts/${postId}`);
    expect(deleteRes.status).toBe(403);

    // Confirm it's genuinely still there
    const getRes = await request(app).get(`/api/posts/${postId}`);
    expect(getRes.status).toBe(200);
  });

  test('the owner CAN delete their own post', async () => {
    const { agent } = await signedUpAgent('dave@example.com');
    const createRes = await agent.post('/api/posts').send({ content: 'Delete me' });
    const postId = createRes.body._id;

    const deleteRes = await agent.delete(`/api/posts/${postId}`);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app).get(`/api/posts/${postId}`);
    expect(getRes.status).toBe(404);
  });
});

describe('POST /api/posts/:id/like (toggle + idempotency)', () => {
  test('liking then liking again toggles off, never double-counts', async () => {
    const { agent: author } = await signedUpAgent('eve@example.com');
    const { agent: liker } = await signedUpAgent('frank@example.com');

    const createRes = await author.post('/api/posts').send({ content: 'Like this' });
    const postId = createRes.body._id;

    const like1 = await liker.post(`/api/posts/${postId}/like`);
    expect(like1.body.liked).toBe(true);
    expect(like1.body.likesCount).toBe(1);

    const like2 = await liker.post(`/api/posts/${postId}/like`);
    expect(like2.body.liked).toBe(false);
    expect(like2.body.likesCount).toBe(0); // toggled back off, not stuck at 2
  });
});
