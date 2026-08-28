import mongoose from 'mongoose';

const { Schema } = mongoose;

const postSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // fast lookup: "all posts by this author" for profile pages
    },
    content: {
      type: String,
      required: true,
      maxlength: 3000,
    },
    imageUrl: {
      type: String,
      default: '',
    },

    // Embedded array of ObjectIds. Fine at moderate scale — lets you
    // check "did this user like this post" and get a like count with
    // zero extra queries. Tradeoff: a post that goes viral with 50k+
    // likes would grow this array unboundedly and every like/unlike
    // becomes a write against an increasingly large document. If this
    // were a real product at scale, likes would move to their own
    // collection (postId, userId) with a compound unique index, same
    // as comments below. For this project, embedded is the right call
    // — but know why.
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Denormalized counter, NOT derived by counting the Comment
    // collection on every read. Keeping a running count means
    // rendering a feed of 20 posts costs one query, not 20 extra
    // COUNT queries. Updated atomically via $inc when a comment is
    // created/deleted (see commentController). The cost of this
    // approach is it can drift out of sync if a write path forgets
    // to update it — acceptable tradeoff for read-heavy feed UX.
    commentsCount: {
      type: Number,
      default: 0,
    },

    sharesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Feed queries sort by recency — index createdAt descending so
// `Post.find().sort({ createdAt: -1 })` doesn't do a collection scan.
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
