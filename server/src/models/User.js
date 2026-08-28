import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // select: false → passwordHash is NEVER returned by default on any
    // find query. You have to explicitly .select('+passwordHash') for
    // login. This is the single biggest "gotcha" people forget and end
    // up leaking hashes in API responses.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    headline: {
      type: String,
      default: '',
      maxlength: 150,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    avatarUrl: {
      type: String,
      default: '',
    },

    // Referenced, not embedded — a user's connection list is unbounded
    // and grows independently of the User document's own fields.
    // Embedding would risk hitting MongoDB's 16MB doc cap for popular
    // users and would make every profile fetch pull the whole graph.
    // Confirmed (accepted) connections only. Pending/rejected requests
    // live in their own ConnectionRequest collection now — this array
    // just tracks "who is this person already connected to," which is
    // what you check most often (e.g. "show connections on profile").
    connections: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
  }
);

// Text index enables $text search across name + headline for the
// search/discovery feature later, without needing a separate search
// engine for a project at this scale.
userSchema.index({ name: 'text', headline: 'text' });

// Strip sensitive/internal fields whenever a document is serialized
// to JSON (i.e. whenever it's sent in an API response). This is a
// second layer of defense on top of `select: false` — belt and
// suspenders, because it's easy to accidentally .select('+passwordHash')
// somewhere and forget to strip it back out.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

export default User;
