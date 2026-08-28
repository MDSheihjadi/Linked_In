import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/authRoutes.js';
import errorHandler from '../middleware/errorMiddleware.js';

// NOTE: this suite needs to download a real MongoDB binary the first
// time it runs (mongodb-memory-server does this automatically). It
// could NOT be executed in the sandboxed environment these files were
// authored in, since that sandbox's network is locked to an allowlist
// that doesn't include MongoDB's download servers. Run it locally —
// `npm test` — and it will download once, then run fully offline
// after that.

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  process.env.JWT_SECRET = 'test_secret_for_integration_tests';

  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
});

afterEach(async () => {
  // Wipe all collections between tests so each test starts from a
  // clean slate — tests should never depend on execution order.
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('POST /api/auth/signup', () => {
  test('creates a user and returns it without the password hash', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('test@example.com');
    expect(res.body.passwordHash).toBeUndefined(); // never leaked
    expect(res.headers['set-cookie']).toBeDefined(); // JWT cookie set
  });

  test('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'A',
      email: 'dupe@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/signup').send({
      name: 'B',
      email: 'dupe@example.com',
      password: 'password456',
    });

    expect(res.status).toBe(409);
  });

  test('rejects a password shorter than 6 characters', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Short Pass',
      email: 'short@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'correctPassword',
    });
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'correctPassword',
    });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrongPassword',
    });
    expect(res.status).toBe(401);
  });

  test('rejects unknown email with the SAME error as wrong password (no user enumeration)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'doesnotexist@example.com',
      password: 'whatever',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials.');
  });
});

describe('GET /api/auth/me', () => {
  test('rejects a request with no cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns the user when a valid session cookie is present', async () => {
    const agent = request.agent(app); // agent persists cookies across requests, like a browser
    await agent.post('/api/auth/signup').send({
      name: 'Session User',
      email: 'session@example.com',
      password: 'password123',
    });

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('session@example.com');
  });
});
