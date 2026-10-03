import Post from '../models/Post.js';

export const createPost = async (req, res, next) => {
  try {
    const { content, imageUrl } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content is required.' });
    }
    const post = await Post.create({
      author: req.user._id,
      content,
      imageUrl: imageUrl || '',
    });
    await post.populate('author', 'name headline avatarUrl');
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

export const getFeed = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const { cursor } = req.query;
    const filter = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'name headline avatarUrl')
      .populate({ path: 'sharedFrom', populate: { path: 'author', select: 'name headline avatarUrl' } });

    const nextCursor = posts.length === limit ? posts[posts.length - 1].createdAt : null;
    res.status(200).json({ posts, nextCursor });
  } catch (err) {
    next(err);
  }
};

export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name headline avatarUrl')
      .populate({ path: 'sharedFrom', populate: { path: 'author', select: 'name headline avatarUrl' } });
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    res.status(200).json(post);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Post not found.' });
    }
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post.' });
    }

    await post.deleteOne();

    if (post.sharedFrom) {
      await Post.findByIdAndUpdate(post.sharedFrom, { $inc: { sharesCount: -1 } });
    }

    res.status(200).json({ message: 'Post deleted.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Post not found.' });
    }
    next(err);
  }
};
