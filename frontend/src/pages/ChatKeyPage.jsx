import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Key, Copy, Check, Users, Lock, Eye, EyeOff } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

function ChatKeyPage({ embedded = false, onBack }) {
  const navigate = useNavigate();
  const [chatKeys, setChatKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  // Password protection states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordSet, setIsPasswordSet] = useState(null); // null = loading, true/false = known
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const handleBack = () => {
    if (embedded && onBack) {
      onBack();
      return;
    }
    navigate("/");
  };

  // Check if ChatKey password is set on mount
  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const res = await axiosInstance.get("/chatkey/status");
        setIsPasswordSet(res.data.isChatKeyPasswordSet);
      } catch (error) {
        console.error("Error checking password status:", error);
        toast.error("Failed to check password status");
        setIsPasswordSet(false);
      } finally {
        setLoading(false);
      }
    };

    checkPasswordStatus();
  }, []);

  // Fetch chat keys after authentication
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchChatKeys = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/messages/chatkeys");
        setChatKeys(res.data || []);
      } catch (error) {
        console.error("Error fetching chat keys:", error);
        toast.error(error.response?.data?.message || "Failed to fetch chat keys");
        setChatKeys([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChatKeys();
  }, [isAuthenticated]);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      await axiosInstance.post("/chatkey/set-password", {
        password,
        confirmPassword,
      });
      toast.success("ChatKey password set successfully!");
      setIsPasswordSet(true);
      setIsAuthenticated(true);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error.response?.data?.message || "Failed to set password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    setPasswordLoading(true);
    try {
      await axiosInstance.post("/chatkey/verify-password", { password });
      setIsAuthenticated(true);
      setPassword("");
    } catch (error) {
      setPasswordError(error.response?.data?.message || "Invalid Credentials");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCopyKey = (sharedKey, friendId) => {
    navigator.clipboard.writeText(sharedKey);
    setCopiedKey(friendId);
    toast.success("Key copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pageTheme = localStorage.getItem("chatTheme") || "dark";

  const renderCentered = (content) => (
    <div className={`feature-page chat-theme-${pageTheme} w-full flex items-center justify-center p-4`}>
      {content}
    </div>
  );

  // Loading state while checking password status
  if (loading && isPasswordSet === null) {
    return renderCentered(
      <div className="feature-card w-full max-w-2xl p-6 relative z-10">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      </div>
    );
  }

  // Password Setup Form (First Time)
  if (!isAuthenticated && isPasswordSet === false) {
    return renderCentered(
      <div className="feature-card w-full max-w-md p-4 md:p-6 mx-2 relative z-10">
        <div className="flex items-center gap-3 md:gap-4 mb-6">
          <button
            onClick={handleBack}
            className="feature-back-btn text-slate-400 hover:text-slate-200 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-accent-primary" />
            <h1 className="text-lg md:text-xl font-bold text-white">Set ChatKey Password</h1>
          </div>
        </div>

        <div className="bg-bg-secondary/50 border border-border rounded-xl p-5 mb-6 shadow-inner">
          <p className="text-text-secondary text-sm">
            Protect your encryption keys with a password. You'll need this password to view your ChatKeys.
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all shadow-inner pr-10"
                placeholder="Enter password (min 6 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all shadow-inner pr-10"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {passwordError && (
            <p className="text-red-400 text-sm">{passwordError}</p>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full primary-button py-3 font-bold rounded-xl shadow-lg shadow-accent-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordLoading ? "Setting Password..." : "Set Password"}
          </button>
        </form>
      </div>
    );
  }

  // Password Verification Form (Returning User)
  if (!isAuthenticated && isPasswordSet === true) {
    return renderCentered(
      <div className="feature-card w-full max-w-md p-4 md:p-6 mx-2 relative z-10">
        <div className="flex items-center gap-3 md:gap-4 mb-6">
          <button
            onClick={handleBack}
            className="feature-back-btn text-slate-400 hover:text-slate-200 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-accent-primary" />
            <h1 className="text-lg md:text-xl font-bold text-white">Unlock ChatKeys</h1>
          </div>
        </div>

        <div className="bg-bg-secondary/50 border border-border rounded-xl p-5 mb-6 shadow-inner">
          <p className="text-text-secondary text-sm">
            Enter your password to access your encryption keys.
          </p>
        </div>

        <form onSubmit={handleVerifyPassword} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all shadow-inner pr-10"
                placeholder="Enter your password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {passwordError && (
            <p className="text-red-400 text-sm">{passwordError}</p>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full primary-button py-3 font-bold rounded-xl shadow-lg shadow-accent-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordLoading ? "Verifying..." : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  // Authenticated - Show Chat Keys
  return renderCentered(
    <div className="feature-card w-full max-w-2xl p-4 md:p-6 mx-2 relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4 mb-6">
        <button
          onClick={handleBack}
          className="feature-back-btn text-slate-400 hover:text-slate-200 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Key className="w-6 h-6 text-accent-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-white">Chat Keys</h1>
        </div>
      </div>

      {/* Description */}
      <div className="bg-bg-secondary/50 border border-border rounded-xl p-5 mb-6 shadow-inner">
        <p className="text-text-secondary text-sm">
          These are your BB84 quantum-generated shared encryption keys with your friends.
          Use these keys to restore chat history or verify secure communication.
        </p>
      </div>

      {/* Chat Keys List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      ) : chatKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No Chat Keys Yet</h3>
          <p className="text-slate-400">
            Add friends to generate shared encryption keys.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {chatKeys.map((item) => (
            <div
              key={item.friendId}
              className="bg-bg-secondary/50 border border-border rounded-xl p-5 hover:bg-bg-secondary transition-all shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img
                      src={item.friendProfilePic || "/avatar.png"}
                      alt={item.friendName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-slate-200 font-medium">{item.friendName}</h3>
                  <p className="text-slate-500 text-xs">
                    Created: {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2.5 font-mono text-xs text-accent-primary shadow-inner break-all">
                  {item.sharedKey}
                </div>
                <button
                  onClick={() => handleCopyKey(item.sharedKey, item.friendId)}
                  className="p-2.5 text-text-muted hover:text-accent-primary hover:bg-bg-secondary rounded-lg transition-colors border border-transparent hover:border-border"
                  title="Copy key"
                >
                  {copiedKey === item.friendId ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatKeyPage;
