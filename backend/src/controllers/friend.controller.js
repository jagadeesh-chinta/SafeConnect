import FriendRequest from "../models/FriendRequest.js";
import Friend from "../models/Friend.js";
import User from "../models/User.js";
import ChatKey from "../models/ChatKey.js";
import DeletedChat from "../models/DeletedChat.js";
import { generateSharedKey } from "../services/bb84.service.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { createAndSendNotification } from "./notification.controller.js";

// helper to sort two ids
const sortedPair = (id1, id2) => {
  const [a, b] = [id1.toString(), id2.toString()].sort();
  return { user1: a, user2: b };
};

export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    // support receiverId either in params or body
    const receiverId = req.params.receiverId || req.body.receiverId;

    console.log("sendFriendRequest - sender:", senderId?.toString(), "receiver:", receiverId?.toString());

    if (senderId.equals(receiverId)) return res.status(400).json({ message: "Cannot send request to yourself" });

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) return res.status(404).json({ message: "Receiver not found" });

    // check existing friendship
    const pair = sortedPair(senderId, receiverId);
    const alreadyFriends = await Friend.exists(pair);
    if (alreadyFriends) return res.status(400).json({ message: "Already friends" });

    // check existing request from sender -> receiver
    const existing = await FriendRequest.findOne({ senderId, receiverId });
    if (existing && existing.status === 'pending') return res.status(400).json({ message: "Request already sent" });
    if (existing && existing.status === 'rejected') {
      existing.status = 'pending';
      await existing.save();
      return res.status(200).json({ message: "Request re-sent" });
    }

    // create new
    const newReq = new FriendRequest({ senderId, receiverId, status: 'pending' });
    await newReq.save();

    // notify receiver via socket if online
    try {
      const receiverIdStr = receiverId.toString();
      console.log("Emitting incoming_request to receiver room:", receiverIdStr);
      io.to(receiverIdStr).emit('incoming_request', {
        senderId: senderId.toString(),
        senderName: req.user.fullName,
        requestId: newReq._id,
      });
    } catch (e) {
      console.error('socket emit failed', e);
    }

    try {
      await createAndSendNotification({
        receiverId,
        senderId,
        type: "friend_request",
      });
    } catch (notificationError) {
      console.error("friend request notification error:", notificationError);
    }

    res.status(201).json(newReq);
  } catch (error) {
    console.error("sendFriendRequest error:", error);
    if (error.code === 11000) return res.status(400).json({ message: "Request already exists" });
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getIncomingRequests = async (req, res) => {
  try {
    const receiverId = req.user._id;
    console.log("getIncomingRequests - Logged in user:", receiverId?.toString());

    // only pending requests for this receiver
    const requests = await FriendRequest.find({ receiverId, status: 'pending' })
      .populate('senderId', 'fullName profilePic email')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(requests);
  } catch (error) {
    console.error("getIncomingRequests error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const receiverId = req.user._id;
    // support id in params or body
    const { id } = req.params.id ? req.params : { id: req.body.requestId };

    const request = await FriendRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.receiverId.toString() !== receiverId.toString()) return res.status(403).json({ message: "Not authorized" });

    const { user1, user2 } = sortedPair(request.senderId, request.receiverId);
    // create friend record (unique index will prevent duplicates)
    await Friend.create({ user1, user2 });

    // ============================================
    // BB84 KEY GENERATION INTEGRATION
    // ============================================
    let chatKeyResult = null;
    try {
      // Generate shared key using BB84 simulation with 32-bit initial key
      const sharedKey = await generateSharedKey(32);
      
      console.log("BB84: Generated shared key for user pair:", user1.toString(), user2.toString());
      
      // Store or find existing key in MongoDB (prevents duplicates)
      chatKeyResult = await ChatKey.createOrFindKey(user1, user2, sharedKey);
      
      console.log("ChatKey: Successfully stored/retrieved key for user pair");
    } catch (keyError) {
      console.error("BB84 Key Generation Error:", keyError);
      // Don't fail the entire friendship acceptance if key generation fails
      // Log the error and continue with the friendship creation
    }
    // ============================================

    // remove request
    await FriendRequest.findByIdAndDelete(id);

    // notify both users via socket rooms
    try {
      const senderIdStr = request.senderId.toString();
      const receiverIdStr = receiverId.toString();
      console.log("Emitting friend_request_accepted to", senderIdStr, "and", receiverIdStr);
      io.to(senderIdStr).emit('friend_request_accepted', { userId: receiverIdStr });
      io.to(receiverIdStr).emit('friend_request_accepted', { userId: senderIdStr });
    } catch (e) {
      console.error('socket emit failed', e);
    }

    try {
      await createAndSendNotification({
        receiverId: request.senderId,
        senderId: receiverId,
        type: "friend_accept",
      });
    } catch (notificationError) {
      console.error("friend accept notification error:", notificationError);
    }

    res.status(200).json({ 
      message: "Friend request accepted",
      keyGenerated: !!chatKeyResult // Indicate if key was successfully generated
    });
  } catch (error) {
    console.error("acceptRequest error:", error);
    if (error.code === 11000) return res.status(200).json({ message: "Friendship already exists" });
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const { id } = req.params.id ? req.params : { id: req.body.requestId };

    const request = await FriendRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.receiverId.toString() !== receiverId.toString()) return res.status(403).json({ message: "Not authorized" });

    request.status = 'rejected';
    await request.save();

    // notify sender via socket room
    try {
      const senderIdStr = request.senderId.toString();
      console.log("Emitting friend_request_rejected to sender:", senderIdStr);
      io.to(senderIdStr).emit('friend_request_rejected', { userId: receiverId.toString() });
    } catch (e) {
      console.error('socket emit failed', e);
    }

    try {
      await createAndSendNotification({
        receiverId: request.senderId,
        senderId: receiverId,
        type: "friend_reject",
      });
    } catch (notificationError) {
      console.error("friend reject notification error:", notificationError);
    }

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("rejectRequest error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFriendStatus = async (req, res) => {
  try {
    const myId = req.user._id;
    const { otherUserId } = req.params;

    const pair = sortedPair(myId, otherUserId);
    const friendExists = await Friend.exists(pair);

    if (friendExists) return res.status(200).json({ status: "friends" });

    // check if there's a request from me to them
    const requestFromMe = await FriendRequest.findOne({ senderId: myId, receiverId: otherUserId, status: "pending" });
    if (requestFromMe) return res.status(200).json({ status: "sent", requestId: requestFromMe._id });

    // check if there's a request from them to me
    const requestToMe = await FriendRequest.findOne({ senderId: otherUserId, receiverId: myId, status: "pending" }).populate("senderId", "fullName");
    if (requestToMe) return res.status(200).json({ status: "received", requestId: requestToMe._id, senderName: requestToMe.senderId?.fullName });

    // No relationship
    return res.status(200).json({ status: "not_friends" });
  } catch (error) {
    console.error("getFriendStatus error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const toggleFavourite = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    // Check if users are friends
    const pair = sortedPair(myId, userId);
    const friendExists = await Friend.exists(pair);
    if (!friendExists) return res.status(403).json({ message: "You must be friends to add to favourites" });

    // Find current user and check if userId is already in favourites
    const user = await User.findById(myId);
    const isFavourite = user.favourites.includes(userId);

    if (isFavourite) {
      // Remove from favourites
      user.favourites = user.favourites.filter(id => id.toString() !== userId.toString());
      await user.save();
      return res.status(200).json({ message: "Removed from favourites", isFavourite: false });
    } else {
      // Add to favourites
      user.favourites.push(userId);
      await user.save();
      return res.status(200).json({ message: "Added to favourites", isFavourite: true });
    }
  } catch (error) {
    console.error("toggleFavourite error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFavourites = async (req, res) => {
  try {
    const myId = req.user._id;
    const user = await User.findById(myId).populate('favourites', 'fullName profilePic email');
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.status(200).json(user.favourites);
  } catch (error) {
    console.error("getFavourites error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const isFavourite = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    const user = await User.findById(myId);
    const favourite = user.favourites.includes(userId);

    res.status(200).json({ isFavourite: favourite });
  } catch (error) {
    console.error("isFavourite error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get Friends List - Retrieve all friends of the logged-in user
 * Used by Restore Chat feature to populate friend selector dropdown
 * Filters out soft-deleted chats
 */
export const getFriendsList = async (req, res) => {
  try {
    const myId = req.user._id;

    // Find all Friend records where the logged-in user is either user1 or user2
    const friendRecords = await Friend.find({
      $or: [{ user1: myId }, { user2: myId }],
    });

    // Extract friend IDs (the other user in each pair)
    const friendIds = friendRecords.map((record) =>
      record.user1.toString() === myId.toString() ? record.user2 : record.user1
    );

    // Get deleted chats for this user
    const deletedChats = await DeletedChat.find({ userId: myId });
    const deletedUserIds = deletedChats.map((dc) => dc.deletedUserId.toString());

    // Filter out deleted chats
    const activeFriendIds = friendIds.filter(
      (id) => !deletedUserIds.includes(id.toString())
    );

    // Fetch full friend details (exclude password)
    const friends = await User.find({ _id: { $in: activeFriendIds } })
      .select("fullName profilePic email")
      .sort({ fullName: 1 })
      .lean();

    res.status(200).json(friends);
  } catch (error) {
    console.error("getFriendsList error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Remove Friend - Remove friend relationship between two users
 * Removes: Friend record, ChatKey, FriendRequest records
 * Does NOT delete: Message history
 */
export const removeFriend = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Cannot remove yourself
    if (myId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot remove yourself as friend" });
    }

    // Check if users are friends
    const pair = sortedPair(myId, userId);
    const friendRecord = await Friend.findOne(pair);

    if (!friendRecord) {
      return res.status(400).json({ message: "You are not friends with this user" });
    }

    // 1. Remove friend relationship
    await Friend.deleteOne(pair);
    console.log("Removed friend record between", myId.toString(), "and", userId);

    // 2. Delete ChatKey between both users
    const chatKeyPair = {
      $or: [
        { user1Id: myId, user2Id: userId },
        { user1Id: userId, user2Id: myId }
      ]
    };
    await ChatKey.deleteMany(chatKeyPair);
    console.log("Deleted ChatKey between", myId.toString(), "and", userId);

    // 3. Delete any FriendRequest records between them (both directions)
    await FriendRequest.deleteMany({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId }
      ]
    });
    console.log("Deleted FriendRequest records between", myId.toString(), "and", userId);

    // 4. Remove from favourites if present
    await User.findByIdAndUpdate(myId, {
      $pull: { favourites: userId }
    });
    await User.findByIdAndUpdate(userId, {
      $pull: { favourites: myId }
    });
    console.log("Removed from favourites");

    // Notify both users via socket
    try {
      const myIdStr = myId.toString();
      const userIdStr = userId.toString();
      console.log("Emitting friend_removed to", myIdStr, "and", userIdStr);
      io.to(myIdStr).emit('friend_removed', { userId: userIdStr });
      io.to(userIdStr).emit('friend_removed', { userId: myIdStr });
    } catch (e) {
      console.error('socket emit failed', e);
    }

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("removeFriend error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get Other User Profile - View another user's profile (read-only)
 * Used when clicking on a user's profile picture in chat header
 */
export const getOtherUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find user by ID (exclude sensitive fields)
    const user = await User.findById(userId).select("-password -chatKeyPassword");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user profile data
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      profilePic: user.profilePic,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("getOtherUserProfile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
