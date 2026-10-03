import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    headline: { type: String, default: '', maxlength: 150 },
    bio: { type: String, default: '', maxlength: 2000 },
    avatarUrl: { type: String, default: '' },
    connections: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

userSchema.index({ name: 'text', headline: 'text' });

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
export default User;
