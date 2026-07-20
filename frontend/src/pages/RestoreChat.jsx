import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Users, Download, Eye, RotateCcw, X, Key, Lock } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

function RestoreChat({ embedded = false, onBack }) {
  const navigate = useNavigate();
  const [deletedChats, setDeletedChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState(null);
  const [viewingChat, setViewingChat] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(null);
  const [restoringChat, setRestoringChat] = useState(null);
  
  // Key verification state
  const [verifiedChats, setVerifiedChats] = useState({}); // { deletedUserId: true/false }
  const [keyInputs, setKeyInputs] = useState({}); // { deletedUserId: "enteredKey" }
  const [verifyingKey, setVerifyingKey] = useState(null); // deletedUserId currently being verified
  const [nowMs, setNowMs] = useState(Date.now());
  const handleBack = () => {
    if (embedded && onBack) {
      onBack();
      return;
    }
    navigate("/");
  };

  // Fetch deleted chats on mount
  useEffect(() => {
    const fetchDeletedChats = async () => {
      try {
        const res = await axiosInstance.get("/chat/deleted");
        setDeletedChats(res.data || []);
      } catch (error) {
        console.error("Error fetching deleted chats:", error);
        toast.error(error.response?.data?.message || "Failed to fetch deleted chats");
        setDeletedChats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeletedChats();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatRemainingTime = (remainingMs) => {
    const safeMs = Math.max(0, remainingMs);
    const totalSeconds = Math.floor(safeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const activeDeletedChats = deletedChats.filter((chat) => {
    const expiresAtMs = new Date(chat.expiresAt).getTime();
    return expiresAtMs > nowMs;
  });

  // Handle key input change
  const handleKeyInputChange = (deletedUserId, value) => {
    setKeyInputs((prev) => ({ ...prev, [deletedUserId]: value }));
  };

  // Verify the chat key
  const handleVerifyKey = async (deletedUserId) => {
    const enteredKey = keyInputs[deletedUserId]?.trim();
    if (!enteredKey) {
      toast.error("Please enter a chat key");
      return;
    }

    setVerifyingKey(deletedUserId);
    try {
      const res = await axiosInstance.post(`/chat/verify-key/${deletedUserId}`, {
        enteredKey,
      });

      if (res.data.verified) {
        setVerifiedChats((prev) => ({ ...prev, [deletedUserId]: true }));
        toast.success("Chat key verified!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid chat key");
    } finally {
      setVerifyingKey(null);
    }
  };

  const handleRestoreChat = async (deletedUserId) => {
    setRestoringChat(deletedUserId);
    try {
      await axiosInstance.post(`/chat/restore/${deletedUserId}`);
      // Remove from deleted chats list
      setDeletedChats((prev) => prev.filter((c) => c.deletedUserId !== deletedUserId));
      toast.success("Chat restored! Check your Contacts.");
      setChatHistory(null);
      setViewingChat(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to restore chat");
    } finally {
      setRestoringChat(null);
    }
  };

  const handleViewChat = async (deletedUserId) => {
    setLoadingHistory(true);
    try {
      const res = await axiosInstance.get(`/chat/history/${deletedUserId}`);
      setChatHistory(res.data);
      setViewingChat(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chat history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDownloadPDF = async (deletedUserId, fullName) => {
    setDownloadingPDF(deletedUserId);
    try {
      const res = await axiosInstance.get(`/chat/export/${deletedUserId}`, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `chat_${fullName.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to download PDF");
    } finally {
      setDownloadingPDF(null);
    }
  };

  const closeViewChat = () => {
    setViewingChat(false);
    setChatHistory(null);
  };

  const pageTheme = localStorage.getItem("chatTheme") || "dark";

  return (
    <div className={`feature-page chat-theme-${pageTheme} flex items-center justify-center p-2 md:p-4`}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-4 md:mb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="feature-back-btn cursor-pointer relative z-10 flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* View Chat Modal */}
        {viewingChat && chatHistory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[85vh] md:max-h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-700">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={chatHistory.otherUser?.profilePic || "/avatar.png"}
                      alt={chatHistory.otherUser?.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-200 truncate">
                    Chat with {chatHistory.otherUser?.fullName}
                  </h3>
                </div>
                <button
                  onClick={closeViewChat}
                  className="text-slate-400 hover:text-slate-200 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.messages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">No messages found</div>
                ) : (
                  chatHistory.messages.map((msg, idx) => {
                    const isOwn = msg.senderId !== chatHistory.otherUser._id;
                    return (
                      <div
                        key={idx}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwn ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-200"
                          }`}
                        >
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt="Shared"
                              className="rounded-lg h-32 object-cover mb-2"
                            />
                          )}
                          {msg.text && <p>{msg.text}</p>}
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="feature-card p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 rounded-full">
                <RotateCcw className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Restore Deleted Chats</h1>
            <p className="text-slate-400 text-sm">
              View, download, or restore your deleted conversations
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin">
                <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full"></div>
              </div>
            </div>
          )}

          {/* No Deleted Chats */}
          {!loading && activeDeletedChats.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400 mb-4">No deleted chats found</p>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Go to Chats
              </button>
            </div>
          )}

          {/* Deleted Chats List */}
          {!loading && activeDeletedChats.length > 0 && (
            <div className="space-y-4">
              {activeDeletedChats.map((chat) => {
                const remainingMs = Math.max(0, new Date(chat.expiresAt).getTime() - nowMs);
                const remainingLabel = formatRemainingTime(remainingMs);

                return (
                <div
                  key={chat.deletedUserId}
                  className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img
                        src={chat.profilePic || "/avatar.png"}
                        alt={chat.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-slate-200 font-medium">{chat.fullName}</h3>
                      <p className="text-slate-500 text-xs">
                        Deleted: {new Date(chat.deletedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide">Expires In</p>
                      <p className={`text-sm font-semibold ${remainingMs <= 10 * 60 * 1000 ? "text-red-400" : "text-cyan-300"}`}>
                        {remainingLabel}
                      </p>
                    </div>
                  </div>

                  {/* Key Verification or Action Buttons */}
                  {!verifiedChats[chat.deletedUserId] ? (
                    // Key Verification Form
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Lock className="w-4 h-4" />
                        <span>Enter shared chat key to access options</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={keyInputs[chat.deletedUserId] || ""}
                            onChange={(e) => handleKeyInputChange(chat.deletedUserId, e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleVerifyKey(chat.deletedUserId)}
                            placeholder="Enter 64-character shared key"
                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg pl-10 pr-4 py-2 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                          />
                        </div>
                        <button
                          onClick={() => handleVerifyKey(chat.deletedUserId)}
                          disabled={verifyingKey === chat.deletedUserId}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {verifyingKey === chat.deletedUserId ? "Verifying..." : "Verify"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Action Buttons (shown after verification)
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleRestoreChat(chat.deletedUserId)}
                        disabled={restoringChat === chat.deletedUserId}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {restoringChat === chat.deletedUserId ? "Restoring..." : "Restore Chat"}
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(chat.deletedUserId, chat.fullName)}
                        disabled={downloadingPDF === chat.deletedUserId}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        {downloadingPDF === chat.deletedUserId ? "Downloading..." : "Download PDF"}
                      </button>
                      <button
                        onClick={() => handleViewChat(chat.deletedUserId)}
                        disabled={loadingHistory}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {loadingHistory ? "Loading..." : "View Chat"}
                      </button>
                    </div>
                  )}
                </div>
              );})}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-500">
          <p>BB84 Quantum Key Distribution Simulation (Academic Purpose)</p>
        </div>
      </div>
    </div>
  );
}

export default RestoreChat;
