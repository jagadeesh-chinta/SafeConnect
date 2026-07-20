import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";

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

  const handleSelectSettingsItem = async (key) => {
    if (key === "logout") {
      await logout();
      setIsSettingsOpen(false);
      setIsMobileSettingsContent(false);
      return;
    }

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
      default:
        return <ProfilePage {...commonProps} />;
    }
  };

  useEffect(() => {
    // Subscribe to real-time friend request events
    subscribeToFriendRequests();
    // Subscribe to friend removal events
    subscribeToFriendRemoval();
    // Subscribe to unread message updates
    subscribeToUnreadUpdates();
    // Fetch initial unread counts
    fetchUnreadCounts();
    // Subscribe to notification updates and fetch badge count
    subscribeToNotifications();
    fetchUnreadCount();

    // Cleanup on unmount
    return () => {
      unsubscribeFromFriendRequests();
      unsubscribeFromFriendRemoval();
      unsubscribeFromNotifications();
    };
  }, [subscribeToFriendRequests, unsubscribeFromFriendRequests, subscribeToFriendRemoval, unsubscribeFromFriendRemoval, subscribeToUnreadUpdates, fetchUnreadCounts, subscribeToNotifications, unsubscribeFromNotifications, fetchUnreadCount]);

  return (
    <div className={`chat-shell chat-shell-fade chat-theme-${theme} relative h-full w-full flex items-center justify-center overflow-hidden p-2 md:p-4`}>
      <div className="chat-bg-layer" />
      <div className="relative h-[98vh] w-[98vw] md:h-[90vh] md:w-[90vw] max-w-[1400px]">
      <BorderAnimatedContainer>
        {/* LEFT SIDE - Sidebar (hidden on mobile when chat is open) */}
        <div className={`
          h-full w-full md:w-[320px] lg:w-[360px] chat-glass flex flex-col overflow-hidden
          ${isSettingsOpen
            ? isMobileSettingsContent
              ? "hidden md:flex"
              : "flex"
            : selectedUser
              ? "hidden md:flex"
              : "flex"}
        `}>
          {isSettingsOpen ? (
            <div className="flex h-full animate-sidebar-slide-in">
              <SettingsSidebar
                activeKey={activeSettingsKey}
                onBack={handleBackFromSettings}
                onSelect={handleSelectSettingsItem}
              />
            </div>
          ) : (
            <div className="flex h-full animate-sidebar-slide-in">
              <div className="flex h-full w-full flex-col">
                <ProfileHeader theme={theme} onToggleTheme={toggleTheme} onOpenSettings={handleOpenSettings} />
                <ActiveTabSwitch />

                <div className="flex-1 overflow-y-auto chat-scroll p-4 space-y-2 overscroll-contain" role="list" aria-label="Chats and contacts">
                  {activeTab === "chats" ? <ChatsList /> : <ContactList />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Chat area (full width on mobile when chat is open) */}
        <div className={`
          h-full flex-1 flex flex-col chat-glass overflow-hidden
          ${isSettingsOpen
            ? isMobileSettingsContent
              ? "flex"
              : "hidden md:flex"
            : selectedUser
              ? "flex"
              : "hidden md:flex"}
        `}>
          {isSettingsOpen ? (
            <div className="h-full w-full overflow-y-auto chat-scroll animate-content-fade-in">
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
