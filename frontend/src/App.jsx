import { Routes , Route, Navigate, useLocation} from "react-router";
import { lazy, Suspense, useEffect } from "react";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import WelcomeScreen from "./pages/WelcomeScreen";
import { useAuthStore } from "./store/useAuthStore";
import PageLoader from "./components/PageLoader";
import {Toaster} from "react-hot-toast";
import PhoneUpdateModal from "./components/PhoneUpdateModal";

const RestoreChat = lazy(() => import("./pages/RestoreChat"));
const ChatKeyPage = lazy(() => import("./pages/ChatKeyPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CropProfileImage = lazy(() => import("./pages/CropProfileImage"));
const ViewProfileImage = lazy(() => import("./pages/ViewProfileImage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const RequestsPage = lazy(() => import("./components/RequestsPage"));

function App() {
  const {checkAuth, isCheckingAuth, authUser} = useAuthStore();
  const location = useLocation();
  const shouldShowWelcome =
    !!authUser && sessionStorage.getItem("chatifyShowWelcome") === "1";

  const isScrollableRoute =
    location.pathname.startsWith("/profile") ||
    location.pathname === "/chatkey" ||
    location.pathname === "/requests" ||
    location.pathname === "/restore-chat" ||
    location.pathname === "/notifications" ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const metadataByPath = {
      "/chat": { title: "Chatify | Chat", description: "Start chatting with your friends securely in real-time." },
      "/welcome": { title: "Chatify | Welcome", description: "Welcome to Chatify, the next generation secure messaging platform." },
      "/restore-chat": { title: "Chatify | Restore Chat", description: "Restore your Chatify conversations securely using your chat keys." },
      "/chatkey": { title: "Chatify | ChatKey", description: "Manage your BB84 quantum-generated encryption keys for maximum security." },
      "/requests": { title: "Chatify | Friend Requests", description: "View and manage your incoming and outgoing friend requests on Chatify." },
      "/notifications": { title: "Chatify | Notifications", description: "Stay up to date with your latest messages and alerts on Chatify." },
      "/profile": { title: "Chatify | Profile", description: "Manage your Chatify user profile, security settings, and avatar." },
      "/profile/crop": { title: "Chatify | Crop Profile", description: "Crop and adjust your Chatify profile picture for the perfect look." },
      "/profile/view-image": { title: "Chatify | Profile Image", description: "View and download your high-resolution Chatify profile image." },
      "/login": { title: "Chatify | Login", description: "Login to Chatify to start messaging securely with your network." },
      "/signup": { title: "Chatify | Sign Up", description: "Create a new Chatify account and experience premium, secure messaging." },
    };

    const currentMeta = metadataByPath[location.pathname] || { title: "Chatify", description: "Chatify is a secure, modern messaging app with real-time chat, ChatKey encryption utilities, notifications, and optimized performance." };
    
    document.title = currentMeta.title;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", currentMeta.description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.name = "description";
      metaDescription.content = currentMeta.description;
      document.head.appendChild(metaDescription);
    }
  }, [location.pathname]);

  useEffect(() => {
    const theme = localStorage.getItem("chatTheme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className={`h-screen w-screen relative ${isScrollableRoute ? "overflow-y-auto overflow-x-hidden custom-scrollbar" : "overflow-hidden"}`}>
      {/* DECORATORS - NEW PREMIUM GLOWS */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-primary/20 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-secondary/20 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>
    
      <div className="relative z-10 h-full w-full">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={authUser ? (shouldShowWelcome ? <Navigate to="/welcome" replace /> : <Navigate to="/chat" replace />) : <Navigate to={"/login"}/>} 
            />
            <Route path="/chat" element={authUser ? <ChatPage /> : <Navigate to={"/login"}/>} />
            <Route path="/welcome" element={authUser ? <WelcomeScreen /> : <Navigate to={"/login"}/>} />
            <Route path="/restore-chat" element={authUser ? <RestoreChat /> : <Navigate to={"/login"}/>} />
            <Route path="/chatkey" element={authUser ? <ChatKeyPage /> : <Navigate to={"/login"}/>} />
            <Route path="/requests" element={authUser ? <RequestsPage /> : <Navigate to={"/login"}/>} />
            <Route path="/notifications" element={authUser ? <NotificationsPage /> : <Navigate to={"/login"}/>} />
            <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to={"/login"}/>} />
            <Route path="/profile/crop" element={authUser ? <CropProfileImage /> : <Navigate to={"/login"}/>} />
            <Route path="/profile/view-image" element={authUser ? <ViewProfileImage /> : <Navigate to={"/login"}/>} />
            <Route path="/login" element={!authUser ? <LoginPage initialMode="signin" /> : <Navigate to={shouldShowWelcome ? "/welcome" : "/chat"} replace />} />
            <Route path="/signup" element={!authUser ? <LoginPage initialMode="signup" /> : <Navigate to={"/"} />} />
          </Routes>
        </Suspense>

        <PhoneUpdateModal />
        <Toaster 
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(12px)',
            }
          }} 
        />
      </div>
    </div>
  );
}

export default App;