import { useState } from "react";
import { useNavigate } from "react-router";
import { 
  ArrowLeft, 
  User, 
  Camera, 
  Trash2, 
  Edit3, 
  Lock, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Key
} from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

function ProfilePage({ embedded = false, onBack }) {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuthStore();
  
  // Profile image state
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // Username editing state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(authUser?.fullName || "");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ChatKey password change state
  const [showChatKeyPasswordForm, setShowChatKeyPasswordForm] = useState(false);
  const [chatKeyPasswordData, setChatKeyPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isChangingChatKeyPassword, setIsChangingChatKeyPassword] = useState(false);
  const [showChatKeyCurrentPassword, setShowChatKeyCurrentPassword] = useState(false);
  const [showChatKeyNewPassword, setShowChatKeyNewPassword] = useState(false);
  const [showChatKeyConfirmPassword, setShowChatKeyConfirmPassword] = useState(false);

  // Delete profile image
  const handleDeleteImage = async () => {
    if (!authUser?.profilePic) {
      toast.error("No profile picture to delete");
      return;
    }

    setIsDeletingImage(true);
    try {
      const res = await axiosInstance.delete("/user/delete-avatar");
      setAuthUser(res.data);
      toast.success("Profile picture removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove profile picture");
    } finally {
      setIsDeletingImage(false);
    }
  };

  // Handle username update
  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (newUsername.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (newUsername.trim() === authUser.fullName) {
      setIsEditingUsername(false);
      return;
    }

    setIsUpdatingUsername(true);
    try {
      const res = await axiosInstance.put("/user/update-username", { 
        fullName: newUsername.trim() 
      });
      setAuthUser(res.data);
      setIsEditingUsername(false);
      toast.success("Username updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update username");
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  // Cancel username editing
  const handleCancelUsernameEdit = () => {
    setNewUsername(authUser?.fullName || "");
    setIsEditingUsername(false);
  };

  // Handle password change
  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      await axiosInstance.put("/user/change-password", passwordData);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Cancel password change
  const handleCancelPasswordChange = () => {
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPasswordForm(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // Handle ChatKey password change
  const handleChangeChatKeyPassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = chatKeyPasswordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All ChatKey password fields are required");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New ChatKey password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New ChatKey passwords do not match");
      return;
    }

    setIsChangingChatKeyPassword(true);
    try {
      await axiosInstance.put("/chatkey/change-password", chatKeyPasswordData);
      setChatKeyPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowChatKeyPasswordForm(false);
      toast.success("ChatKey password changed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change ChatKey password");
    } finally {
      setIsChangingChatKeyPassword(false);
    }
  };

  // Cancel ChatKey password change
  const handleCancelChatKeyPasswordChange = () => {
    setChatKeyPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowChatKeyPasswordForm(false);
    setShowChatKeyCurrentPassword(false);
    setShowChatKeyNewPassword(false);
    setShowChatKeyConfirmPassword(false);
  };

  const displayImage = authUser?.profilePic || "/avatar.png";
  const pageTheme = localStorage.getItem("chatTheme") || "dark";
  const handleBack = () => {
    if (embedded && onBack) {
      onBack();
      return;
    }
    navigate("/");
  };

  return (
    <div className={`feature-page chat-theme-${pageTheme} flex items-start justify-center p-2 md:p-4 md:py-8 overflow-y-auto`}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="feature-back-btn cursor-pointer relative z-10 flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Chat</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="feature-card p-4 md:p-8">
          {/* Profile Icon Header */}
          <div className="text-center mb-6 md:mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-3 rounded-full">
                <User className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100 mb-1">Profile Settings</h1>
            <p className="text-slate-400 text-sm">Manage your account settings</p>
          </div>

          {/* Profile Picture Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col items-center">
              {/* Profile Image */}
              <div className="relative mb-4">
                <button
                  onClick={() => authUser?.profilePic && navigate("/profile/view-image")}
                  className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-slate-700 ${authUser?.profilePic ? "cursor-pointer hover:border-cyan-500 transition-colors" : "cursor-default"}`}
                  disabled={!authUser?.profilePic}
                >
                  <img
                    src={displayImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </button>
                {authUser?.profilePic && (
                  <p className="text-slate-500 text-xs mt-1 text-center">Click to view</p>
                )}
              </div>

              {/* Image Action Buttons */}
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => navigate("/profile/crop")}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm min-h-[44px]"
                >
                  <Camera className="w-4 h-4" />
                  {authUser?.profilePic ? "Change Icon" : "Add Icon"}
                </button>
                {authUser?.profilePic && (
                  <button
                    onClick={handleDeleteImage}
                    disabled={isDeletingImage}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm"
                  >
                    {isDeletingImage ? (
                      <div className="w-4 h-4 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete Icon
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700/50 my-6"></div>

          {/* Username Section */}
          <div className="mb-6">
            <label className="block text-slate-400 text-sm mb-2">Username</label>
            {isEditingUsername ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Enter new username"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateUsername}
                    disabled={isUpdatingUsername}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white rounded-lg transition-colors"
                  >
                    {isUpdatingUsername ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={handleCancelUsernameEdit}
                    disabled={isUpdatingUsername}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                <span className="text-slate-200 font-medium">{authUser?.fullName}</span>
                <button
                  onClick={() => setIsEditingUsername(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Email Section (Read-only) */}
          <div className="mb-6">
            <label className="block text-slate-400 text-sm mb-2">Email</label>
            <div className="p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg">
              <span className="text-slate-400">{authUser?.email}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700/50 my-6"></div>

          {/* Password Section */}
          <div>
            <label className="block text-slate-400 text-sm mb-2">Password</label>
            {showPasswordForm ? (
              <div className="space-y-4 p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                {/* Current Password */}
                <div>
                  <label className="block text-slate-500 text-xs mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-slate-500 text-xs mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Enter new password (min 6 chars)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-slate-500 text-xs mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white rounded-lg transition-colors"
                  >
                    {isChangingPassword ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    Change Password
                  </button>
                  <button
                    onClick={handleCancelPasswordChange}
                    disabled={isChangingPassword}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                <span className="text-slate-400">••••••••</span>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700/50 my-6"></div>

          {/* ChatKey Password Section */}
          <div>
            <label className="block text-slate-400 text-sm mb-2">ChatKey Password</label>
            {showChatKeyPasswordForm ? (
              <div className="space-y-4 p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                {/* Current ChatKey Password */}
                <div>
                  <label className="block text-slate-500 text-xs mb-1">Current ChatKey Password</label>
                  <div className="relative">
                    <input
                      type={showChatKeyCurrentPassword ? "text" : "password"}
                      value={chatKeyPasswordData.currentPassword}
                      onChange={(e) => setChatKeyPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Enter current ChatKey password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowChatKeyCurrentPassword(!showChatKeyCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showChatKeyCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New ChatKey Password */}
                <div>
                  <label className="block text-slate-500 text-xs mb-1">New ChatKey Password</label>
                  <div className="relative">
                    <input
                      type={showChatKeyNewPassword ? "text" : "password"}
                      value={chatKeyPasswordData.newPassword}
                      onChange={(e) => setChatKeyPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Enter new ChatKey password (min 6 chars)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowChatKeyNewPassword(!showChatKeyNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showChatKeyNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New ChatKey Password */}
                <div>
                  <label className="block text-slate-500 text-xs mb-1">Confirm New ChatKey Password</label>
                  <div className="relative">
                    <input
                      type={showChatKeyConfirmPassword ? "text" : "password"}
                      value={chatKeyPasswordData.confirmPassword}
                      onChange={(e) => setChatKeyPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Confirm new ChatKey password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowChatKeyConfirmPassword(!showChatKeyConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showChatKeyConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleChangeChatKeyPassword}
                    disabled={isChangingChatKeyPassword}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white rounded-lg transition-colors"
                  >
                    {isChangingChatKeyPassword ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    Change ChatKey Password
                  </button>
                  <button
                    onClick={handleCancelChatKeyPasswordChange}
                    disabled={isChangingChatKeyPassword}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                <span className="text-slate-400">••••••••</span>
                <button
                  onClick={() => setShowChatKeyPasswordForm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm"
                >
                  <Key className="w-4 h-4" />
                  Change ChatKey Password
                </button>
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-slate-500 text-xs text-center">
              Member since {authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
