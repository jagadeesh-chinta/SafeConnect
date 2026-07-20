import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, UserCheck, UserX, Users, Inbox } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useChatStore } from "../store/useChatStore";

function RequestsPage({ embedded = false, onBack }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { requestsRefreshTrigger } = useChatStore();
  const handleBack = () => {
    if (embedded && onBack) {
      onBack();
      return;
    }
    navigate("/");
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/friend-requests");
      // Sort newest first
      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRequests(sorted);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [requestsRefreshTrigger]);

  const handleAccept = async (id) => {
    try {
      await axiosInstance.post("/friend-request/accept", { requestId: id });
      toast.success("Friend request accepted!");
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept");
    }
  };

  const handleReject = async (id) => {
    try {
      await axiosInstance.post("/friend-request/reject", { requestId: id });
      toast.success("Friend request rejected");
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject");
    }
  };

  const pageTheme = localStorage.getItem("chatTheme") || "dark";

  return (
    <div className={`feature-page chat-theme-${pageTheme} flex items-center justify-center p-2 md:p-4`}>
      <div className="w-full max-w-md">
        {/* Back button */}
        <div className="mb-4 md:mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="feature-back-btn cursor-pointer relative z-10 flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="feature-card p-4 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-3 rounded-full">
                <Users className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">Friend Requests</h1>
            <p className="text-slate-400 text-sm">
              {loading
                ? "Loading..."
                : requests.length === 0
                ? "No pending requests"
                : `${requests.length} pending request${requests.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Inbox className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-lg font-medium">No pending friend requests</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="bg-slate-700/40 border border-slate-600/30 rounded-lg p-4 flex items-center gap-4 hover:bg-slate-700/60 transition-colors"
                >
                  {/* Avatar */}
                  <img
                    src={req.senderId?.profilePic || "/avatar.png"}
                    alt={req.senderId?.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-600 flex-shrink-0"
                  />

                  {/* Name + time */}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-100 font-medium truncate">
                      {req.senderId?.fullName || "Unknown user"}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(req._id)}
                      title="Accept"
                      className="cursor-pointer p-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <UserCheck className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReject(req._id)}
                      title="Reject"
                      className="cursor-pointer p-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <UserX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestsPage;
