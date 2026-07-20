import { memo, useEffect, useMemo, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";

function ChatsList() {
  const { getFavourites, chats, isUsersLoading, setSelectedUser, unreadCounts, selectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [lastMessages, setLastMessages] = useState({});
  const [isFetchingLastMessages, setIsFetchingLastMessages] = useState(false);

  useEffect(() => {
    getFavourites();
  }, [getFavourites]);

  // Fetch last message for each favourite
  useEffect(() => {
    const fetchLastMessages = async () => {
      setIsFetchingLastMessages(true);
      const messages = {};
      try {
        await Promise.all(
          chats.map(async (chat) => {
            try {
              const res = await axiosInstance.get(`/messages/${chat._id}`);
              // Handle both array format and { messages, isDeleted } format
              const messagesArray = res.data.messages || res.data;
              if (Array.isArray(messagesArray) && messagesArray.length > 0) {
                messages[chat._id] = messagesArray[messagesArray.length - 1];
              }
            } catch {
              // Keep current behavior and fail silently per contact.
            }
          })
        );
      } finally {
        setIsFetchingLastMessages(false);
      }
      setLastMessages(messages);
    };

    if (chats.length > 0) {
      fetchLastMessages();
    } else {
      setLastMessages({});
    }
  }, [chats]);

  const onlineUserSet = useMemo(() => new Set(onlineUsers), [onlineUsers]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <>
      {chats.map((chat) => {
        const lastMessage = lastMessages[chat._id];
        const unreadData = unreadCounts[chat._id];
        const unreadCount = unreadData?.count || 0;
        
        // Use unread data's last message if available (more recent)
        const messagePreview = unreadData?.lastMessage 
          ? unreadData.lastMessage 
          : lastMessage
            ? lastMessage.text || "(Image)"
            : "No messages yet";

        return (
          <div
            key={chat._id}
            className={`chat-list-item p-3 md:p-4 rounded-xl cursor-pointer min-h-[60px] ${selectedUser?._id === chat._id ? "chat-list-item-active" : ""}`}
            onClick={() => setSelectedUser(chat)}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`avatar ${onlineUserSet.has(chat._id) ? "online" : "offline"}`}>
                <div className="size-10 md:size-12 rounded-full">
                  <img src={chat.profilePic || "/avatar.png"} alt={`${chat.fullName} profile`} loading="lazy" decoding="async" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-slate-200 font-medium truncate text-sm md:text-base">{chat.fullName}</h4>
                <p className={`text-xs md:text-sm truncate ${unreadCount > 0 ? "text-slate-200 font-medium" : "text-slate-400"}`} aria-live="polite">
                  {messagePreview}
                </p>
              </div>
              {/* Unread count badge */}
              {unreadCount > 0 && (
                <div className="chat-unread-badge flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {isFetchingLastMessages ? <span className="sr-only" aria-live="polite">Refreshing latest messages</span> : null}
    </>
  );
}
export default memo(ChatsList);
