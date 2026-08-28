import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Runs BEFORE any protected route. Reads the JWT from the httpOnly
 * cookie, verifies its signature, and — if valid — attaches the full
 * user document to req.user so downstream controllers know who's
 * making the request.
 *
 * This is the ONE place in the whole app that does token verification.
 * Every protected controller just reads req.user and trusts it, rather
 * than each controller re-implementing auth checks itself.
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token.' });
    }

    // jwt.verify throws if the signature is invalid OR if the token
    // has expired — both cases are caught below and treated the same.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // We look the user up fresh from the DB (rather than trusting the
    // token's payload blindly) so that if a user was deleted or
    // banned after the token was issued, they're correctly rejected
    // here rather than being treated as still valid.
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid token.' });
  }
};

export default protect;
