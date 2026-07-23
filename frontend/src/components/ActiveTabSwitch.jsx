import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="flex p-2 mx-3 mt-4 bg-bg-secondary rounded-xl gap-1">
      <button
        onClick={() => setActiveTab("chats")}
        aria-label="Show favourites"
        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
          activeTab === "chats"
            ? "bg-bg-surface text-text-primary shadow-sm"
            : "text-text-muted hover:text-text-secondary"
        }`}
      >
        Favourites
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        aria-label="Show contacts"
        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
          activeTab === "contacts"
            ? "bg-bg-surface text-text-primary shadow-sm"
            : "text-text-muted hover:text-text-secondary"
        }`}
      >
        Contacts
      </button>
    </div>
  );
}
export default ActiveTabSwitch;
