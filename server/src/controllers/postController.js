import Post from '../models/Post.js';

/**
 * POST /api/posts
 * Protected — requires req.user from authMiddleware.
 * Body: { content, imageUrl? }
 */
export const createPost = async (req, res, next) => {
  try {
    const { content, imageUrl } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content is required.' });
    }

    const post = await Post.create({
      author: req.user._id, // NEVER trust an authorId from the request body —
      content,               // always derive "who" from the authenticated
      imageUrl: imageUrl || '', // session, or anyone could post as anyone else.
    });

    // Populate author details so the frontend gets a ready-to-render
    // post (name/avatar) without a second request.
    await post.populate('author', 'name headline avatarUrl');

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/posts?cursor=<ISO timestamp>&limit=10
 * Public feed, cursor-paginated by createdAt.
 *
 * Why cursor, not page-number (skip/limit)? Offset pagination
 * (skip: 20, limit: 10) gets slower as the offset grows (Mongo still
 * has to walk past the skipped documents), and is inconsistent if
 * new posts are added between page loads (items shift, you can see
 * duplicates or skip posts). Cursor pagination ("give me everything
 * older than this timestamp") is stable and fast at any depth because
 * it uses the createdAt index directly as a filter, not an offset.
 */
export const getFeed = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // cap to prevent abuse
    const { cursor } = req.query;

    const filter = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'name headline avatarUrl');

    // The cursor for the NEXT page is just the createdAt of the last
    // post we returned. Frontend sends this back as ?cursor=... to
    // get the next batch. If we got fewer than `limit` results, we've
    // reached the end.
    const nextCursor =
      posts.length === limit ? posts[posts.length - 1].createdAt : null;

    res.status(200).json({ posts, nextCursor });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/posts/:id
 */
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'author',
      'name headline avatarUrl'
    );
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    res.status(200).json(post);
  } catch (err) {
    // Mongoose throws a CastError if :id isn't a valid ObjectId shape
    // (e.g. someone hits /api/posts/hello). Treat that as "not found"
    // rather than leaking a raw DB error to the client.
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Post not found.' });
    }
    next(err);
  }
};

/**
 * DELETE /api/posts/:id
 * Protected — and ownership-checked: a user can only delete their OWN posts.
 */
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Ownership check: compare the post's author to the logged-in
    // user. This is the difference between "authenticated" (we know
    // who you are) and "authorized" (you're allowed to do THIS
    // specific action). Auth middleware only proves the first one —
    // every controller that mutates data needs to check the second
    // one itself.
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this post.' });
    }

    await post.deleteOne();
    res.status(200).json({ message: 'Post deleted.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Post not found.' });
    }
    next(err);
  }
};
