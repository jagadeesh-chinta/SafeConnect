import { memo, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    getFavourites();
  }, [getFavourites]);

  useEffect(() => {
    const fetchLastMessages = async () => {
      setIsFetchingLastMessages(true);
      const messages = {};
      try {
        await Promise.all(
          chats.map(async (chat) => {
            try {
              const res = await axiosInstance.get(`/messages/${chat._id}`);
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
  
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    return chats.filter(chat => chat.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [chats, searchQuery]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar Container */}
      <div className="px-2 pb-2 sticky top-0 bg-bg-elevated/80 backdrop-blur-md z-10">
        {!isSearchOpen ? (
          <div className="flex justify-end md:hidden">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full glass-button text-text-secondary hover:text-accent-primary transition-colors"
              aria-label="Open search"
            >
              <Search className="size-5" />
            </button>
          </div>
        ) : null}

        <div className={`relative ${!isSearchOpen ? 'hidden md:block' : 'block'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-text-primary placeholder:text-text-muted"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="size-4" />
            </button>
          ) : isSearchOpen ? (
            <button
              onClick={() => setIsSearchOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary md:hidden"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {filteredChats.length === 0 && searchQuery ? (
        <div className="text-center py-8 text-text-secondary text-sm">
          No chats found matching "{searchQuery}"
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {filteredChats.map((chat) => {
          const lastMessage = lastMessages[chat._id];
        const unreadData = unreadCounts[chat._id];
        const unreadCount = unreadData?.count || 0;
        
        const messagePreview = unreadData?.lastMessage 
          ? unreadData.lastMessage 
          : lastMessage
            ? lastMessage.text || "(Image)"
            : "No messages yet";

        const isActive = selectedUser?._id === chat._id;

        return (
          <div
            key={chat._id}
            className={`chat-list-item p-3 rounded-xl cursor-pointer min-h-[68px] flex items-center gap-3 transition-all duration-200 ${isActive ? "active" : ""}`}
            onClick={() => setSelectedUser(chat)}
          >
            <div className="relative">
              <div className="size-12 rounded-full overflow-hidden ring-2 ring-transparent">
                <img src={chat.profilePic || "/avatar.png"} alt={`${chat.fullName} profile`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
              {onlineUserSet.has(chat._id) && (
                <div className="absolute bottom-0 right-0 online-dot" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className={`font-semibold truncate text-sm md:text-base ${isActive ? "text-accent-primary" : "text-text-primary"}`}>
                {chat.fullName}
              </h4>
              <p className={`text-xs md:text-sm truncate mt-0.5 ${unreadCount > 0 ? "text-text-primary font-medium" : "text-text-muted"}`} aria-live="polite">
                {messagePreview}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <div className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-accent-primary flex items-center justify-center shadow-sm">
                <span className="text-white text-[10px] font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </div>
            )}
          </div>
        );
      })}
      </div>
      {isFetchingLastMessages ? <span className="sr-only" aria-live="polite">Refreshing latest messages</span> : null}
    </div>
  );
}
export default memo(ChatsList);
