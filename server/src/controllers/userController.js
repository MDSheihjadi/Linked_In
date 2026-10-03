import User from '../models/User.js';
import Post from '../models/Post.js';

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(user);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'User not found.' });
    next(err);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const { cursor } = req.query;
    const filter = { author: req.params.id };
    if (cursor) filter.createdAt = { $lt: new Date(cursor) };

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'name headline avatarUrl');

    const nextCursor = posts.length === limit ? posts[posts.length - 1].createdAt : null;
    res.status(200).json({ posts, nextCursor });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own profile.' });
    }

    const allowedFields = ['name', 'headline', 'bio', 'avatarUrl'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
