import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_AUDIO_PDF_SIZE_BYTES = 100 * 1024 * 1024;
const DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".csv", ".rtf", ".odt", ".ods", ".odp"];
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

const hasAllowedDocumentExtension = (fileName = "") => {
  const lowered = fileName.toLowerCase();
  return DOCUMENT_EXTENSIONS.some((ext) => lowered.endsWith(ext));
};

const getMessagePreviewText = (message) => {
  if (message?.text) return message.text;
  if (message?.type === "video") return "(Video)";
  if (message?.type === "audio") return "(Audio)";
  if (message?.type === "pdf") return "(PDF)";
  if (message?.type === "document") return "(Document)";
  if (message?.type === "image" || message?.image) return "(Image)";
  return "(Attachment)";
};

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: localStorage.getItem("activeTab") || "chats",
  selectedUser: JSON.parse(localStorage.getItem("selectedUser") || "null"),
  friendStatus: null, // { status: "friends"|"sent"|"received"|"not_friends", requestId?, senderName? }
  requestsRefreshTrigger: 0, // increment to trigger requests refresh
  isUsersLoading: false,
  isMessagesLoading: false,
  isUploadingMedia: false,
  mediaUploadProgress: 0,
  isChatDeleted: false, // tracks if current chat is soft-deleted
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  hiddenMessages: JSON.parse(localStorage.getItem("hiddenMessages") || "[]"),
  editingMessage: null,
  deletedMessageTemp: null,
  unreadCounts: {}, // { senderId: { count, lastMessage, lastMessageTime } }
  typingUsers: {}, // { [userId]: true }
  unreadListener: null,
  activeChatMessageListener: null,
  activeChatTypingClearListener: null,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => {
    localStorage.setItem("activeTab", tab);
    set({ activeTab: tab });
  },
  setSelectedUser: async (selectedUser) => {
    if (selectedUser) {
      localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
      // Mark messages as read when opening a chat
      try {
        await axiosInstance.put(`/messages/read/${selectedUser._id}`);
        // Clear unread count for this user
        const newUnreadCounts = { ...get().unreadCounts };
        delete newUnreadCounts[selectedUser._id];
        set({ unreadCounts: newUnreadCounts });
      } catch (error) {
        console.log("Error marking messages as read:", error);
      }
    } else {
      localStorage.removeItem("selectedUser");
    }
    set({ selectedUser, isChatDeleted: false, typingUsers: selectedUser ? get().typingUsers : {} });
  },

  // Fetch unread counts from server
  fetchUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/messages/unread-counts");
      const counts = {};
      res.data.forEach((item) => {
        counts[item.senderId] = {
          count: item.unreadCount,
          lastMessage: item.lastMessage,
          lastMessageTime: item.lastMessageTime,
        };
      });
      set({ unreadCounts: counts });
    } catch (error) {
      console.log("Error fetching unread counts:", error);
    }
  },

  // Increment unread count for a sender (called when receiving new message)
  incrementUnreadCount: (senderId, lastMessage) => {
    const currentCounts = get().unreadCounts;
    const existing = currentCounts[senderId] || { count: 0 };
    set({
      unreadCounts: {
        ...currentCounts,
        [senderId]: {
          count: existing.count + 1,
          lastMessage: lastMessage || "(Attachment)",
          lastMessageTime: new Date().toISOString(),
        },
      },
    });
  },

  // Clear unread count for a sender
  clearUnreadCount: (senderId) => {
    const newUnreadCounts = { ...get().unreadCounts };
    delete newUnreadCounts[senderId];
    set({ unreadCounts: newUnreadCounts });
  },

  fetchFriendStatus: async (otherUserId) => {
    try {
      const res = await axiosInstance.get(`/friends/status/${otherUserId}`);
      set({ friendStatus: res.data });
    } catch (error) {
      set({ friendStatus: null });
    }
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const hidden = get().hiddenMessages;
      
      // Handle new response format: { messages, isDeleted }
      const messagesData = res.data.messages || res.data;
      const isDeleted = res.data.isDeleted || false;
      
      set({ 
        messages: Array.isArray(messagesData) ? messagesData.filter((m) => !hidden.includes(m._id)) : [],
        isChatDeleted: isDeleted 
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, friendStatus } = get();
    const { authUser } = useAuthStore.getState();

    if (messageData.mediaFile) {
      const { type, size, name } = messageData.mediaFile;
      const isMp4 = type === "video/mp4";
      const isMp3 = type === "audio/mpeg" || type === "audio/mp3";
      const isDocument = DOCUMENT_MIME_TYPES.has(type) || hasAllowedDocumentExtension(name);

      if (isMp4 && size > MAX_VIDEO_SIZE_BYTES) {
        toast.error("Video size must be less than 50MB");
        return;
      }

      if ((isMp3 || isDocument) && size > MAX_AUDIO_PDF_SIZE_BYTES) {
        toast.error("Audio/Document size must be less than 100MB");
        return;
      }
    }

    // prevent sending when not friends
    if (!friendStatus || friendStatus.status !== "friends") {
      toast.error("You must be friends to chat");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const isScheduled = !!messageData.scheduledAt;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text || "",
      image: messageData.image,
      type: messageData.type || (messageData.image ? "image" : "text"),
      fileUrl: messageData.fileUrl || null,
      fileName: messageData.fileName || messageData.mediaFile?.name || null,
      fileSize: messageData.fileSize || messageData.mediaFile?.size || null,
      duration: messageData.duration || null,
      thumbnailUrl: messageData.thumbnailUrl || null,
      createdAt: new Date().toISOString(),
      isOptimistic: true, // flag to identify optimistic messages (optional)
      isDelivered: false,
      isRead: false,
      readAt: null,
      // Scheduled message fields
      scheduledAt: messageData.scheduledAt || null,
      isScheduled: isScheduled,
      status: isScheduled ? "scheduled" : "sent",
    };
    // immidetaly update the ui by adding the message
    set({ messages: [...messages, optimisticMessage] });

    try {
      const payload = {
        text: messageData.text,
        image: messageData.image,
        scheduledAt: messageData.scheduledAt,
      };

      if (messageData.mediaFile) {
        set({ isUploadingMedia: true, mediaUploadProgress: 0 });

        const formData = new FormData();
        formData.append("file", messageData.mediaFile);

        const uploadRes = await axiosInstance.post("/messages/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || 0;
            if (!total) return;
            const percent = Math.min(100, Math.round((progressEvent.loaded * 100) / total));
            set({ mediaUploadProgress: percent });
          },
        });

        payload.type = uploadRes.data.type;
        payload.fileUrl = uploadRes.data.url;
        payload.fileName = messageData.fileName || uploadRes.data.fileName;
        payload.fileSize = messageData.fileSize || uploadRes.data.fileSize;
        if (typeof messageData.duration === "number") {
          payload.duration = messageData.duration;
        }
        if (messageData.thumbnailUrl) {
          payload.thumbnailUrl = messageData.thumbnailUrl;
        }
      } else if (messageData.type === "video" || messageData.type === "audio" || messageData.type === "pdf" || messageData.type === "document") {
        payload.type = messageData.type;
        payload.fileUrl = messageData.fileUrl;
        payload.fileName = messageData.fileName;
        payload.fileSize = messageData.fileSize;
        payload.duration = messageData.duration;
        payload.thumbnailUrl = messageData.thumbnailUrl;
      }

      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      const serverMessage = res.data;

      set((state) => {
        const currentMessages = state.messages;
        const optimisticIndex = currentMessages.findIndex((m) => m._id === tempId);

        // Replace optimistic message in-place to avoid losing real-time socket updates.
        if (optimisticIndex !== -1) {
          const optimistic = currentMessages[optimisticIndex];
          const merged = {
            ...serverMessage,
            isDelivered: optimistic.isDelivered ?? serverMessage.isDelivered,
            isRead: optimistic.isRead ?? serverMessage.isRead,
            readAt: optimistic.readAt || serverMessage.readAt,
          };

          const next = [...currentMessages];
          next[optimisticIndex] = merged;
          return { messages: next };
        }

        // Fallback: upsert if socket events already inserted the same server message.
        const existingIndex = currentMessages.findIndex((m) => m._id === serverMessage._id);
        if (existingIndex !== -1) {
          const next = [...currentMessages];
          next[existingIndex] = {
            ...currentMessages[existingIndex],
            ...serverMessage,
          };
          return { messages: next };
        }

        return { messages: [...currentMessages, serverMessage] };
      });
      
      if (isScheduled) {
        toast.success("Message scheduled successfully!");
      }
    } catch (error) {
      // remove optimistic message on failure
      set({ messages: messages });
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isUploadingMedia: false, mediaUploadProgress: 0 });
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const previousActiveChatListener = get().activeChatMessageListener;
    const previousTypingClearListener = get().activeChatTypingClearListener;

    if (previousActiveChatListener) {
      socket.off("newMessage", previousActiveChatListener);
    }
    if (previousTypingClearListener) {
      socket.off("newMessage", previousTypingClearListener);
    }

    socket.off("message_deleted");
    socket.off("message_edited");
    socket.off("scheduled_message_sent");
    socket.off("messages_seen");
    socket.off("message_delivered");
    socket.off("user_typing");
    socket.off("user_stop_typing");

    const handleNewMessageInActiveChat = (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      const currentMessages = get().messages;
      set({ messages: [...currentMessages, newMessage] });

      // Mark as read immediately since we're viewing this chat
      axiosInstance.put(`/messages/read/${selectedUser._id}`).catch(() => {});

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");

        notificationSound.currentTime = 0; // reset to start
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    };

    socket.on("newMessage", handleNewMessageInActiveChat);

    socket.on("message_deleted", ({ messageId }) => {
      const currentMessages = get().messages;
      set({ messages: currentMessages.filter((m) => m._id !== messageId) });
    });

    socket.on("message_edited", (updatedMessage) => {
      const currentMessages = get().messages;
      set({
        messages: currentMessages.map((m) =>
          m._id === updatedMessage._id ? updatedMessage : m
        ),
      });
    });

    // Handle scheduled message sent by server (update UI for sender)
    socket.on("scheduled_message_sent", (sentMessage) => {
      const currentMessages = get().messages;
      // Update the scheduled message to show as sent
      set({
        messages: currentMessages.map((m) =>
          m._id === sentMessage._id ? sentMessage : m
        ),
      });
    });

    socket.on("messages_seen", ({ senderId, receiverId }) => {
      const { authUser } = useAuthStore.getState();
      if (!authUser) return;

      // Only update when current user is original sender and the selected chat is the reader.
      if (authUser._id !== senderId || selectedUser._id !== receiverId) return;

      const nowIso = new Date().toISOString();
      const currentMessages = get().messages;
      // Read receipts are silent updates: do not play notification sound here.
      set({
        messages: currentMessages.map((m) =>
          m.senderId === senderId && m.receiverId === receiverId && !m.isRead
            ? { ...m, isDelivered: true, isRead: true, readAt: nowIso }
            : m
        ),
      });
    });

    socket.on("message_delivered", ({ messageId, senderId, receiverId }) => {
      const { authUser } = useAuthStore.getState();
      if (!authUser) return;
      if (authUser._id !== senderId || selectedUser._id !== receiverId) return;

      const currentMessages = get().messages;
      let matched = false;
      set({
        messages: currentMessages.map((m) =>
          m._id === messageId
            ? ((matched = true), { ...m, isDelivered: true })
            : m
        ),
      });

      // If delivery arrives before optimistic replacement, mark latest pending own message.
      if (!matched) {
        const latestPendingOwn = [...currentMessages]
          .reverse()
          .find((m) => m.senderId === senderId && m.receiverId === receiverId && !m.isDelivered);

        if (latestPendingOwn) {
          set({
            messages: get().messages.map((m) =>
              m._id === latestPendingOwn._id ? { ...m, isDelivered: true } : m
            ),
          });
        }
      }
    });

    socket.on("user_typing", ({ fromUserId }) => {
      if (selectedUser._id !== fromUserId) return;
      set({
        typingUsers: {
          ...get().typingUsers,
          [fromUserId]: true,
        },
      });
    });

    socket.on("user_stop_typing", ({ fromUserId }) => {
      if (selectedUser._id !== fromUserId) return;
      const nextTypingUsers = { ...get().typingUsers };
      delete nextTypingUsers[fromUserId];
      set({ typingUsers: nextTypingUsers });
    });

    const handleTypingClearOnMessage = (newMessage) => {
      if (selectedUser._id !== newMessage.senderId) return;
      const nextTypingUsers = { ...get().typingUsers };
      delete nextTypingUsers[newMessage.senderId];
      set({ typingUsers: nextTypingUsers });
    };

    socket.on("newMessage", handleTypingClearOnMessage);
    set({
      activeChatMessageListener: handleNewMessageInActiveChat,
      activeChatTypingClearListener: handleTypingClearOnMessage,
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const activeChatMessageListener = get().activeChatMessageListener;
    const activeChatTypingClearListener = get().activeChatTypingClearListener;

    if (activeChatMessageListener) {
      socket.off("newMessage", activeChatMessageListener);
    }
    if (activeChatTypingClearListener) {
      socket.off("newMessage", activeChatTypingClearListener);
    }

    socket.off("message_deleted");
    socket.off("message_edited");
    socket.off("scheduled_message_sent");
    socket.off("messages_seen");
    socket.off("message_delivered");
    socket.off("user_typing");
    socket.off("user_stop_typing");
    set({ activeChatMessageListener: null, activeChatTypingClearListener: null });
  },

  subscribeToFriendRequests: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.warn("Socket not connected yet");
      return;
    }

    socket.off("incoming_request");
    socket.off("friend_request_accepted");
    socket.off("friend_request_rejected");

    // listen for new incoming requests
    socket.on("incoming_request", (data) => {
      console.log("Received incoming_request event:", data);
      toast.success(`${data.senderName} sent you a friend request!`);
      // trigger refresh of requests component
      set({ requestsRefreshTrigger: get().requestsRefreshTrigger + 1 });
    });

    // listen for accepted requests
    socket.on("friend_request_accepted", (data) => {
      console.log("Received friend_request_accepted event:", data);
      toast.success("Friend request accepted!");
      // refresh friend status if currently viewing that user
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === data.userId) {
        get().fetchFriendStatus(selectedUser._id);
      }
      // also trigger requests refresh
      set({ requestsRefreshTrigger: get().requestsRefreshTrigger + 1 });
    });

    // listen for rejected requests
    socket.on("friend_request_rejected", (data) => {
      console.log("Received friend_request_rejected event:", data);
      toast.info("Friend request was rejected");
    });
  },

  unsubscribeFromFriendRequests: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("incoming_request");
    socket.off("friend_request_accepted");
    socket.off("friend_request_rejected");
  },

  getFavourites: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/friends/list/favourites");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch favourites");
      set({ chats: [] });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  toggleFavourite: async (userId) => {
    try {
      const res = await axiosInstance.post(`/friends/favourite/${userId}`);
      return res.data.isFavourite;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle favourite");
      return null;
    }
  },

  isFavourite: async (userId) => {
    try {
      const res = await axiosInstance.get(`/friends/favourite/${userId}`);
      return res.data.isFavourite;
    } catch (error) {
      return false;
    }
  },

  deleteForMe: (messageId) => {
    const deletedMsg = get().messages.find((m) => m._id === messageId);
    // Remove from UI but don't persist to localStorage yet
    set({
      messages: get().messages.filter((m) => m._id !== messageId),
      deletedMessageTemp: deletedMsg || null,
    });
  },

  confirmDeleteForMe: (messageId) => {
    const hidden = [...get().hiddenMessages, messageId];
    localStorage.setItem("hiddenMessages", JSON.stringify(hidden));
    set({ hiddenMessages: hidden, deletedMessageTemp: null });
  },

  undoDeleteForMe: () => {
    const { deletedMessageTemp, messages } = get();
    if (!deletedMessageTemp) return;
    // Re-insert in correct chronological position
    const restored = [...messages, deletedMessageTemp].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    set({ messages: restored, deletedMessageTemp: null });
  },

  deleteForEveryone: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set({ messages: get().messages.filter((m) => m._id !== messageId) });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  setEditingMessage: (message) => set({ editingMessage: message }),

  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}`, { text });
      set({
        messages: get().messages.map((m) => (m._id === messageId ? res.data : m)),
        editingMessage: null,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  // Remove friend - removes friendship, ChatKey, and FriendRequest records
  removeFriend: async (userId) => {
    try {
      await axiosInstance.delete(`/friends/remove/${userId}`);
      const { activeTab } = get();
      // Update chats and contacts to remove the user
      // Also clear messages to prevent stale UI (they'll reload when friend again)
      set({
        chats: get().chats.filter((chat) => chat._id !== userId),
        allContacts: get().allContacts.filter((contact) => contact._id !== userId),
        friendStatus: { status: "not_friends" },
        messages: [], // Clear messages UI (preserved in DB)
      });
      // Refresh all lists to ensure UI is up-to-date
      get().getMyChatPartners();
      get().getAllContacts();
      // Also refresh favourites if currently viewing that tab
      if (activeTab === "favourites") {
        get().getFavourites();
      }
      toast.success("Friend removed successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove friend");
      return false;
    }
  },

  // Get other user's profile (read-only)
  getOtherUserProfile: async (userId) => {
    try {
      const res = await axiosInstance.get(`/friends/profile/${userId}`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load profile");
      return null;
    }
  },

  // Subscribe to friend removal events
  subscribeToFriendRemoval: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("friend_removed");

    socket.on("friend_removed", (data) => {
      console.log("Received friend_removed event:", data);
      const { activeTab } = get();
      // Update chats and contacts
      set({
        chats: get().chats.filter((chat) => chat._id !== data.userId),
        allContacts: get().allContacts.filter((contact) => contact._id !== data.userId),
      });
      // If currently viewing this user's chat, update friend status and clear messages
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === data.userId) {
        set({ 
          friendStatus: { status: "not_friends" },
          messages: [], // Clear messages UI (preserved in DB)
        });
      }
      // Refresh all lists to ensure UI is up-to-date
      get().getMyChatPartners();
      get().getAllContacts();
      // Also refresh favourites if currently viewing that tab
      if (activeTab === "favourites") {
        get().getFavourites();
      }
      toast.info("A friend has been removed");
    });
  },

  unsubscribeFromFriendRemoval: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("friend_removed");
    }
  },

  // Subscribe to global new message events for unread count updates
  subscribeToUnreadUpdates: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const handleUnreadUpdate = (newMessage) => {
      const { selectedUser, isSoundEnabled } = get();
      const { authUser } = useAuthStore.getState();

      // Acknowledge delivery as soon as message reaches receiver client socket.
      if (newMessage.receiverId === authUser?._id) {
        socket.emit("message_delivered", {
          messageId: newMessage._id,
          senderId: newMessage.senderId,
          receiverId: newMessage.receiverId,
        });
      }
      
      // If we're not viewing this sender's chat, increment unread count
      if (!selectedUser || selectedUser._id !== newMessage.senderId) {
        get().incrementUnreadCount(newMessage.senderId, getMessagePreviewText(newMessage));
        
        // Play notification sound for background messages
        if (isSoundEnabled) {
          const notificationSound = new Audio("/sounds/notification.mp3");
          notificationSound.currentTime = 0;
          notificationSound.play().catch((e) => console.log("Audio play failed:", e));
        }
      }

      // If the active chat is open, keep read receipts synced as soon as message arrives.
      if (selectedUser && selectedUser._id === newMessage.senderId && newMessage.receiverId === authUser?._id) {
        axiosInstance.put(`/messages/read/${selectedUser._id}`).catch(() => {});
      }
    };

    socket.on("newMessage", handleUnreadUpdate);
    set({ unreadListener: handleUnreadUpdate });
  },

  unsubscribeFromUnreadUpdates: () => {
    const socket = useAuthStore.getState().socket;
    const unreadListener = get().unreadListener;
    if (socket && unreadListener) {
      socket.off("newMessage", unreadListener);
    }
    set({ unreadListener: null });
  },
}));

