import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/useAuthStore";
import {
  MessageCircleIcon,
  MailIcon,
  LoaderIcon,
  LockIcon,
  UserIcon,
  ChevronUpIcon,
  ShieldIcon,
  ArrowLeftIcon,
  PhoneIcon,
  Eye,
  EyeOff
} from "lucide-react";
import toast from "react-hot-toast";
import PrivacySection from "./PrivacySection";
import FeaturesSlider from "./FeaturesSlider";
import SecurityShowcaseSection from "./SecurityShowcaseSection";

const loginFields = [
  {
    key: "email",
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    icon: MailIcon,
  },
  {
    key: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    icon: LockIcon,
  },
];

const signupFields = [
  {
    key: "fullName",
    label: "Username",
    type: "text",
    placeholder: "Enter your username",
    icon: UserIcon,
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    icon: MailIcon,
  },
  {
    key: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    icon: LockIcon,
  },
];

const countryCodeOptions = [
  { code: "+1", label: "United States (+1)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+91", label: "India (+91)" },
  { code: "+92", label: "Pakistan (+92)" },
  { code: "+93", label: "Afghanistan (+93)" },
  { code: "+94", label: "Sri Lanka (+94)" },
  { code: "+95", label: "Myanmar (+95)" },
  { code: "+971", label: "UAE (+971)" },
];

const infoSlides = [
  {
    title: "Real-Time Secure Messaging",
    description: "Chat, connect, and communicate with end-to-end secure features and modern UI experience.",
    subTitle: "Secure Real-Time Chat Application",
    subDescription: "Experience secure messaging with advanced features like encrypted chat, friend system, and smart communication tools.",
    extraLineOne: "Instantly connect with your trusted contacts in one tap.",
    extraLineTwo: "Built with privacy-first communication at every step.",
  },
  {
    title: "Build Stronger Connections",
    description: "Manage favourites, friend requests, and private conversations with an intuitive and clean workflow.",
    subTitle: "Smart Contact & Friend System",
    subDescription: "Keep your social graph organized with fast access to recent chats and live online presence.",
    extraLineOne: "Track unread updates and stay in sync in real time.",
    extraLineTwo: "Quick actions help you focus on meaningful conversations.",
  },
  {
    title: "Modern Experience, Zero Clutter",
    description: "Enjoy a responsive chat interface that adapts smoothly across desktop and mobile screens.",
    subTitle: "Optimized For Everyday Use",
    subDescription: "From smooth transitions to fast message delivery, Chatify keeps communication effortless.",
    extraLineOne: "Designed to reduce noise and improve chat productivity.",
    extraLineTwo: "A consistent UI flow keeps your conversations uninterrupted.",
  },
];

const validateLogin = ({ email, password }) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) errors.email = "Email is required";
  else if (!emailRegex.test(email)) errors.email = "Please enter a valid email";
  if (!password) errors.password = "Password is required";
  return errors;
};

