import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "pdf", "document"],
      default: "text",
    },
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    duration: {
      type: Number,
      min: 0,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Scheduled message fields
    scheduledAt: {
      type: Date,
      default: null,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["scheduled", "sent"],
      default: "sent",
    },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, isRead: 1, status: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, status: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;