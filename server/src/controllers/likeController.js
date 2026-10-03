import Post from '../models/Post.js';

export const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    const update = alreadyLiked
      ? { $pull: { likes: req.user._id } }
      : { $addToSet: { likes: req.user._id } };

    const updated = await Post.findByIdAndUpdate(post._id, update, { new: true })
      .populate('author', 'name headline avatarUrl');

    res.status(200).json({
      liked: !alreadyLiked,
      likesCount: updated.likes.length,
      post: updated,
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Post not found.' });
    next(err);
  }
};

export const sharePost = async (req, res, next) => {
  try {
    const original = await Post.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Post not found.' });

    const originalId = original.sharedFrom || original._id;

    const repost = await Post.create({
      author: req.user._id,
      content: '',
      sharedFrom: originalId,
    });

    const updatedOriginal = await Post.findByIdAndUpdate(
      originalId,
      { $inc: { sharesCount: 1 } },
      { new: true }
    ).populate('author', 'name headline avatarUrl');

    await repost.populate('author', 'name headline avatarUrl');

    const repostObj = repost.toObject();
    repostObj.sharedFrom = updatedOriginal;

    res.status(201).json(repostObj);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Post not found.' });
    next(err);
  }
};
