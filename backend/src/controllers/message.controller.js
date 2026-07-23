import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import Document from "../models/Document.js";
import Friend from "../models/Friend.js";
import User from "../models/User.js";
import ChatKey from "../models/ChatKey.js";
import DeletedChat from "../models/DeletedChat.js";
import { Readable } from "stream";

const DOCUMENT_EXTENSIONS_REGEX = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|csv|rtf|odt|ods|odp)(\?|$)/i;
const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
]);
const DOCUMENT_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".csv", ".rtf", ".odt", ".ods", ".odp"]);

const getFileExtension = (fileName) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return fileName.slice(dotIndex).toLowerCase();
};

const isDocumentMimeOrExt = (mimetype, originalname = "") => {
  const ext = getFileExtension(originalname);
  return DOCUMENT_MIME_TYPES.has(mimetype) || DOCUMENT_EXTENSIONS.has(ext);
};

const getMediaTypeFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (/\.mp4(\?|$)/i.test(url)) return "video";
  if (/\.mp3(\?|$)/i.test(url)) return "audio";
  if (/\.pdf(\?|$)/i.test(url)) return "pdf";
  if (DOCUMENT_EXTENSIONS_REGEX.test(url)) return "document";
  return null;
};

const getMessagePreviewText = (message) => {
  if (message.text) return message.text;
  if (message.type === "image" || message.image) return "(Image)";
  if (message.type === "video" || /\.mp4(\?|$)/i.test(message.fileUrl || "")) return "(Video)";
  if (message.type === "audio" || /\.mp3(\?|$)/i.test(message.fileUrl || "")) return "(Audio)";
  if (message.type === "pdf" || /\.pdf(\?|$)/i.test(message.fileUrl || "")) return "(PDF)";
  if (message.type === "document" || DOCUMENT_EXTENSIONS_REGEX.test(message.fileUrl || "")) return "(Document)";
  return "(Attachment)";
};

const deleteCloudinaryAsset = async (document) => {
  if (!document?.cloudinaryPublicId) return;

  const triedResourceTypes = new Set();
  const resourceTypes = [document.cloudinaryResourceType, "raw", "video", "image"].filter(Boolean);

  for (const resourceType of resourceTypes) {
    if (triedResourceTypes.has(resourceType)) continue;
    triedResourceTypes.add(resourceType);

    try {
      const result = await cloudinary.uploader.destroy(document.cloudinaryPublicId, {
        resource_type: resourceType,
      });

      if (result?.result === "ok" || result?.result === "not found") {
        return;
      }
    } catch {
      // try the next resource type fallback
    }
  }
};

