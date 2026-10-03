import User from '../models/User.js';
import Post from '../models/Post.js';

export const search = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Query param "q" is required.' });
    }

    if (type === 'user') {
      const users = await User.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(20);
      return res.status(200).json({ users });
    }

    if (type === 'post') {
      const posts = await Post.find({ content: { $regex: q, $options: 'i' } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('author', 'name headline avatarUrl');
      return res.status(200).json({ posts });
    }

    const [users, posts] = await Promise.all([
      User.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(10),
      Post.find({ content: { $regex: q, $options: 'i' } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('author', 'name headline avatarUrl'),
    ]);

    res.status(200).json({ users, posts });
  } catch (err) {
    next(err);
  }
};
