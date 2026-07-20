import { Routes , Route, Navigate, useLocation} from "react-router";
import { lazy, Suspense } from "react";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import WelcomeScreen from "./pages/WelcomeScreen";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";
import {Toaster} from "react-hot-toast";

const RestoreChat = lazy(() => import("./pages/RestoreChat"));
const ChatKeyPage = lazy(() => import("./pages/ChatKeyPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CropProfileImage = lazy(() => import("./pages/CropProfileImage"));
const ViewProfileImage = lazy(() => import("./pages/ViewProfileImage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const RequestsPage = lazy(() => import("./components/RequestsPage"));

function App()
{
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
  },[checkAuth]);

  useEffect(() => {
    const titleByPath = {
      "/chat": "Chatify | Chat",
      "/welcome": "Chatify | Welcome",
      "/restore-chat": "Chatify | Restore Chat",
      "/chatkey": "Chatify | ChatKey",
      "/requests": "Chatify | Friend Requests",
      "/notifications": "Chatify | Notifications",
      "/profile": "Chatify | Profile",
      "/profile/crop": "Chatify | Crop Profile",
      "/profile/view-image": "Chatify | Profile Image",
      "/login": "Chatify | Login",
      "/signup": "Chatify | Sign Up",
    };

    document.title = titleByPath[location.pathname] || "Chatify";
  }, [location.pathname]);

  if(isCheckingAuth) return <PageLoader />;

  return(
  <div className = {`h-screen w-screen bg-slate-900 relative ${isScrollableRoute ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden"}`}>
    {/* DECORATORS - GRID BG & GLOW SHAPES */}
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
    <div className="pointer-events-none absolute top-0 -left-4 size-96 bg-pink-500 opacity-20 blur-[100px]" />
    <div className="pointer-events-none absolute bottom-0 -right-4 size-96 bg-cyan-500 opacity-20 blur-[100px]" />
  
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

      <Toaster />
    </div>
  </div>
  );
}
export default App;