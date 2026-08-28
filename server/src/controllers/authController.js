import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import generateTokenAndSetCookie from '../utils/generateToken.js';

/**
 * POST /api/auth/signup
 * Body: { name, email, password }
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters.' });
    }

    // Prevent duplicate accounts. Note: the User schema also has a
    // unique index on email at the DB level as a second line of
    // defense — this check just lets us return a friendly error
    // message instead of a raw duplicate-key error from MongoDB.
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already in use.' });
    }

    // Hash the password BEFORE saving. 10 salt rounds is a solid
    // default — each additional round roughly doubles hashing time,
    // trading a bit of signup latency for brute-force resistance.
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, passwordHash });

    // Log the user in immediately after signup — issue a token so
    // they don't have to log in again right after registering.
    generateTokenAndSetCookie(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      headline: user.headline,
    });
  } catch (err) {
    next(err); // hand off to centralized error middleware
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required.' });
    }

    // passwordHash has `select: false` in the schema, so we must
    // explicitly ask for it here — it's the ONE place in the app that
    // legitimately needs it.
    const user = await User.findOne({ email }).select('+passwordHash');

    // Deliberately vague error message ("Invalid credentials") for
    // BOTH "no such user" and "wrong password" cases. If we said
    // "no account with that email" vs "wrong password" separately,
    // an attacker could use that to figure out which emails are
    // registered on the platform (user enumeration).
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      headline: user.headline,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Clearing the cookie is enough — there's no server-side session to
 * destroy since JWTs are stateless. The token technically remains
 * "valid" until it expires, but the browser no longer has it to send.
 */
export const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully.' });
};
