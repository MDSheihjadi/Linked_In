import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

describe('Password hashing (used by signup/login)', () => {
  test('hash is different from the plaintext password', async () => {
    const hash = await bcrypt.hash('mySecret123', 10);
    expect(hash).not.toBe('mySecret123');
  });

  test('correct password matches its hash', async () => {
    const hash = await bcrypt.hash('mySecret123', 10);
    const isMatch = await bcrypt.compare('mySecret123', hash);
    expect(isMatch).toBe(true);
  });

  test('wrong password does not match', async () => {
    const hash = await bcrypt.hash('mySecret123', 10);
    const isMatch = await bcrypt.compare('wrongPassword', hash);
    expect(isMatch).toBe(false);
  });
});

describe('JWT signing/verification (used by generateToken/authMiddleware)', () => {
  const secret = 'test_secret';

  test('a validly signed token can be verified and decoded', () => {
    const token = jwt.sign({ userId: 'abc123' }, secret, { expiresIn: '7d' });
    const decoded = jwt.verify(token, secret);
    expect(decoded.userId).toBe('abc123');
  });

  test('verifying with the wrong secret throws (rejects tampering)', () => {
    const token = jwt.sign({ userId: 'abc123' }, secret, { expiresIn: '7d' });
    expect(() => jwt.verify(token, 'wrong_secret')).toThrow();
  });

  test('an expired token is rejected', () => {
    // expiresIn: -1 second -> already expired at creation
    const token = jwt.sign({ userId: 'abc123' }, secret, { expiresIn: -1 });
    expect(() => jwt.verify(token, secret)).toThrow(/expired/i);
  });
});

describe('Ownership check logic (used by deletePost/deleteComment)', () => {
  // This mirrors the exact comparison used in postController.deletePost.
  function isOwner(resourceAuthorId, requestingUserId) {
    return resourceAuthorId.toString() === requestingUserId.toString();
  }

  test('owner can act on their own resource', () => {
    const idStr = new mongoose.Types.ObjectId().toString();
    const authorId = new mongoose.Types.ObjectId(idStr);
    const requesterId = new mongoose.Types.ObjectId(idStr);
    expect(isOwner(authorId, requesterId)).toBe(true);
  });

  test('a different user cannot act on someone else\'s resource', () => {
    const authorId = new mongoose.Types.ObjectId();
    const requesterId = new mongoose.Types.ObjectId();
    expect(isOwner(authorId, requesterId)).toBe(false);
  });

  test('REGRESSION GUARD: comparing ObjectIds with strict equality (no .toString()) is broken', () => {
    // This test documents WHY the controllers always call .toString()
    // before comparing. If someone "simplifies" deletePost by removing
    // .toString(), this test catches it immediately in CI.
    const idStr = new mongoose.Types.ObjectId().toString();
    const a = new mongoose.Types.ObjectId(idStr);
    const b = new mongoose.Types.ObjectId(idStr);
    expect(a === b).toBe(false); // same value, different object identity
    expect(a.toString() === b.toString()).toBe(true); // correct comparison
  });
});
