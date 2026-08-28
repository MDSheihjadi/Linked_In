/**
 * Centralized error handler. Any error passed to next(err) from
 * anywhere in the app lands here, instead of every controller
 * formatting its own error responses.
 *
 * Must be registered LAST in index.js, after all routes — Express
 * error middleware is identified by having 4 parameters (err, req, res, next).
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation errors (e.g. missing required field) have a
  // specific shape worth surfacing cleanly instead of a generic 500.
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Duplicate key error (e.g. email unique index violated at the DB
  // level — the second line of defense mentioned in the signup
  // controller).
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate field value.' });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Server error.',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export default errorHandler;
