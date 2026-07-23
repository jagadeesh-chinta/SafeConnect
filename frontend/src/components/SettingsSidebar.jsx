import { memo } from "react";
import { ArrowLeft, KeyRound, Bell, LogOut, RotateCcw, User, UserPlus2 } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";

const SETTINGS_ITEMS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "chatkey", label: "ChatKey", icon: KeyRound },
  { key: "restore-chat", label: "Restore Chat", icon: RotateCcw },
  { key: "requests", label: "Requests", icon: UserPlus2 },
  { key: "notifications", label: "Notifications", icon: Bell, hasBadge: true },
  { key: "logout", label: "Logout", icon: LogOut, danger: true },
];

function SettingsSidebar({ activeKey, onBack, onSelect }) {
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <section className="flex h-full w-full flex-col" aria-label="Settings navigation">
      <div className="bg-bg-surface/50 backdrop-blur-md border-b border-border p-4 md:p-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="glass-button rounded-xl p-2.5 flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Back to chats"
        >
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>

        <h2 className="text-xl font-bold text-text-primary">Settings</h2>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-4" aria-label="Settings options">
        {SETTINGS_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={`chat-list-item flex min-h-[60px] w-full items-center gap-4 rounded-xl p-3 md:p-4 transition-all duration-200 ${isActive ? "active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={`p-2 rounded-lg ${isActive ? "bg-accent-primary/10" : "bg-bg-secondary"} ${item.danger ? "!bg-danger/10" : ""}`}>
                <Icon className={`h-5 w-5 ${item.danger ? "text-danger" : isActive ? "text-accent-primary" : "text-text-secondary"}`} />
              </div>
              <span className={`flex-1 text-left text-sm font-semibold md:text-base ${item.danger ? "text-danger" : isActive ? "text-accent-primary" : "text-text-primary"}`}>
                {item.label}
              </span>

              {item.hasBadge && unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-primary px-1.5 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </section>
  );
}

export default memo(SettingsSidebar);
