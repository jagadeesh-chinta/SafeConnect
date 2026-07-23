import { ArrowLeft, User, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

function ViewUserProfile({ userId, onBack }) {
  const { getOtherUserProfile } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isOnline = onlineUsers.includes(userId);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      const data = await getOtherUserProfile(userId);
      setProfile(data);
      setIsLoading(false);
    };
    fetchProfile();
  }, [userId, getOtherUserProfile]);

  const formatJoinDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const pageTheme = localStorage.getItem("chatTheme") || "dark";

  if (isLoading) {
    return (
      <div className={`feature-page chat-theme-${pageTheme} flex flex-col h-full`}>
        {/* Header */}
        <div className="feature-card !rounded-none !border-x-0 !border-t-0 border-b border-border flex items-center gap-3 px-4 md:px-6 py-4">
          <button
            onClick={onBack}
            className="feature-back-btn flex items-center gap-2 px-3 py-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary/50 rounded-lg transition-all min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Chat</span>
          </button>
        </div>

        {/* Loading state */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`feature-page chat-theme-${pageTheme} flex flex-col h-full`}>
        {/* Header */}
        <div className="feature-card !rounded-none !border-x-0 !border-t-0 border-b border-border flex items-center gap-3 px-4 md:px-6 py-4">
          <button
            onClick={onBack}
            className="feature-back-btn flex items-center gap-2 px-3 py-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary/50 rounded-lg transition-all min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Chat</span>
          </button>
        </div>

        {/* Error state */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-secondary">Failed to load profile</p>
        </div>
      </div>
    );
  }

  const displayImage = profile.profilePic || "/avatar.png";

  return (
    <div className={`feature-page chat-theme-${pageTheme} flex flex-col h-full`}>
      {/* Header */}
      <div className="feature-card !rounded-none !border-x-0 !border-t-0 border-b border-border flex items-center gap-3 px-4 md:px-6 py-4">
        <button
          onClick={onBack}
          className="feature-back-btn flex items-center gap-2 px-3 py-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary/50 rounded-lg transition-all min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Chat</span>
        </button>
      </div>

      {/* Profile Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Profile Card */}
          <div className="feature-card p-6 md:p-8">
            {/* Profile Icon Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-accent-primary/10 p-4 rounded-full ring-4 ring-accent-primary/5">
                  <User className="w-8 h-8 text-accent-primary" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-100 mb-1">User Profile</h1>
              <p className="text-text-muted text-sm">View-only</p>
            </div>

            {/* Profile Picture */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 ${isOnline ? 'border-green-500' : 'border-border'}`}>
                  <img
                    src={displayImage}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Online indicator */}
                <div className={`absolute bottom-1 right-1 md:bottom-2 md:right-2 w-4 h-4 rounded-full border-2 border-bg-primary ${isOnline ? 'bg-green-500' : 'bg-text-muted'}`} />
              </div>
            </div>

            {/* Username */}
            <div className="mb-4">
              <label className="block text-text-secondary text-sm mb-2">Username</label>
              <div className="p-4 bg-bg-secondary/50 border border-border shadow-inner rounded-xl">
                <span className="text-text-primary font-medium">{profile.fullName}</span>
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="block text-text-secondary text-sm mb-2">Status</label>
              <div className="p-4 bg-bg-secondary/50 border border-border shadow-inner rounded-xl flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-text-muted'}`} />
                <span className={`font-medium ${isOnline ? 'text-green-400' : 'text-text-muted'}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            {/* Join Date */}
            <div>
              <label className="block text-text-secondary text-sm mb-2">Joined</label>
              <div className="p-4 bg-bg-secondary/50 border border-border shadow-inner rounded-xl flex items-center gap-3">
                <Calendar className="w-5 h-5 text-text-muted" />
                <span className="text-text-primary">{formatJoinDate(profile.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewUserProfile;
