import { useEffect } from "react";
import { VolumeOffIcon, Volume2Icon, MoreVertical, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNotificationStore } from "../store/useNotificationStore";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader({ theme, onToggleTheme, onOpenSettings }) {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <div className="p-4 md:p-6 border-b border-border bg-bg-surface/50 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* AVATAR */}
          <div className="relative">
            <button
              className="size-12 md:size-14 rounded-full overflow-hidden ring-2 ring-border hover:ring-accent-primary/60 transition-all duration-300 shadow-md"
              onClick={() => navigate("/profile")}
            >
              <img
                src={authUser.profilePic || "/avatar.png"}
                alt="User image"
                className="size-full object-cover"
              />
            </button>
            <div className="absolute bottom-0 right-0 online-dot" />
          </div>

          {/* USERNAME & ONLINE TEXT */}
          <div>
            <h3 className="text-text-primary font-semibold text-sm md:text-base max-w-[120px] sm:max-w-[150px] md:max-w-[180px] truncate">
              {authUser.fullName}
            </h3>
            <p className="text-xs flex items-center gap-1.5 text-text-muted font-medium mt-0.5">
              <span className="text-success text-[10px]">●</span> Online
            </p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-2 items-center">
          <button
            onClick={onToggleTheme}
            className="glass-button rounded-xl p-2.5 flex items-center justify-center hover:scale-105 transition-transform"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-text-secondary" /> : <Moon className="w-5 h-5 text-text-secondary" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="glass-button relative rounded-xl p-2.5 flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="Open settings"
            title="Open settings"
          >
            <MoreVertical className="w-5 h-5 text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* SOUND TOGGLE BTN */}
          <button
            className="glass-button rounded-xl p-2.5 flex items-center justify-center hover:scale-105 transition-transform"
            onClick={() => {
              mouseClickSound.currentTime = 0;
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
            aria-label={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
            title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="w-5 h-5 text-accent-primary" />
            ) : (
              <VolumeOffIcon className="w-5 h-5 text-text-muted" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default ProfileHeader;
