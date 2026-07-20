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
    key: "phoneNumber",
    label: "Phone Number",
    type: "tel",
    placeholder: "9876543210",
    icon: PhoneIcon,
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
    description:
      "Chat, connect, and communicate with end-to-end secure features and modern UI experience.",
    subTitle: "Secure Real-Time Chat Application",
    subDescription:
      "Experience secure messaging with advanced features like encrypted chat, friend system, and smart communication tools.",
    extraLineOne: "Instantly connect with your trusted contacts in one tap.",
    extraLineTwo: "Built with privacy-first communication at every step.",
  },
  {
    title: "Build Stronger Connections",
    description:
      "Manage favourites, friend requests, and private conversations with an intuitive and clean workflow.",
    subTitle: "Smart Contact & Friend System",
    subDescription:
      "Keep your social graph organized with fast access to recent chats and live online presence.",
    extraLineOne: "Track unread updates and stay in sync in real time.",
    extraLineTwo: "Quick actions help you focus on meaningful conversations.",
  },
  {
    title: "Modern Experience, Zero Clutter",
    description:
      "Enjoy a responsive chat interface that adapts smoothly across desktop and mobile screens.",
    subTitle: "Optimized For Everyday Use",
    subDescription:
      "From smooth transitions to fast message delivery, Chatify keeps communication effortless.",
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

const validateSignup = ({ fullName, email, password, phoneNumber }) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!fullName.trim()) errors.fullName = "Username is required";
  if (!email.trim()) errors.email = "Email is required";
  else if (!emailRegex.test(email)) errors.email = "Please enter a valid email";
  if (!password) errors.password = "Password is required";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters";
  if (phoneNumber && phoneNumber.trim() && !/^\d{7,15}$/.test(phoneNumber.replace(/\D/g, ""))) {
    errors.phoneNumber = "Please enter a valid phone number";
  }

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
  const [formData, setFormData] = useState({ fullName: "", email: "", countryCode: "+91", phoneNumber: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showFloatingSignup, setShowFloatingSignup] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpExpiryCountdown, setOtpExpiryCountdown] = useState(0);
  const [otpError, setOtpError] = useState("");
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
      const signupSuccess = await signup({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim()
          ? `${formData.countryCode}${formData.phoneNumber.replace(/\D/g, "")}`
          : "",
        password: formData.password,
      });

      if (signupSuccess) {
        setIsSignup(false);
        setErrors({});
        setFormData({ fullName: "", email: "", countryCode: "+91", phoneNumber: "", password: "" });
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
    setFormData({ fullName: "", email: "", countryCode: "+91", phoneNumber: "", password: "" });
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
    setFormData({ fullName: "", email: "", countryCode: "+91", phoneNumber: "", password: "" });
  };

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // OTP expiry countdown timer
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

  // Focus OTP input when screen appears
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
    setFormData({ fullName: "", email: "", countryCode: "+91", phoneNumber: "", password: "" });

    firstSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(() => {
      usernameInputRef.current?.focus();
    }, 450);
  };

  const handleScrollToFirstSection = () => {
    firstSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="auth-screen-wrapper w-full">
      {showFloatingSignup && (
        <button
          type="button"
          onClick={handleFloatingSignupClick}
          className="fixed right-5 top-5 z-50 rounded-xl border border-cyan-300/40 bg-slate-900/70 px-5 py-2.5 text-sm font-semibold tracking-wide text-cyan-200 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-slate-800/80 hover:text-white"
        >
          Sign Up
        </button>
      )}

      {showFloatingSignup && (
        <button
          type="button"
          onClick={handleScrollToFirstSection}
          className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/45 bg-slate-900/75 text-cyan-200 shadow-[0_10px_28px_rgba(6,182,212,0.25)] backdrop-blur-md transition hover:-translate-y-1 hover:bg-slate-800/85 hover:text-white"
          aria-label="Back to top"
        >
          <ChevronUpIcon className="h-6 w-6" />
        </button>
      )}

      {/* Login Section - Full Viewport Height */}
      <div ref={firstSectionRef} className="auth-screen h-screen w-full flex items-center justify-center">
        <div className="auth-shell h-full w-full overflow-hidden">
          <div className="flex h-full w-full flex-col md:flex-row">
          <aside className="auth-info-panel hidden h-full md:flex md:w-3/5">
            <div className="relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col justify-between px-10 py-16 xl:px-16">
              <div>
                <p className="text-sm tracking-[0.2em] uppercase text-cyan-200/80">Chatify</p>
                <h1 className="mt-4 text-4xl font-semibold leading-tight text-white xl:text-5xl">
                  {selectedSlide.title}
                </h1>
                <p className="mt-5 text-base leading-relaxed text-cyan-50/90">
                  {selectedSlide.description}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-medium text-cyan-100">{selectedSlide.subTitle}</h2>
                <p className="mt-3 max-w-md text-sm text-cyan-100/85">
                  {selectedSlide.subDescription}
                </p>
                <p className="mt-2 max-w-md text-sm text-cyan-100/90">{selectedSlide.extraLineOne}</p>
                <p className="mt-1 max-w-md text-sm text-cyan-100/90">{selectedSlide.extraLineTwo}</p>

                <button type="button" className="auth-ghost-btn mt-7">
                  Explore Chat
                </button>

                <div className="mt-8 flex items-center gap-2">
                  {infoSlides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveSlide(index)}
                      className={`auth-dot cursor-pointer ${activeSlide === index ? "auth-dot-active" : ""}`}
                      aria-label={`Show info slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="auth-form-side h-full w-full px-4 py-8 sm:px-8 sm:py-10 md:w-2/5 md:px-10 md:py-12 lg:px-12 lg:py-14">
            <div className="auth-form-card mx-auto w-full max-w-xl rounded-2xl p-7 shadow-2xl sm:p-8">
              
              {/* OTP Screen */}
              {showOtpScreen && (
                <div className="w-full">
                  <div className="auth-form-transition mx-auto w-full max-w-md space-y-6">
                  <div className="mb-8 text-center">
                    <MessageCircleIcon className="mx-auto mb-3 size-10 text-sky-600" />
                    <h2 className="text-3xl font-semibold text-slate-900">Enter OTP</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Enter the 6-digit code sent to <span className="font-medium text-sky-600">{otpEmail}</span>
                    </p>
                    <p className={`mt-2 text-sm font-medium ${otpExpiryCountdown > 0 ? "text-amber-600" : "text-red-600"}`}>
                      {otpExpiryCountdown > 0
                        ? `OTP expires in ${formatCountdown(otpExpiryCountdown)}`
                        : "OTP expired. Please resend OTP."}
                    </p>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="auth-form-transition space-y-5" key="verify-otp">
                    <div>
                      <label className="auth-light-label">One-Time Password</label>
                      <div className="relative">
                        <ShieldIcon className="auth-light-icon" />
                        <input
                          ref={otpInputRef}
                          type="text"
                          inputMode="numeric"
                          value={otp}
                          onChange={handleOtpChange}
                          maxLength="6"
                          placeholder="Enter 6-digit OTP"
                          className={`auth-light-input ${otpError ? "auth-light-input-error" : ""}`}
                        />
                      </div>
                      {otpError && <p className="auth-error-text mt-1">{otpError}</p>}
                    </div>

                    <button className="auth-gradient-btn" type="submit" disabled={isVerifyingOTP || otp.length !== 6}>
                      {isVerifyingOTP ? (
                        <LoaderIcon className="mx-auto size-5 animate-spin" />
                      ) : (
                        "VERIFY OTP"
                      )}
                    </button>
                  </form>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="inline-flex items-center gap-2 text-slate-600 transition hover:text-sky-700"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      Back to Login
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCountdown > 0}
                      className={`font-medium transition ${
                        resendCountdown > 0
                          ? "text-slate-400 cursor-not-allowed"
                          : "text-sky-600 hover:text-sky-700"
                      }`}
                    >
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
                    </button>
                  </div>
                  </div>
                </div>
              )}

              {/* Login/Signup Screen */}
              {!showOtpScreen && (
                <>
                  <div className="mb-8 text-center">
                    <MessageCircleIcon className="mx-auto mb-3 size-10 text-sky-600" />
                    <h2 className="text-3xl font-semibold text-slate-900">
                      {isSignup ? "Create Your Chatify Account" : "Welcome to Chatify"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {isSignup
                        ? "Sign up to start secure conversations."
                        : "Sign in to continue your secure conversations."}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="auth-form-transition space-y-5" key={isSignup ? "signup" : "signin"}>
                    {activeFields.map((field) => {
                      const Icon = field.icon;

                      if (isSignup && field.key === "phoneNumber") {
                        return (
                          <div key={field.key}>
                            <label className="auth-light-label">{field.label}</label>
                            <div className="flex gap-2">
                              <select
                                value={formData.countryCode}
                                onChange={(e) => handleFieldChange("countryCode", e.target.value)}
                                className="w-44 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                              >
                                {countryCodeOptions.map((item) => (
                                  <option key={item.code} value={item.code}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>

                              <div className="relative flex-1">
                                <Icon className="auth-light-icon" />
                                <input
                                  type="tel"
                                  value={formData.phoneNumber}
                                  onChange={(e) => handleFieldChange("phoneNumber", e.target.value.replace(/[^\d]/g, ""))}
                                  className={`auth-light-input ${errors.phoneNumber ? "auth-light-input-error" : ""}`}
                                  placeholder={field.placeholder}
                                />
                              </div>
                            </div>
                            {errors.phoneNumber && <p className="auth-error-text mt-1">{errors.phoneNumber}</p>}
                          </div>
                        );
                      }

                      return (
                        <div key={field.key}>
                          <label className="auth-light-label">{field.label}</label>
                          <div className="relative">
                            <Icon className="auth-light-icon" />
                            <input
                              type={field.type}
                              ref={field.key === "fullName" ? usernameInputRef : null}
                              value={formData[field.key]}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className={`auth-light-input ${errors[field.key] ? "auth-light-input-error" : ""}`}
                              placeholder={field.placeholder}
                            />
                          </div>
                          {errors[field.key] && <p className="auth-error-text mt-1">{errors[field.key]}</p>}
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between text-sm">
                      <label className="inline-flex items-center gap-2 text-slate-600">
                        <input type="checkbox" className="size-4 rounded border-slate-300" />
                        <span>Keep me logged in</span>
                      </label>
                      {!isSignup && (
                        <button
                          type="button"
                          className="cursor-pointer text-sky-600 transition hover:text-emerald-600"
                        >
                          Forgot Password
                        </button>
                      )}
                    </div>

                    <button className="auth-gradient-btn" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <LoaderIcon className="mx-auto size-5 animate-spin" />
                      ) : isSignup ? (
                        "SIGN UP"
                      ) : (
                        "SIGN IN"
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center text-sm text-slate-600">
                    {isSignup ? "Already have an account? " : "Don't have an account? "}
                    <button
                      type="button"
                      onClick={handleSwitchMode}
                      className="signLink ml-1 bg-transparent font-medium"
                    >
                      {isSignup ? "Sign In" : "Sign Up"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
      </div>

      {/* Privacy Section */}
      <PrivacySection />

      {/* Features Slider Section */}
      <FeaturesSlider />

      {/* Security Showcase Section */}
      <SecurityShowcaseSection />

    </div>
  );
}
export default LoginPage;
