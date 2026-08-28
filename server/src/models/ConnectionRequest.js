import mongoose from 'mongoose';

const { Schema } = mongoose;

const connectionRequestSchema = new Schema(
  {
    // Who sent the request
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Who is receiving it
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The lifecycle of a request. It starts pending, and eventually
    // becomes accepted or rejected. We keep the document around even
    // after it's resolved (instead of deleting it) so you have a
    // history of "who requested who and when" — useful for things like
    // "don't let someone spam requests to the same person repeatedly."
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true, // createdAt = when requested, updatedAt = when responded to
  }
);

// A user should never be able to send two pending requests to the same
// person. This compound unique index enforces that AT THE DATABASE
// LEVEL — even if your application code has a bug and tries to insert
// a duplicate, MongoDB itself will reject it. This is stronger than
// just checking in your controller before inserting.
connectionRequestSchema.index({ from: 1, to: 1 }, { unique: true });

const ConnectionRequest = mongoose.model(
  'ConnectionRequest',
  connectionRequestSchema
);

export default ConnectionRequest;
