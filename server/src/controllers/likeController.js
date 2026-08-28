import Post from '../models/Post.js';

// POST /api/posts/:id/like  -> toggles like/unlike for the requesting user
export const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    // $addToSet / $pull are atomic MongoDB set operations. Using
    // $addToSet instead of $push means even if this endpoint were
    // called twice in a race, the user's ID can never appear twice
    // in the likes array — Mongo itself enforces set semantics.
    const update = alreadyLiked
      ? { $pull: { likes: req.user._id } }
      : { $addToSet: { likes: req.user._id } };

    const updated = await Post.findByIdAndUpdate(post._id, update, {
      new: true,
    }).populate('author', 'name headline avatarUrl');

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

// POST /api/posts/:id/share -> increments the share counter.
// Real LinkedIn-style "share" reposts content into your own feed as a
// new post referencing the original; that's a bigger feature (needs a
// `sharedFrom` ref on Post). For this project's scope, we track the
// share COUNT — the part actually visible in the UI — via a simple
// atomic increment, same pattern as likes/comments.
export const sharePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { sharesCount: 1 } },
      { new: true }
    ).populate('author', 'name headline avatarUrl');

    if (!post) return res.status(404).json({ message: 'Post not found.' });
    res.status(200).json(post);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Post not found.' });
    next(err);
  }
};
