import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/authRoutes.js';
import connectionRoutes from '../routes/connectionRoutes.js';
import User from '../models/User.js';
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
  app.use('/api/connections', connectionRoutes);
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

async function signedUpAgent(email) {
  const agent = request.agent(app);
  const res = await agent
    .post('/api/auth/signup')
    .send({ name: `User ${email}`, email, password: 'password123' });
  return { agent, userId: res.body._id };
}

describe('Connection request lifecycle', () => {
  test('send -> appears in recipient pending list -> accept -> both users connected', async () => {
    const { agent: alice, userId: aliceId } = await signedUpAgent('alice@ex.com');
    const { agent: bob, userId: bobId } = await signedUpAgent('bob@ex.com');

    const sendRes = await alice.post(`/api/connections/request/${bobId}`);
    expect(sendRes.status).toBe(201);
    expect(sendRes.body.status).toBe('pending');

    const pendingRes = await bob.get('/api/connections/pending');
    expect(pendingRes.body).toHaveLength(1);
    expect(pendingRes.body[0].from._id).toBe(aliceId);

    const acceptRes = await bob.patch(
      `/api/connections/${sendRes.body._id}/accept`
    );
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.status).toBe('accepted');

    const aliceDoc = await User.findById(aliceId);
    const bobDoc = await User.findById(bobId);
    expect(aliceDoc.connections.map((id) => id.toString())).toContain(bobId);
    expect(bobDoc.connections.map((id) => id.toString())).toContain(aliceId);
  });

  test('cannot send a duplicate pending request to the same person', async () => {
    const { agent: alice } = await signedUpAgent('alice2@ex.com');
    const { userId: bobId } = await signedUpAgent('bob2@ex.com');

    const first = await alice.post(`/api/connections/request/${bobId}`);
    expect(first.status).toBe(201);

    const second = await alice.post(`/api/connections/request/${bobId}`);
    expect(second.status).toBe(409);
  });

  test('only the recipient can accept a request, not the sender or a third party', async () => {
    const { agent: alice, userId: aliceId } = await signedUpAgent('alice3@ex.com');
    const { userId: bobId } = await signedUpAgent('bob3@ex.com');
    const { agent: eve } = await signedUpAgent('eve3@ex.com');

    const sendRes = await alice.post(`/api/connections/request/${bobId}`);

    // Sender tries to accept their own request
    const selfAccept = await alice.patch(
      `/api/connections/${sendRes.body._id}/accept`
    );
    expect(selfAccept.status).toBe(403);

    // Unrelated third party tries to accept
    const thirdPartyAccept = await eve.patch(
      `/api/connections/${sendRes.body._id}/accept`
    );
    expect(thirdPartyAccept.status).toBe(403);
  });

  test('cannot send a connection request to yourself', async () => {
    const { agent: alice, userId: aliceId } = await signedUpAgent('alice4@ex.com');
    const res = await alice.post(`/api/connections/request/${aliceId}`);
    expect(res.status).toBe(400);
  });

  test('rejecting a request marks it rejected and does NOT create a connection', async () => {
    const { agent: alice, userId: aliceId } = await signedUpAgent('alice5@ex.com');
    const { agent: bob, userId: bobId } = await signedUpAgent('bob5@ex.com');

    const sendRes = await alice.post(`/api/connections/request/${bobId}`);
    const rejectRes = await bob.patch(
      `/api/connections/${sendRes.body._id}/reject`
    );
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.status).toBe('rejected');

    const aliceDoc = await User.findById(aliceId);
    expect(aliceDoc.connections).toHaveLength(0);
  });
});
