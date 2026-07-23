import { MessageCircleIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function NoChatsFound() {
  const { setActiveTab } = useChatStore();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4 animate-fade-in">
      <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <MessageCircleIcon className="w-10 h-10 text-accent-primary" />
      </div>
      <h4 className="text-text-primary text-lg font-semibold mb-2">No conversations yet</h4>
      <p className="text-text-secondary text-sm max-w-[250px] mb-8 leading-relaxed">
        Start a new secure chat by selecting a friend from the contacts tab
      </p>
      <button
        onClick={() => setActiveTab("contacts")}
        className="primary-button px-6 py-2.5 rounded-xl text-sm font-semibold tracking-wide"
      >
        Find Contacts
      </button>
    </div>
  );
}
export default NoChatsFound;
