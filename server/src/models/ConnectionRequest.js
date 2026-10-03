import mongoose from 'mongoose';
const { Schema } = mongoose;

const connectionRequestSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

connectionRequestSchema.index({ from: 1, to: 1 }, { unique: true });

const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);
export default ConnectionRequest;
