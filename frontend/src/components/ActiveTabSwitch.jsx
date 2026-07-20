import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="tabs tabs-boxed bg-transparent p-2 mx-2 md:m-2 gap-2">
      <button
        onClick={() => setActiveTab("chats")}
        aria-label="Show favourites"
        className={`tab ripple-btn chat-btn flex-1 min-h-[44px] text-sm md:text-base rounded-xl border border-white/10 ${
          activeTab === "chats"
            ? "bg-gradient-to-r from-[#00c6ff]/30 to-[#00ffcc]/20 text-slate-100 shadow-[0_8px_24px_rgba(0,198,255,0.18)]"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
        }`}
      >
        Favourites
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        aria-label="Show contacts"
        className={`tab ripple-btn chat-btn flex-1 min-h-[44px] text-sm md:text-base rounded-xl border border-white/10 ${
          activeTab === "contacts"
            ? "bg-gradient-to-r from-[#00c6ff]/30 to-[#00ffcc]/20 text-slate-100 shadow-[0_8px_24px_rgba(0,198,255,0.18)]"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
        }`}
      >
        Contacts
      </button>
    </div>
  );
}
export default ActiveTabSwitch;
