import { useNavigate } from "react-router";
import { ArrowLeft, Download, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

function ViewProfileImage() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();

  const profileImage = authUser?.profilePic || "/avatar.png";
  const hasCustomImage = !!authUser?.profilePic;

  // Handle download
  const handleDownload = async () => {
    if (!authUser?.profilePic) return;

    try {
      const response = await fetch(authUser.profilePic);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `profile_${authUser.fullName?.replace(/\s+/g, "_") || "image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  // Handle close
  const handleClose = () => {
    navigate("/profile");
  };

  const pageTheme = localStorage.getItem("chatTheme") || "dark";

  return (
    <div className={`feature-page chat-theme-${pageTheme} flex flex-col`}>
      {/* Header */}
      <div className="feature-card !rounded-none !border-x-0 !border-t-0 border-b border-border flex items-center justify-between p-4 z-10 relative">
        <button
          type="button"
          onClick={handleClose}
          className="feature-back-btn flex items-center gap-2 px-3 py-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary/50 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Profile</span>
        </button>

        <div className="flex items-center gap-2">
          {hasCustomImage && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-bg-elevated hover:bg-bg-secondary text-text-primary border border-border rounded-lg transition-all font-semibold text-sm shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary/50 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative max-w-3xl max-h-[80vh] w-full h-full flex items-center justify-center">
          <img
            src={profileImage}
            alt="Profile Preview"
            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl ring-1 ring-border"
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 text-center">
        <p className="text-slate-400 text-sm">
          {authUser?.fullName}'s Profile Picture
        </p>
      </div>
    </div>
  );
}

export default ViewProfileImage;
