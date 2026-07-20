import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

function ContactList() {
  const { setSelectedUser, unreadCounts, selectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, contact }
  const [undoData, setUndoData] = useState(null); // { contact, timeoutId }
  const menuRef = useRef(null);
  const onlineUserSet = useMemo(() => new Set(onlineUsers), [onlineUsers]);

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

  // Close context menu when clicking outside
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
    
    // Calculate position to keep menu within viewport
    const menuWidth = 160;
    const menuHeight = 50;
    let x = e.clientX;
    let y = e.clientY;
    
    // Adjust if menu would go off right edge
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    
    // Adjust if menu would go off bottom edge
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    setContextMenu({ x, y, contact });
  };

  const handleDeleteChat = async () => {
    if (!contextMenu?.contact) return;

    const contact = contextMenu.contact;
    setContextMenu(null);

    // Optimistically remove from list
    setFriends((prev) => prev.filter((f) => f._id !== contact._id));

    try {
      await axiosInstance.post(`/chat/delete/${contact._id}`);

      // Show undo snackbar
      const timeoutId = setTimeout(() => {
        setUndoData(null);
      }, 5000);

      setUndoData({ contact, timeoutId });
    } catch (error) {
      // Restore on error
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
      // Add back to list
      setFriends((prev) => [...prev, contact].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      toast.success("Chat restored");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to restore chat");
    }
  };

  if (isLoading) return <UsersLoadingSkeleton />;

  if (friends.length === 0) {
    return (
      <div className="text-center text-slate-400 p-4">
        No friends yet. Use the search to find and add friends!
      </div>
    );
  }

  return (
    <>
      {friends.map((contact) => {
        const unreadData = unreadCounts[contact._id];
        const unreadCount = unreadData?.count || 0;
        
        return (
          <div
            key={contact._id}
            className={`chat-list-item p-3 md:p-4 rounded-xl cursor-pointer min-h-[60px] ${selectedUser?._id === contact._id ? "chat-list-item-active" : ""}`}
            onClick={() => setSelectedUser(contact)}
            onContextMenu={(e) => handleContextMenu(e, contact)}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`avatar ${onlineUserSet.has(contact._id) ? "online" : "offline"}`}>
                <div className="size-10 md:size-12 rounded-full">
                  <img src={contact.profilePic || "/avatar.png"} alt={`${contact.fullName} profile`} loading="lazy" decoding="async" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-slate-200 font-medium truncate text-sm md:text-base">{contact.fullName}</h4>
                {unreadCount > 0 && (
                  <p className="text-slate-200 text-xs md:text-sm truncate font-medium">
                    {unreadData.lastMessage}
                  </p>
                )}
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

      {/* Context Menu - rendered via portal */}
      {contextMenu && createPortal(
        <div
          ref={menuRef}
          className="fixed chat-glass-strong rounded-lg shadow-2xl py-2 min-w-[160px]"
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
            className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-white/10 transition-colors text-sm min-h-[44px]"
            role="menuitem"
          >
            <Trash2 className="w-4 h-4" />
            Delete Chat
          </button>
        </div>,
        document.body
      )}

      {/* Undo Snackbar - rendered via portal */}
      {undoData && createPortal(
        <div 
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 chat-glass-strong rounded-lg shadow-xl px-4 py-3 flex items-center gap-4 animate-fade-in"
          style={{ zIndex: 9999 }}
        >
          <span className="text-slate-200 text-sm">Chat deleted</span>
          <button
            onClick={handleUndo}
            className="text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors"
          >
            UNDO
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
export default ContactList;
