import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, Loader2 } from "lucide-react";

function WelcomeScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.removeItem("chatifyShowWelcome");
      navigate("/chat", { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex items-center justify-center bg-bg-primary">
      {/* Animated Background Mesh */}
      <div className="absolute inset-[-20%] pointer-events-none opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-accent-primary/40 rounded-full blur-[100px] animate-[spin_8s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-accent-secondary/30 rounded-full blur-[80px] animate-[spin_6s_linear_infinite_reverse]" />
      </div>

      <div className="relative z-10 w-[min(92vw,600px)] p-12 text-center glass-card rounded-[24px] animate-scale-in">
        <div className="mx-auto size-24 mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/20 shadow-[0_0_30px_var(--glow)] animate-pulse-glow">
          <ShieldCheck className="size-12 text-accent-primary drop-shadow-[0_0_10px_var(--glow)]" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-3 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          Welcome to Chatify
        </h1>
        <p className="text-lg text-text-secondary mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          Quantum Encrypted Chat Application
        </p>

        <div className="inline-flex items-center gap-3 text-text-secondary font-medium animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <Loader2 className="size-5 animate-spin text-accent-primary" />
          <span>Initializing Secure Connection...</span>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