export const uploadMediaFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Media file is required" });
    }

    let mediaType = null;
    let folder = null;

    if (req.file.mimetype === "video/mp4") {
      mediaType = "video";
      folder = "videos";
    } else if (req.file.mimetype === "audio/mpeg" || req.file.mimetype === "audio/mp3") {
      mediaType = "audio";
      folder = "audios";
    } else if (req.file.mimetype === "application/pdf") {
      mediaType = "pdf";
      folder = "pdfs";
    } else if (isDocumentMimeOrExt(req.file.mimetype, req.file.originalname)) {
      mediaType = "document";
      folder = "documents";
    }

    if (!mediaType || !folder) {
      return res.status(400).json({ message: "Invalid media type" });
    }
    const uploadResponse = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: `chatify/${folder}`,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) return reject(error);
          return resolve(result);
        }
      );

      Readable.from(req.file.buffer).pipe(stream);
    });

    const document = await Document.create({
      uploadedBy: req.user._id,
      url: uploadResponse.secure_url,
      cloudinaryPublicId: uploadResponse.public_id,
      cloudinaryResourceType: uploadResponse.resource_type,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      mediaType,
    });

    res.status(201).json({
      url: uploadResponse.secure_url,
      type: mediaType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      documentId: document._id,
    });
  } catch (error) {
    console.error("Error in uploadMediaFile controller:", error.message);
    res.status(500).json({ message: "Failed to upload media" });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } })
      .select("fullName profilePic email")
      .lean();

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(200).json([]);
    }

    // Case-insensitive search by fullName or phoneNumber
    const users = await User.find({
      _id: { $ne: loggedInUserId },
      $or: [
        { fullName: { $regex: query.trim(), $options: "i" } },
        { phoneNumber: { $regex: query.trim(), $options: "i" } }
      ]
    })
      .select("fullName profilePic email phoneNumber")
      .sort({ fullName: 1 })
      .lean()
      .limit(20);

    res.status(200).json(users);
  } catch (error) {
    console.log("Error in searchUsers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    // Check if this chat is soft-deleted by the logged-in user
    const isChatDeleted = await DeletedChat.isChatDeleted(myId, userToChatId);

    if (isChatDeleted) {
      // Return empty array with deleted flag - messages remain in DB but are hidden
      return res.status(200).json({ messages: [], isDeleted: true });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      // Only show sent messages OR scheduled messages by the current user
      $and: [
        {
          $or: [
            { status: "sent" },
            { status: "scheduled", senderId: myId },
          ],
        },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ messages, isDeleted: false });
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, scheduledAt, type, fileUrl, fileName, fileSize, duration, thumbnailUrl } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && !fileUrl) {
      return res.status(400).json({ message: "Text, image, or media file is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    // Check friendship before allowing message
    const [a, b] = [senderId.toString(), receiverId.toString()].sort();
    const areFriends = await Friend.exists({ user1: a, user2: b });
    if (!areFriends) {
      return res.status(403).json({ message: "You must be friends to chat" });
    }

    // Validate scheduled time if provided
    let isScheduled = false;
    let status = "sent";
    let parsedScheduledAt = null;

    if (scheduledAt) {
      parsedScheduledAt = new Date(scheduledAt);
      const now = new Date();
      
      if (isNaN(parsedScheduledAt.getTime())) {
        return res.status(400).json({ message: "Invalid scheduled time format." });
      }
      
      if (parsedScheduledAt <= now) {
        return res.status(400).json({ message: "Scheduled time must be in the future." });
      }
      
      isScheduled = true;
      status = "scheduled";
    }

    let imageUrl;
    let messageType = "text";

    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
      messageType = "image";
    }

    if (fileUrl) {
      const explicitType = type === "video" || type === "audio" || type === "pdf" || type === "document" ? type : null;
      const inferredType = getMediaTypeFromUrl(fileUrl);
      messageType = explicitType || inferredType;

      if (!messageType) {
        return res.status(400).json({ message: "Invalid media type. Only MP4, MP3, and document files are allowed." });
      }
    }

    if (!image && !fileUrl && text) {
      messageType = "text";
    }

    const parsedFileSize = Number(fileSize);
    const parsedDuration = Number(duration);

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      type: messageType,
      fileUrl: fileUrl || undefined,
      fileName: fileName || undefined,
      fileSize: Number.isFinite(parsedFileSize) && parsedFileSize > 0 ? parsedFileSize : undefined,
      duration: Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      scheduledAt: parsedScheduledAt,
      isScheduled,
      status,
    });

    await newMessage.save();

    // Only emit socket for instant messages, not scheduled ones
    if (!isScheduled) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("send_message", newMessage);
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // find all the messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } })
      .select("fullName profilePic email")
      .lean();

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Restore Chat History - Validate shared key and return chat messages
 * 
 * Request body:
 * - otherUserId: ObjectId - The other user in the chat
 * - sharedKey: String - The BB84-generated shared key to validate
 * 
 * Returns:
 * - If key valid: Array of Message objects between the two users
 * - If key invalid: Error "Invalid Shared Key"
 */
