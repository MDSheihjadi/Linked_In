import mongoose from 'mongoose';
const { Schema } = mongoose;

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, maxlength: 3000 },
    imageUrl: { type: String, default: '' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    sharedFrom: { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;
