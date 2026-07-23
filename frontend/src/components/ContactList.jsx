import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { Trash2, Search, X } from "lucide-react";
import toast from "react-hot-toast";

function ContactList() {
  const { setSelectedUser, unreadCounts, selectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [undoData, setUndoData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const menuRef = useRef(null);
  const onlineUserSet = useMemo(() => new Set(onlineUsers), [onlineUsers]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    return friends.filter(friend => friend.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [friends, searchQuery]);

  const fetchFriends = async () => {
    try {
      const res = await axiosInstance.get("/friends/list");
      const sorted = (res.data || []).sort((a, b) =>
        a.fullName.localeCompare(b.fullName)
      );
      setFriends(sorted);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu]);

  const handleContextMenu = (e, contact) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuWidth = 160;
    const menuHeight = 50;
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    setContextMenu({ x, y, contact });
  };

  const handleDeleteChat = async () => {
    if (!contextMenu?.contact) return;

    const contact = contextMenu.contact;
    setContextMenu(null);

    setFriends((prev) => prev.filter((f) => f._id !== contact._id));

    try {
      await axiosInstance.post(`/chat/delete/${contact._id}`);

      const timeoutId = setTimeout(() => {
        setUndoData(null);
      }, 5000);

      setUndoData({ contact, timeoutId });
    } catch (error) {
      setFriends((prev) => [...prev, contact].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      toast.error(error.response?.data?.message || "Failed to delete chat");
    }
  };

  const handleUndo = async () => {
    if (!undoData) return;

    clearTimeout(undoData.timeoutId);
    const contact = undoData.contact;
    setUndoData(null);

    try {
      await axiosInstance.post(`/chat/restore/${contact._id}`);
      setFriends((prev) => [...prev, contact].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      toast.success("Chat restored");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to restore chat");
    }
  };

  if (isLoading) return <UsersLoadingSkeleton />;

  if (friends.length === 0) {
    return (
      <div className="text-center text-text-muted p-6 text-sm">
        No friends yet. Use the global search to find and add friends!
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar Container */}
      <div className="px-2 pb-2 sticky top-0 bg-bg-elevated/80 backdrop-blur-md z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search users..."
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
          ) : null}
        </div>
      </div>

      {filteredFriends.length === 0 && searchQuery ? (
        <div className="text-center py-8 text-text-secondary text-sm">
          No users found matching "{searchQuery}"
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {filteredFriends.map((contact) => {
        const unreadData = unreadCounts[contact._id];
        const unreadCount = unreadData?.count || 0;
        const isActive = selectedUser?._id === contact._id;
        
        return (
          <div
            key={contact._id}
            className={`chat-list-item p-3 rounded-xl cursor-pointer min-h-[68px] flex items-center gap-3 transition-all duration-200 ${isActive ? "active" : ""}`}
            onClick={() => setSelectedUser(contact)}
            onContextMenu={(e) => handleContextMenu(e, contact)}
          >
            <div className="relative">
              <div className="size-12 rounded-full overflow-hidden">
                <img src={contact.profilePic || "/avatar.png"} alt={`${contact.fullName} profile`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
              {onlineUserSet.has(contact._id) && (
                <div className="absolute bottom-0 right-0 online-dot" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className={`font-semibold truncate text-sm md:text-base ${isActive ? "text-accent-primary" : "text-text-primary"}`}>{contact.fullName}</h4>
              {unreadCount > 0 && (
                <p className="text-text-primary text-xs md:text-sm truncate font-medium mt-0.5">
                  {unreadData.lastMessage}
                </p>
              )}
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

      {/* Context Menu */}
      {contextMenu && createPortal(
        <div
          ref={menuRef}
          className="fixed glass-card rounded-xl shadow-2xl py-1 min-w-[160px] border border-border"
          style={{ 
            top: contextMenu.y, 
            left: contextMenu.x,
            zIndex: 9999
          }}
          role="menu"
          aria-label="Contact actions"
        >
          <button
            onClick={handleDeleteChat}
            className="w-full flex items-center gap-2 px-4 py-3 text-danger hover:bg-bg-secondary transition-colors text-sm font-medium"
            role="menuitem"
          >
            <Trash2 className="w-4 h-4" />
            Delete Chat
          </button>
        </div>,
        document.body
      )}

      {/* Undo Snackbar */}
      {undoData && createPortal(
        <div 
          className="fixed bottom-10 left-1/2 transform -translate-x-1/2 glass-card rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 animate-fade-in-up border border-border"
          style={{ zIndex: 9999 }}
        >
          <span className="text-text-primary text-sm font-medium">Chat deleted</span>
          <button
            onClick={handleUndo}
            className="text-accent-primary hover:text-accent-secondary font-bold text-sm transition-colors"
          >
            UNDO
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
export default ContactList;
