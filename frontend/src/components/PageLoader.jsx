import { MessageCircleIcon } from "lucide-react";

function PageLoader() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-bg-primary">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing rings */}
        <div className="absolute size-24 rounded-full border-2 border-accent-primary/20 animate-[spin_3s_linear_infinite]" />
        <div className="absolute size-20 rounded-full border-2 border-accent-secondary/30 animate-[spin_2s_linear_infinite_reverse]" />
        <div className="absolute size-16 rounded-full border-t-2 border-accent-primary animate-spin" />
        
        {/* Brand Icon inside */}
        <div className="relative flex items-center justify-center size-12 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 shadow-[0_0_15px_var(--glow)]">
          <MessageCircleIcon className="size-6 text-accent-primary animate-pulse" />
        </div>
      </div>
      <p className="mt-6 text-sm font-medium tracking-wide text-text-muted animate-pulse">
        Initializing Secure Connection...
      </p>
    </div>
  );
}

export default PageLoader;