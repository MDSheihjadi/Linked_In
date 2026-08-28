import User from '../models/User.js';
import Post from '../models/Post.js';

// GET /api/search?q=...&type=user|post
export const search = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Query param "q" is required.' });
    }

    if (type === 'user') {
      // $text uses the text index defined on the User schema
      // (name + headline). $meta: 'textScore' sorts by relevance,
      // not just recency/alphabetical.
      const users = await User.find(
        { $text: { $search: q } },
        { score: { $meta: 'textScore' } }
      )
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

    // No type specified -> search both
    const [users, posts] = await Promise.all([
      User.find(
        { $text: { $search: q } },
        { score: { $meta: 'textScore' } }
      )
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
