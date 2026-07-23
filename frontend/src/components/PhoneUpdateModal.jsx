import { useState, useEffect } from "react";
import { X, Phone, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/useAuthStore";

function PhoneUpdateModal() {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (
      authUser && 
      !authUser.phoneNumber && 
      sessionStorage.getItem("phoneUpdateAlertDismissed") !== "1"
    ) {
      timeoutId = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
    } else {
      setIsVisible(false);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [authUser]);

  const handleDismiss = () => {
    sessionStorage.setItem("phoneUpdateAlertDismissed", "1");
    setIsVisible(false);
  };

  const handleGoToProfile = () => {
    sessionStorage.setItem("phoneUpdateAlertDismissed", "1");
    setIsVisible(false);
    navigate("/profile");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Modal Content */}
      <div className="relative bg-bg-elevated border border-border rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-2xl animate-scaleIn">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-text-primary hover:bg-bg-secondary p-1.5 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mb-4 ring-4 ring-accent-primary/5">
            <Phone className="w-8 h-8 text-accent-primary" />
          </div>
          
          <h2 className="text-xl font-bold text-text-primary mb-2">Update Your Profile</h2>
          
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">
            Please add your phone number to secure your account and allow friends to find you more easily.
          </p>

          <button
            onClick={handleGoToProfile}
            className="w-full primary-button py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-accent-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Update Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhoneUpdateModal;
