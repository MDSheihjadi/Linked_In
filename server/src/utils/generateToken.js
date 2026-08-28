import jwt from 'jsonwebtoken';

/**
 * Signs a JWT containing the user's ID, and attaches it to the
 * response as an httpOnly cookie.
 *
 * httpOnly: true    -> JavaScript on the frontend CANNOT read this
 *                       cookie (document.cookie won't show it). This
 *                       is the main defense against XSS stealing the
 *                       token.
 * sameSite: 'lax'   -> browser won't send this cookie on most
 *                       cross-site requests, which blunts CSRF.
 * secure: true       -> cookie is only sent over HTTPS in production
 *                       (disabled in dev since localhost is usually http).
 * maxAge             -> cookie (and effectively the session) expires
 *                       after 7 days — matches the JWT's own expiry.
 */
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  return token;
};

export default generateTokenAndSetCookie;
