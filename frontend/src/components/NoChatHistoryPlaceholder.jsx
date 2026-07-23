import { MessageCircleIcon } from "lucide-react";

const NoChatHistoryPlaceholder = ({ name }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_24px_rgba(var(--color-accent-primary-rgb),0.2)]">
        <MessageCircleIcon className="size-10 text-accent-primary" />
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-3">
        Start your conversation with {name}
      </h3>
      <div className="flex flex-col space-y-4 max-w-md mb-8">
        <p className="text-text-secondary text-sm">
          This is the beginning of your conversation. Send a message to start chatting!
        </p>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent mx-auto"></div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <button className="glass-button px-5 py-2.5 text-sm font-semibold text-accent-primary rounded-full hover:bg-accent-primary/10 transition-colors border border-accent-primary/20 shadow-sm">
          👋 Say Hello
        </button>
        <button className="glass-button px-5 py-2.5 text-sm font-semibold text-accent-primary rounded-full hover:bg-accent-primary/10 transition-colors border border-accent-primary/20 shadow-sm">
          🤝 How are you?
        </button>
        <button className="glass-button px-5 py-2.5 text-sm font-semibold text-accent-primary rounded-full hover:bg-accent-primary/10 transition-colors border border-accent-primary/20 shadow-sm">
          📅 Meet up soon?
        </button>
      </div>
    </div>
  );
};

export default NoChatHistoryPlaceholder;
