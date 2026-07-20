import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === "development" ? "http://localhost:3000" : "");

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isVerifyingOTP: false,
  otpEmail: null,
  otpExpiresAt: null,
  socket: null,
  onlineUsers: [],

  setAuthUser: (user) => set({ authUser: user }),
  setOtpEmail: (email) => set({ otpEmail: email }),
  setOtpExpiresAt: (otpExpiresAt) => set({ otpExpiresAt }),
  setIsVerifyingOTP: (isVerifying) => set({ isVerifyingOTP: isVerifying }),

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in authCheck:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: null, otpEmail: null, otpExpiresAt: null });
      toast.success(res?.data?.message || "Account created successfully! Please sign in.");
      return true;
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to sign up right now";
      toast.error(message);
      console.log("Signup error:", error);
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      // Don't set authUser yet - wait for OTP verification
      set({
        otpEmail: res.data.email,
        otpExpiresAt: res.data.otpExpiresAt || null,
      });
      toast.success(res?.data?.message || "OTP sent successfully");
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to log in right now";
      toast.error(message);
      console.log("Login error:", error);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  verifyOTP: async (email, otp) => {
    set({ isVerifyingOTP: true });
    try {
      const res = await axiosInstance.post("/auth/verify-otp", { email, otp });
      set({ authUser: res.data, otpEmail: null, otpExpiresAt: null });
      sessionStorage.setItem("chatifyShowWelcome", "1");
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to verify OTP";
      toast.error(message);
      console.log("OTP verification error:", error);
    } finally {
      set({ isVerifyingOTP: false });
    }
  },

  resendOTP: async (email) => {
    try {
      const res = await axiosInstance.post("/auth/resend-otp", { email });
      set({
        otpEmail: res?.data?.email || email,
        otpExpiresAt: res?.data?.otpExpiresAt || null,
      });
      toast.success(res?.data?.message || "OTP resent successfully");
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to resend OTP";
      toast.error(message);
      console.log("Resend OTP error:", error);
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null, otpEmail: null, otpExpiresAt: null });
      // Clear chat-related localStorage items
      localStorage.removeItem("selectedUser");
      localStorage.removeItem("activeTab");
      sessionStorage.removeItem("chatifyShowWelcome");
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Error logging out");
      console.log("Logout error:", error);
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile:", error);
      const message = error?.response?.data?.message || "Unable to update profile right now";
      toast.error(message);
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      withCredentials: true, // this ensures cookies are sent with the connection
    });

    socket.connect();

    set({ socket });

    // listen for online users event
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
