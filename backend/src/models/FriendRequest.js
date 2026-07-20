import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

// prevent duplicate identical requests from same sender to same receiver
friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
friendRequestSchema.index({ receiverId: 1, status: 1, createdAt: -1 });

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
export default FriendRequest;
