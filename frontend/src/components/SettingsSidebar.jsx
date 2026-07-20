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
    <section
      className="flex h-full flex-col"
      aria-label="Settings navigation"
    >
      <div className="chat-gradient-header chat-glass-strong border-b border-white/10 p-4 md:p-6">
        <button
          type="button"
          onClick={onBack}
          className="ripple-btn chat-btn mb-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Back to chats"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h2 className="text-lg font-semibold text-slate-100 md:text-xl">Settings</h2>
      </div>

      <nav className="chat-scroll flex-1 space-y-2 overflow-y-auto p-4" aria-label="Settings options">
        {SETTINGS_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={`chat-list-item flex min-h-[60px] w-full items-center gap-3 rounded-xl p-3 text-left md:p-4 ${isActive ? "chat-list-item-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={`h-5 w-5 ${item.danger ? "text-red-400" : "text-slate-300"}`} />
              <span className={`flex-1 text-sm font-medium md:text-base ${item.danger ? "text-red-300" : "text-slate-200"}`}>
                {item.label}
              </span>

              {item.hasBadge && unreadCount > 0 ? (
                <span className="chat-unread-badge flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </section>
  );
}

export default memo(SettingsSidebar);
