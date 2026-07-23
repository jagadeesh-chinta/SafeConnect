import { AlertTriangle } from "lucide-react";

function ScreenshotOverlay({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
      <div className="glass-card border border-border rounded-2xl p-8 shadow-2xl max-w-sm animate-scale-in">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-danger/10 border-[3px] border-danger/30 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(var(--color-danger-rgb),0.2)]">
            <AlertTriangle className="w-10 h-10 text-danger" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-text-primary mb-2">Screenshot Disabled</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Screenshots are restricted for security reasons
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScreenshotOverlay;
