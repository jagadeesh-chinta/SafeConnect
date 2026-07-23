import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Inbox } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";

function NotificationsPage({ embedded = false, onBack }) {
  const navigate = useNavigate();
  const socket = useAuthStore((state) => state.socket);
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAllAsRead,
    fetchUnreadCount,
  } = useNotificationStore();

  const pageTheme = localStorage.getItem("chatTheme") || "dark";
  const handleBack = () => {
    if (embedded && onBack) {
      onBack();
      return;
    }
    navigate("/");
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      await fetchNotifications();
      await markAllAsRead();
      await fetchUnreadCount();
    };

    initializeNotifications();
  }, [fetchNotifications, markAllAsRead, fetchUnreadCount]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      fetchNotifications();
      fetchUnreadCount();
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, fetchNotifications, fetchUnreadCount]);

  return (
    <div className={`feature-page chat-theme-${pageTheme} flex items-center justify-center p-2 md:p-4`}>
      <div className="w-full max-w-2xl">
        <div className="mb-4 md:mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="feature-back-btn cursor-pointer relative z-10 flex items-center gap-2 px-3 py-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary/50 rounded-lg transition-all min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        <div className="feature-card p-4 md:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-100 mb-1">Notifications</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Inbox className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-lg font-medium">No notifications</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {notifications.map((item) => (
                <div
                  key={item._id}
                  className="bg-bg-secondary/50 border border-border shadow-inner rounded-xl p-5 hover:bg-bg-secondary transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-text-primary text-sm font-bold truncate">
                        {item.senderId?.fullName || "Unknown"}
                      </p>
                      <p className="text-text-secondary mt-1 text-sm">{item.message}</p>
                    </div>
                    <p className="text-text-muted text-xs font-mono whitespace-nowrap mt-0.5">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
