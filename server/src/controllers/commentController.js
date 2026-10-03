import Comment from '../models/Comment.js';
import Post from '../models/Post.js';

export const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const comment = await Comment.create({ post: post._id, author: req.user._id, text });
    await comment.populate('author', 'name headline avatarUrl');

    await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });

    res.status(201).json(comment);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Post not found.' });
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const { cursor } = req.query;
    const filter = { post: req.params.postId };
    if (cursor) filter.createdAt = { $lt: new Date(cursor) };

    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'name headline avatarUrl');

    const nextCursor = comments.length === limit ? comments[comments.length - 1].createdAt : null;
    res.status(200).json({ comments, nextCursor });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    res.status(200).json({ message: 'Comment deleted.' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Comment not found.' });
    next(err);
  }
};
