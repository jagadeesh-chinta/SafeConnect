import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";
import { LogOut, ArrowLeft } from "lucide-react";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import { useNotificationStore } from "../store/useNotificationStore";
import SettingsSidebar from "../components/SettingsSidebar";
import ProfilePage from "./ProfilePage";
import ChatKeyPage from "./ChatKeyPage";
import RestoreChat from "./RestoreChat";
import NotificationsPage from "./NotificationsPage";
import RequestsPage from "../components/RequestsPage";
import { useAuthStore } from "../store/useAuthStore";

function ChatPage() {
  const { 
    activeTab, 
    selectedUser, 
    subscribeToFriendRequests, 
    unsubscribeFromFriendRequests,
    subscribeToFriendRemoval,
    unsubscribeFromFriendRemoval,
    subscribeToUnreadUpdates,
    fetchUnreadCounts,
  } = useChatStore();
  const {
    subscribeToNotifications,
    unsubscribeFromNotifications,
    fetchUnreadCount,
  } = useNotificationStore();
  const logout = useAuthStore((state) => state.logout);

  const [theme, setTheme] = useState(() => localStorage.getItem("chatTheme") || "dark");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsKey, setActiveSettingsKey] = useState("profile");
  const [isMobileSettingsContent, setIsMobileSettingsContent] = useState(false);

  useEffect(() => {
    localStorage.setItem("chatTheme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
    setIsMobileSettingsContent(false);
  };

  const handleBackFromSettings = () => {
    if (isMobileSettingsContent) {
      setIsMobileSettingsContent(false);
      return;
    }
    setIsSettingsOpen(false);
  };

  const handleSelectSettingsItem = (key) => {
    setActiveSettingsKey(key);
    setIsSettingsOpen(true);
    if (window.innerWidth < 768) {
      setIsMobileSettingsContent(true);
    }
  };

  const renderSettingsContent = () => {
    const commonProps = {
      embedded: true,
      onBack: handleBackFromSettings,
    };

    switch (activeSettingsKey) {
      case "profile":
        return <ProfilePage {...commonProps} />;
      case "chatkey":
        return <ChatKeyPage {...commonProps} />;
      case "restore-chat":
        return <RestoreChat {...commonProps} />;
      case "requests":
        return <RequestsPage {...commonProps} />;
      case "notifications":
        return <NotificationsPage {...commonProps} />;
      case "logout":
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-6 animate-fade-in text-center">
            <div className="size-24 rounded-full bg-danger/10 flex items-center justify-center mb-6 ring-4 ring-danger/20">
              <LogOut className="size-12 text-danger ml-2" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Are you sure you want to logout?</h2>
            <p className="text-text-secondary mb-10 max-w-sm">
              You will need to sign in again to access your secure conversations.
            </p>
            <div className="flex items-center gap-4 w-full max-w-sm">
              <button 
                onClick={handleBackFromSettings}
                className="flex-1 py-3 px-4 rounded-xl font-semibold glass-button"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  await logout();
                  setIsSettingsOpen(false);
                  setIsMobileSettingsContent(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-danger text-white hover:bg-red-700 transition-colors shadow-lg shadow-danger/20"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        );
      default:
        return <ProfilePage {...commonProps} />;
    }
  };

  useEffect(() => {
    subscribeToFriendRequests();
    subscribeToFriendRemoval();
    subscribeToUnreadUpdates();
    fetchUnreadCounts();
    subscribeToNotifications();
    fetchUnreadCount();

    return () => {
      unsubscribeFromFriendRequests();
      unsubscribeFromFriendRemoval();
      unsubscribeFromNotifications();
    };
  }, [subscribeToFriendRequests, unsubscribeFromFriendRequests, subscribeToFriendRemoval, unsubscribeFromFriendRemoval, subscribeToUnreadUpdates, fetchUnreadCounts, subscribeToNotifications, unsubscribeFromNotifications, fetchUnreadCount]);

  return (
    <div className={`relative h-full w-full flex items-center justify-center overflow-hidden p-2 md:p-4 bg-bg-primary text-text-primary`}>
      {/* Background Decorators */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-secondary/20 rounded-full blur-[120px]" />
      </div>

      {/* Subtle Mesh Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 h-[98vh] w-[98vw] md:h-[92vh] md:w-[94vw] max-w-[1500px]">
        <BorderAnimatedContainer>
          {/* LEFT SIDE - Sidebar */}
          <div className={`
            h-full w-full md:w-[320px] lg:w-[380px] bg-bg-elevated/80 border-r border-border flex flex-col overflow-hidden backdrop-blur-xl
            ${isSettingsOpen
              ? isMobileSettingsContent
                ? "hidden md:flex"
                : "flex"
              : selectedUser
                ? "hidden md:flex"
                : "flex"}
          `}>
            {isSettingsOpen ? (
              <div className="flex h-full w-full animate-slide-in">
                <SettingsSidebar
                  activeKey={activeSettingsKey}
                  onBack={handleBackFromSettings}
                  onSelect={handleSelectSettingsItem}
                />
              </div>
            ) : (
              <div className="flex h-full w-full animate-slide-in">
                <div className="flex h-full w-full flex-col">
                  <ProfileHeader theme={theme} onToggleTheme={toggleTheme} onOpenSettings={handleOpenSettings} />
                  <ActiveTabSwitch />

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 overscroll-contain">
                    {activeTab === "chats" ? <ChatsList /> : <ContactList />}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE - Chat area */}
          <div className={`
            h-full flex-1 flex flex-col bg-bg-surface overflow-hidden
            ${isSettingsOpen
              ? isMobileSettingsContent
                ? "flex"
                : "hidden md:flex"
              : selectedUser
                ? "flex"
                : "hidden md:flex"}
          `}>
            {isSettingsOpen ? (
              <div className="h-full w-full overflow-y-auto custom-scrollbar animate-fade-in bg-bg-surface/50 backdrop-blur-md">
                {renderSettingsContent()}
              </div>
            ) : selectedUser ? (
              <ChatContainer />
            ) : (
              <NoConversationPlaceholder />
            )}
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}
export default ChatPage;
