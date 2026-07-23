import { UserMinus } from "lucide-react";
import { useState } from "react";

function RemoveFriendConfirmation({ userName, onConfirm, onCancel }) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleConfirm = async () => {
    setIsRemoving(true);
    await onConfirm();
    setIsRemoving(false);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Blur backdrop */}
      <div 
        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-md"
        onClick={onCancel}
      />
      
      {/* Confirmation dialog */}
      <div className="relative glass-card border border-border rounded-2xl p-6 md:p-8 shadow-2xl max-w-sm w-full mx-4 z-10 animate-scale-in">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-danger/10 p-4 rounded-full ring-4 ring-danger/5">
            <UserMinus className="w-8 h-8 text-danger" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-text-primary text-center mb-3">
          Remove Friend
        </h3>

        {/* Message */}
        <p className="text-text-secondary text-center mb-8 leading-relaxed">
          Are you sure you want to remove <span className="text-text-primary font-bold">{userName}</span> as a friend?
        </p>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            disabled={isRemoving}
            className="flex-1 px-4 py-3 bg-bg-elevated hover:bg-bg-secondary border border-border disabled:opacity-50 text-text-primary rounded-xl transition-colors font-semibold min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isRemoving}
            className="flex-1 px-4 py-3 bg-danger hover:bg-danger/90 disabled:opacity-50 text-white rounded-xl transition-colors font-bold flex items-center justify-center gap-2 min-h-[44px] shadow-lg shadow-danger/20"
          >
            {isRemoving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "YES"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RemoveFriendConfirmation;