export const restoreChatHistory = async (req, res) => {
  try {
    const myId = req.user._id;
    const { otherUserId, sharedKey } = req.body;

    // Validate input
    if (!otherUserId || !sharedKey) {
      return res.status(400).json({ message: "User ID and shared key are required" });
    }

    // Validate users are different
    if (myId.equals(otherUserId)) {
      return res.status(400).json({ message: "Cannot restore chat with yourself" });
    }

    // Verify other user exists
    const otherUserExists = await User.exists({ _id: otherUserId });
    if (!otherUserExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if users are friends
    const [user1, user2] = [myId.toString(), otherUserId.toString()].sort();
    const areFriends = await Friend.exists({ user1, user2 });
    if (!areFriends) {
      return res.status(403).json({ message: "You must be friends to restore chat history" });
    }

    // Find the ChatKey between these users
    const chatKey = await ChatKey.findKeyByUserPair(myId, otherUserId);
    
    if (!chatKey) {
      return res.status(404).json({ message: "No shared key found. Generate one by accepting friend request." });
    }

    // Validate the provided key matches the stored key
    if (chatKey.sharedKey !== sharedKey) {
      console.warn(`Restore Chat: Invalid key attempt for user pair ${user1}, ${user2}`);
      return res.status(401).json({ message: "Invalid Shared Key" });
    }

    // Key is valid - fetch the chat history
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }); // Sort by oldest first

    const otherUser = await User.findById(otherUserId).select("fullName").lean();

    console.log(`Restore Chat: Successfully restored ${messages.length} messages for user pair`);

    res.status(200).json({
      success: true,
      messages,
      otherUser: {
        _id: otherUserId,
        fullName: otherUser?.fullName || "Unknown",
      },
      keyValidated: true,
    });
  } catch (error) {
    console.error("Error in restoreChatHistory controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    const receiverId = message.receiverId.toString();

    if (message.fileUrl) {
      const document = await Document.findOne({ url: message.fileUrl });
      if (document) {
        await deleteCloudinaryAsset(document);
        await Document.deleteOne({ _id: document._id });
      }
    }

    await Message.findByIdAndDelete(messageId);

    // Notify both users via socket
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message_deleted", { messageId });
    }

    res.status(200).json({ messageId });
  } catch (error) {
    console.error("Error in deleteMessage controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text content is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    message.text = text.trim();
    message.edited = true;
    await message.save();

    const receiverId = message.receiverId.toString();
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message_edited", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in editMessage controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatKeys = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Find all chat keys where the user is either user1 or user2
    const chatKeys = await ChatKey.find({
      $or: [
        { user1Id: userId },
        { user2Id: userId },
      ],
    });

    // Get the friend IDs and map them to user info
    const friendIds = chatKeys.map(key => 
      key.user1Id.toString() === userId ? key.user2Id : key.user1Id
    );

    const friends = await User.find({ _id: { $in: friendIds } }).select("fullName profilePic");

    // Build result with friend info and shared key
    const result = chatKeys.map(key => {
      const friendId = key.user1Id.toString() === userId ? key.user2Id.toString() : key.user1Id.toString();
      const friend = friends.find(f => f._id.toString() === friendId);

      return {
        friendId,
        friendName: friend?.fullName || "Unknown",
        friendProfilePic: friend?.profilePic || null,
        sharedKey: key.sharedKey,
        createdAt: key.createdAt,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getChatKeys controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get Unread Message Counts - Returns unread message counts grouped by sender
 * Used for displaying notification badges in Contacts/Favourites lists
 */
export const getUnreadCounts = async (req, res) => {
  try {
    const myId = req.user._id;

    // Aggregate unread messages grouped by sender
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiverId: myId,
          isRead: false,
          status: "sent", // Only count sent messages, not scheduled ones
        },
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
          lastMessage: { $last: "$text" },
          lastType: { $last: "$type" },
          lastImage: { $last: "$image" },
          lastFileUrl: { $last: "$fileUrl" },
          lastMessageTime: { $last: "$createdAt" },
        },
      },
    ]);

    // Transform to a more usable format
    const result = unreadCounts.map((item) => ({
      senderId: item._id.toString(),
      unreadCount: item.count,
      lastMessage: getMessagePreviewText({
        text: item.lastMessage,
        type: item.lastType,
        image: item.lastImage,
        fileUrl: item.lastFileUrl,
      }),
      lastMessageTime: item.lastMessageTime,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getUnreadCounts controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Mark Messages as Read - Updates all messages from a sender to isRead = true
 * Called when receiver opens a chat with that sender
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const myId = req.user._id;
    const { senderId } = req.params;

    if (!senderId) {
      return res.status(400).json({ message: "Sender ID is required" });
    }

    // Update all unread messages from this sender to this receiver
    const result = await Message.updateMany(
      {
        senderId: senderId,
        receiverId: myId,
        isRead: false,
        status: "sent",
      },
      {
        $set: {
          isDelivered: true,
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Notify sender in real-time for seen receipt updates.
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId && result.modifiedCount > 0) {
      io.to(senderSocketId).emit("messages_seen", {
        senderId: senderId.toString(),
        receiverId: myId.toString(),
      });
    }

    res.status(200).json({
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error in markMessagesAsRead controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
