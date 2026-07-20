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
    <div className="p-4 md:p-6 border-b border-white/10 chat-gradient-header chat-glass-strong">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          {/* AVATAR */}
          <div className="avatar online">
            <button
              className="size-10 md:size-14 rounded-full overflow-hidden relative group cursor-pointer ring-2 ring-white/10 hover:ring-[#00c6ff]/60 transition-all duration-300"
              onClick={() => navigate("/profile")}
            >
              <img
                src={authUser.profilePic || "/avatar.png"}
                alt="User image"
                className="size-full object-cover"
              />
            </button>
          </div>

          {/* USERNAME & ONLINE TEXT */}
          <div>
            <h3 className="text-slate-200 font-medium text-sm md:text-base max-w-[120px] sm:max-w-[150px] md:max-w-[180px] truncate">
              {authUser.fullName}
            </h3>

            <p className="text-xs flex items-center gap-1.5 chat-text-muted">
              <span className="chat-dot-online" />
              Online
            </p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-2 md:gap-4 items-center">
          <button
            onClick={onToggleTheme}
            className="ripple-btn chat-btn text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="ripple-btn chat-btn relative text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open settings"
            title="Open settings"
          >
            <MoreVertical className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* SOUND TOGGLE BTN */}
          <button
            className="ripple-btn chat-btn text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => {
              // play click sound before toggling
              mouseClickSound.currentTime = 0; // reset to start
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
            aria-label={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
            title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-5" />
            ) : (
              <VolumeOffIcon className="size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default ProfileHeader;
