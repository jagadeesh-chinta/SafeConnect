import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

function FriendRequestBlock({ otherUser, status }) {
  const [loading, setLoading] = useState(false);
  const { fetchFriendStatus } = useChatStore();

  if (!status) {
    return null;
  }

  // Case 1: Already friends - should not render (ChatContainer should show MessageInput instead)
  if (status.status === "friends") {
    return null;
  }

  // Case 2: Friends already - show nothing
  if (status.status === "friends") {
    return null;
  }

  // Case 3: Request sent by me - show "Friend Request Sent"
  if (status.status === "sent") {
    return (
      <div className="p-6 md:p-8 text-center bg-bg-secondary/50 m-4 md:m-6 rounded-2xl border border-border shadow-inner">
        <p className="text-text-primary font-medium mb-3">Friend request sent to <span className="font-bold">{otherUser?.fullName}</span></p>
        <p className="text-text-muted text-sm">Waiting for their approval.</p>
      </div>
    );
  }

  // Case 4: Request received by me - show "Accept/Reject"
  if (status.status === "received") {
    const handleAccept = async () => {
      setLoading(true);
      try {
        await axiosInstance.post(`/friend-request/accept`, { requestId: status.requestId });
        toast.success("Friend request accepted!");
        // Refresh friend status to update UI
        await fetchFriendStatus(otherUser._id);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to accept request");
      } finally {
        setLoading(false);
      }
    };

    const handleReject = async () => {
      setLoading(true);
      try {
        await axiosInstance.post(`/friend-request/reject`, { requestId: status.requestId });
        toast.success("Friend request rejected");
        // Refresh friend status to update UI
        await fetchFriendStatus(otherUser._id);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to reject request");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="p-6 md:p-8 text-center bg-bg-secondary/50 m-4 md:m-6 rounded-2xl border border-border shadow-inner">
        <p className="text-text-primary font-medium mb-6"><span className="font-bold">{status.senderName}</span> wants to be your friend</p>
        <div className="flex gap-4 justify-center">
          <button
            disabled={loading}
            onClick={handleReject}
            className="px-6 py-2.5 bg-bg-elevated text-text-primary hover:bg-danger/10 hover:text-danger border border-border rounded-xl font-semibold disabled:opacity-50 min-h-[44px] transition-colors"
          >
            Reject
          </button>
          <button
            disabled={loading}
            onClick={handleAccept}
            className="px-6 py-2.5 bg-success text-white hover:bg-success/90 rounded-xl font-bold disabled:opacity-50 min-h-[44px] shadow-lg shadow-success/20 transition-all"
          >
            Accept
          </button>
        </div>
      </div>
    );
  }

  // Case 5: No relationship - show "Send Friend Request"
  if (status.status === "not_friends") {
    const handleSendRequest = async () => {
      setLoading(true);
      try {
        await axiosInstance.post(`/friend-request`, { receiverId: otherUser._id });
        toast.success("Friend request sent!");
        // Refresh friend status to update UI
        await fetchFriendStatus(otherUser._id);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send request");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="p-6 md:p-8 text-center bg-bg-secondary/50 m-4 md:m-6 rounded-2xl border border-border shadow-inner">
        <p className="text-text-primary font-medium mb-6">You must send a friend request to start chatting</p>
        <button
          disabled={loading}
          onClick={handleSendRequest}
          className="primary-button px-6 py-2.5 font-bold rounded-xl disabled:opacity-50 min-h-[44px]"
        >
          Send Friend Request
        </button>
      </div>
    );
  }

  return null;
}

export default FriendRequestBlock;
