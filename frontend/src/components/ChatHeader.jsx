import { XIcon, Heart, MoreVertical, UserMinus, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader({ onViewProfile, onRemoveFriend }) {
  const { selectedUser, setSelectedUser, friendStatus, toggleFavourite, isFavourite, typingUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [isFav, setIsFav] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const isOnline = onlineUsers.includes(selectedUser._id);
  const isTyping = !!typingUsers[selectedUser._id];

  useEffect(() => {
    const checkFavourite = async () => {
      const result = await isFavourite(selectedUser._id);
      setIsFav(result);
    };
    checkFavourite();
  }, [selectedUser._id, isFavourite]);

  useEffect(() => {
    if (friendStatus?.status === "not_friends") {
      setIsFav(false);
    }
  }, [friendStatus]);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleToggleFavourite = async () => {
    setIsLoading(true);
    const result = await toggleFavourite(selectedUser._id);
    if (result !== null) {
      setIsFav(result);
    }
    setIsLoading(false);
  };

  const handleRemoveFriend = () => {
    setShowMenu(false);
    onRemoveFriend && onRemoveFriend();
  };

  const handleProfileClick = () => {
    onViewProfile && onViewProfile();
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

  const areFriends = friendStatus?.status === "friends";

  return (
    <div className="flex justify-between items-center bg-bg-surface/50 backdrop-blur-md border-b border-border max-h-[84px] px-3 md:px-6 flex-1 shadow-sm">
      <div className="flex items-center space-x-3">
        {/* Back button */}
        <button 
          onClick={handleBack}
          className="md:hidden glass-button p-2 -ml-1 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Back to chat list"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>

        <button 
          onClick={handleProfileClick}
          className="relative cursor-pointer hover:scale-105 transition-transform"
          aria-label={`View ${selectedUser.fullName} profile`}
        >
          <div className="size-10 md:size-12 rounded-full overflow-hidden ring-2 ring-border hover:ring-accent-primary shadow-sm">
            <img src={selectedUser.profilePic || "/avatar.png"} alt={`${selectedUser.fullName} avatar`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          </div>
          {isOnline && <div className="absolute bottom-0 right-0 online-dot" />}
        </button>

        <div>
          <h3 className="text-text-primary font-semibold text-sm md:text-base truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{selectedUser.fullName}</h3>
          <p className="text-xs md:text-sm flex items-center gap-1.5 text-text-muted font-medium mt-0.5">
            {isTyping ? (
              <>
                <span className="text-accent-primary">Typing...</span>
              </>
            ) : (
              <>
                {isOnline ? <span className="text-success text-[10px]">●</span> : null}
                {isOnline ? "Online" : "Offline"}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {areFriends && (
          <>
            <button
              onClick={handleToggleFavourite}
              disabled={isLoading}
              className="glass-button p-2 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
              aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
            >
              {isFav ? (
                <Heart className="w-5 h-5 fill-danger text-danger drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              ) : (
                <Heart className="w-5 h-5 text-text-muted hover:text-danger transition-colors" />
              )}
            </button>

            {/* Three dots menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="glass-button p-2 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center hover:scale-105 transition-transform"
                aria-label="Open chat actions"
              >
                <MoreVertical className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" />
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 glass-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-fade-in-up">
                  <button
                    onClick={handleRemoveFriend}
                    className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-bg-secondary transition-colors text-sm font-semibold"
                  >
                    <UserMinus className="w-4 h-4" />
                    Remove Friend
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Close button */}
        <button onClick={handleBack} className="hidden md:flex glass-button p-2 rounded-xl min-w-[44px] min-h-[44px] items-center justify-center hover:scale-105 transition-transform ml-1">
          <XIcon className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" />
        </button>
      </div>
    </div>
  );
}
export default ChatHeader;