const validateSignup = ({ fullName, email, password }) => {
  const errors = {};
  if (!fullName?.trim()) errors.fullName = "Username is required";
  if (!email?.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Invalid email format";
  if (!password) errors.password = "Password is required";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters";

  return errors;
};

const validateOTP = (otp) => {
  if (!otp.trim()) return "OTP is required";
  if (otp.length !== 6) return "OTP must be 6 digits";
  if (!/^\d+$/.test(otp)) return "OTP must contain only numbers";
  return "";
};

function LoginPage({ initialMode = "signin" }) {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showFloatingSignup, setShowFloatingSignup] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpExpiryCountdown, setOtpExpiryCountdown] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const firstSectionRef = useRef(null);
  const usernameInputRef = useRef(null);
  const otpInputRef = useRef(null);
  
  const { login, signup, verifyOTP, resendOTP, isLoggingIn, isSigningUp, isVerifyingOTP, otpEmail, otpExpiresAt } = useAuthStore();
  const activeFields = isSignup ? signupFields : loginFields;
  const isSubmitting = isSignup ? isSigningUp : isLoggingIn;
  const selectedSlide = infoSlides[activeSlide];
  const showOtpScreen = otpEmail && !isSignup;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = isSignup ? validateSignup(formData) : validateLogin(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    if (isSignup) {
      const signupData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };
      const signupSuccess = await signup(signupData);

      if (signupSuccess) {
        setIsSignup(false);
        setErrors({});
        setFormData({ fullName: "", email: "", password: "" });
        navigate("/login", { replace: true });
      }
      return;
    }

    login({ email: formData.email.trim(), password: formData.password });
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const otpValidationError = validateOTP(otp);
    if (otpValidationError) {
      setOtpError(otpValidationError);
      return;
    }
    verifyOTP(otpEmail, otp);
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    if (otpError) setOtpError("");
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    await resendOTP(otpEmail);
    setResendCountdown(30);
  };

  const handleBackToLogin = () => {
    setOtp("");
    setOtpError("");
    setResendCountdown(0);
    setOtpExpiryCountdown(0);
    useAuthStore.setState({ otpEmail: null, otpExpiresAt: null });
    setFormData({ fullName: "", email: "", password: "" });
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSwitchMode = () => {
    setIsSignup((prev) => !prev);
    setErrors({});
    setFormData({ fullName: "", email: "", password: "" });
  };

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (!showOtpScreen || !otpExpiresAt) {
      setOtpExpiryCountdown(0);
      return;
    }
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((new Date(otpExpiresAt).getTime() - Date.now()) / 1000));
      setOtpExpiryCountdown(remaining);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [showOtpScreen, otpExpiresAt]);

  useEffect(() => {
    if (showOtpScreen && otpInputRef.current) {
      setTimeout(() => otpInputRef.current?.focus(), 300);
    }
  }, [showOtpScreen]);

  useEffect(() => {
    setIsSignup(initialMode === "signup");
    setErrors({});
  }, [initialMode]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % infoSlides.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!firstSectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingSignup(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(firstSectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleFloatingSignupClick = () => {
    navigate("/signup");
    setIsSignup(true);
    setErrors({});
    setFormData({ fullName: "", email: "", password: "" });
    firstSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      usernameInputRef.current?.focus();
    }, 450);
  };

  const handleScrollToFirstSection = () => {
    firstSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full min-h-screen bg-bg-primary text-text-primary overflow-x-hidden">
      {/* Floating Buttons */}
      {showFloatingSignup && (
        <button
          type="button"
          onClick={handleFloatingSignupClick}
          className="fixed right-5 top-5 z-50 glass-card px-5 py-2.5 text-sm font-semibold tracking-wide text-accent-primary transition hover:-translate-y-0.5 rounded-xl"
        >
          Sign Up
        </button>
      )}

      {showFloatingSignup && (
        <button
          type="button"
          onClick={handleScrollToFirstSection}
          className="fixed bottom-6 right-6 z-50 glass-card inline-flex h-12 w-12 items-center justify-center rounded-full text-accent-primary transition hover:-translate-y-1"
          aria-label="Back to top"
        >
          <ChevronUpIcon className="h-6 w-6" />
        </button>
      )}

      {/* Hero Section */}
      <div ref={firstSectionRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 bg-gradient-to-b from-slate-900 to-slate-950 md:bg-[url('/src/assets/security.jpg')] md:bg-cover md:bg-center bg-no-repeat">
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        
        {/* Animated Background Gradients (subtle) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-accent-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-accent-secondary/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
        </div>

        <div className="relative z-10 w-full h-full flex flex-col md:flex-row">
          {/* Left Info Panel */}
          <aside className="hidden h-full md:flex md:w-1/2 lg:w-3/5 p-8 lg:p-16 flex-col justify-between text-white">
            <div className="animate-fade-in drop-shadow-md">
              <div className="flex items-center gap-3 text-white mb-8">
                <div className="size-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <MessageCircleIcon className="size-6" />
                </div>
                <span className="font-bold tracking-widest uppercase text-sm">Chatify</span>
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6">
                {selectedSlide.title}
              </h1>
              <p className="text-lg text-white/80 max-w-xl">
                {selectedSlide.description}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-xl animate-fade-in-up text-white shadow-2xl">
              <h2 className="text-xl font-semibold mb-3">{selectedSlide.subTitle}</h2>
              <p className="text-white/80 mb-6 leading-relaxed">
                {selectedSlide.subDescription}
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-text-muted">
                  <div className="size-1.5 rounded-full bg-accent-primary" />
                  {selectedSlide.extraLineOne}
                </li>
                <li className="flex items-center gap-3 text-sm text-text-muted">
                  <div className="size-1.5 rounded-full bg-accent-primary" />
                  {selectedSlide.extraLineTwo}
                </li>
              </ul>

              <div className="flex items-center gap-3">
                {infoSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${activeSlide === index ? 'w-8 bg-accent-primary' : 'w-2 bg-text-muted/30'}`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* Right Form Panel */}
          <section className="h-full w-full md:w-1/2 lg:w-2/5 p-6 sm:p-8 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-md rounded-2xl p-8 animate-scale-in relative overflow-hidden shadow-2xl text-white">
              
              {/* Form Content */}
              {showOtpScreen ? (
                <div className="w-full">
                  <div className="mb-8 text-center animate-slide-in">
                    <div className="flex flex-col items-center justify-center mb-6">
                      <div className="size-16 bg-white/20 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3">
                        <ShieldIcon className="size-8 text-white" />
                      </div>
                      <span className="md:hidden font-bold tracking-widest uppercase text-xl text-white drop-shadow-md">Chatify</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 drop-shadow-md">Verification Required</h2>
                    <p className="text-white/80 text-sm">
                      Enter the 6-digit code sent to<br/>
                      <span className="font-semibold text-white">{otpEmail}</span>
                    </p>
                    <p className={`mt-3 text-sm font-medium ${otpExpiryCountdown > 0 ? "text-yellow-300" : "text-red-300"}`}>
                      {otpExpiryCountdown > 0 ? `Code expires in ${formatCountdown(otpExpiryCountdown)}` : "Code expired. Please resend."}
                    </p>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-6 animate-fade-in-up">
                    <div>
                      <div className="relative">
                        <ShieldIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-white/60" />
                        <input
                          ref={otpInputRef}
                          type="text"
                          inputMode="numeric"
                          value={otp}
                          onChange={handleOtpChange}
                          maxLength="6"
                          placeholder="000000"
                          className={`w-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-xl py-3.5 pl-12 pr-4 text-center text-2xl tracking-[0.5em] font-medium focus:border-white focus:bg-white/20 outline-none transition-all ${otpError ? "!border-danger focus:!ring-danger/50" : ""}`}
                        />
                      </div>
                      {otpError && <p className="text-red-300 text-sm mt-2 text-center">{otpError}</p>}
                    </div>

                    <button className="bg-white/20 hover:bg-white/30 border border-white/30 text-white shadow-lg backdrop-blur-md w-full rounded-xl py-3.5 font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5" type="submit" disabled={isVerifyingOTP || otp.length !== 6}>
                      {isVerifyingOTP ? <LoaderIcon className="size-5 animate-spin" /> : "Verify Code"}
                    </button>
                  </form>

                  <div className="mt-8 flex items-center justify-between text-sm">
                    <button onClick={handleBackToLogin} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                      <ArrowLeftIcon className="size-4" /> Back
                    </button>
                    <button onClick={handleResendOtp} disabled={resendCountdown > 0} className={`font-medium transition-colors ${resendCountdown > 0 ? "text-white/40 cursor-not-allowed" : "text-white hover:underline underline-offset-2"}`}>
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Code"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <div className="mb-10 text-center animate-slide-in">
                    <div className="flex flex-col items-center justify-center mb-6">
                      <div className="size-16 bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center mb-3">
                        <MessageCircleIcon className="size-8 text-white" />
                      </div>
                      <span className="md:hidden font-bold tracking-widest uppercase text-xl text-white drop-shadow-md">Chatify</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-2 drop-shadow-md">
                      {isSignup ? "Create Account" : "Welcome Back"}
                    </h2>
                    <p className="text-white/80 text-sm">
                      {isSignup ? "Sign up to start secure conversations" : "Sign in to continue your secure conversations"}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up" key={isSignup ? "signup" : "signin"}>
                    {activeFields.map((field) => {
                      const Icon = field.icon;

                      return (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-white/90 mb-2">{field.label}</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Icon className={`h-5 w-5 transition-colors ${errors[field.key] ? 'text-danger' : 'text-white/50 group-focus-within:text-white'}`} />
                            </div>
                            <input
                              type={field.key === "password" ? (showPassword ? "text" : "password") : field.type}
                              ref={field.key === "fullName" ? usernameInputRef : null}
                              value={formData[field.key]}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className={`w-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-xl py-3 pl-12 pr-4 focus:border-white focus:bg-white/20 outline-none transition-all ${errors[field.key] ? "!border-danger focus:!ring-danger/50" : ""}`}
                              placeholder={field.placeholder}
                            />
                            {field.key === "password" && (
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            )}
                          </div>
                          {errors[field.key] && (
                            <p className="text-red-300 text-xs mt-1.5 ml-1 animate-fadeIn flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-red-400 inline-block"></span>
                              {errors[field.key]}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between text-sm mt-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="checkbox" className="peer sr-only" />
                          <div className="size-4 rounded border border-white/30 bg-white/10 peer-checked:bg-white peer-checked:border-white transition-all flex items-center justify-center">
                            <svg className="w-3 h-3 text-accent-primary opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                              <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                        <span className="text-white/80 group-hover:text-white transition-colors">Remember me</span>
                      </label>
                      {!isSignup && (
                        <button type="button" className="text-white/90 hover:text-white font-medium transition-colors underline decoration-white/30 underline-offset-2">
                          Forgot password?
                        </button>
                      )}
                    </div>

                    <button className="bg-white/20 hover:bg-white/30 border border-white/30 text-white shadow-lg backdrop-blur-md w-full rounded-xl py-3.5 font-semibold tracking-wide flex items-center justify-center gap-2 mt-6 transition-all duration-300 hover:-translate-y-0.5" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <LoaderIcon className="size-5 animate-spin" />
                      ) : isSignup ? (
                        "Create Account"
                      ) : (
                        "Sign In"
                      )}
                    </button>
                  </form>

                  <div className="mt-8 text-center text-sm text-white/80">
                    {isSignup ? "Already have an account? " : "Don't have an account? "}
                    <button
                      type="button"
                      onClick={handleSwitchMode}
                      className="text-white font-bold transition-colors ml-1 hover:underline underline-offset-2"
                    >
                      {isSignup ? "Sign in" : "Sign up"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <PrivacySection />
      <FeaturesSlider />
      <SecurityShowcaseSection />
    </div>
  );
}

export default LoginPage;
