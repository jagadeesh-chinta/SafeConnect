import { useState, useEffect, useCallback } from "react";
import { MessageCircleIcon, Search } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const NoConversationPlaceholder = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // Debounced search function
  const searchUsers = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await axiosInstance.get(`/messages/search?query=${encodeURIComponent(query)}`);
      setSearchResults(res.data || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Search Bar at Top */}
      <div className="p-4 md:p-6 border-b border-border bg-bg-surface/50 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Search users by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-bg-secondary border border-border rounded-full text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Search Results or Default Message */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery.trim().length > 0 ? (
          <div className="p-4">
            {isSearching ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserClick(user)}
                    className="flex items-center gap-4 p-3 rounded-xl cursor-pointer hover:bg-bg-secondary transition-colors"
                  >
                    <div className={`avatar ${onlineUsers.includes(user._id) ? "online" : "offline"}`}>
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-border">
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-text-primary font-semibold">{user.fullName}</h4>
                      <p className={`text-xs mt-0.5 font-medium flex items-center gap-1.5 ${onlineUsers.includes(user._id) ? "text-success" : "text-text-muted"}`}>
                        {onlineUsers.includes(user._id) && <span className="w-1.5 h-1.5 rounded-full bg-success"></span>}
                        {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-text-secondary font-medium">No users found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="size-24 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_32px_rgba(var(--color-accent-primary-rgb),0.15)] ring-1 ring-accent-primary/20">
              <MessageCircleIcon className="size-12 text-accent-primary" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-3">Select a conversation</h3>
            <p className="text-text-secondary max-w-md leading-relaxed">
              Choose a contact from the sidebar or search for any user above to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoConversationPlaceholder;
