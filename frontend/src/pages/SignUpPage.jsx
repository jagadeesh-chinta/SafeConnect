import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon } from "lucide-react";
import { Link } from "react-router";
import toast from "react-hot-toast";

const signupFields = [
  {
    key: "fullName",
    label: "Full Name",
    type: "text",
    placeholder: "John Doe",
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
    placeholder: "Create a password",
    icon: LockIcon,
  },
];

const validateSignup = ({ fullName, email, password }) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!fullName.trim()) errors.fullName = "Full name is required";

  if (!email.trim()) errors.email = "Email is required";
  else if (!emailRegex.test(email)) errors.email = "Please enter a valid email";

  if (!password) errors.password = "Password is required";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters";

  return errors;
};

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const { signup, isSigningUp } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateSignup(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    signup(formData);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="w-full min-h-screen bg-bg-primary text-text-primary p-4 md:p-8 flex items-center justify-center">
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-[24px] glass-panel shadow-2xl">
        <div className="flex min-h-[680px] flex-col lg:flex-row">
          <aside className="hidden lg:flex lg:w-1/2 p-10 xl:p-14 flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-accent-primary/5"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10 flex h-full w-full flex-col justify-between">
              <div>
                <p className="text-sm tracking-[0.2em] uppercase text-accent-primary">Chatify</p>
                <h1 className="mt-4 text-4xl font-bold leading-tight xl:text-5xl">
                  Real-Time Secure Messaging
                </h1>
                <p className="mt-5 text-lg text-text-secondary max-w-md">
                  Chat, connect, and communicate with end-to-end secure features and modern UI experience.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-xl font-semibold mb-3">Secure Real-Time Chat Application</h2>
                <p className="text-text-secondary leading-relaxed text-sm">
                  Experience secure messaging with advanced features like encrypted chat, friend system, and smart communication tools.
                </p>
                <button type="button" className="mt-6 font-semibold text-accent-primary hover:text-accent-secondary transition-colors">
                  Explore Features &rarr;
                </button>
              </div>
            </div>
          </aside>

          <section className="w-full bg-bg-secondary/50 px-6 py-10 sm:px-10 lg:w-1/2 lg:px-12 lg:py-16 flex items-center justify-center">
            <div className="mx-auto w-full max-w-md glass-card rounded-2xl p-7 sm:p-8 animate-scale-in">
              <div className="mb-8 text-center">
                <div className="mx-auto size-14 bg-accent-primary/10 rounded-full flex items-center justify-center mb-5">
                  <MessageCircleIcon className="size-7 text-accent-primary" />
                </div>
                <h2 className="text-2xl font-bold">Create Your Account</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Start secure conversations in seconds.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {signupFields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-text-secondary mb-2">{field.label}</label>
                      <div className="relative">
                        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-muted" />
                        <input
                          type={field.type}
                          value={formData[field.key]}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className={`w-full glass-input rounded-xl py-3 pl-12 pr-4 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 outline-none transition-all ${errors[field.key] ? "!border-danger focus:!ring-danger/20" : ""}`}
                          placeholder={field.placeholder}
                        />
                      </div>
                      {errors[field.key] && <p className="text-danger text-xs mt-1.5">{errors[field.key]}</p>}
                    </div>
                  );
                })}

                <button className="primary-button w-full rounded-xl py-3.5 mt-6 font-semibold tracking-wide flex items-center justify-center gap-2" type="submit" disabled={isSigningUp}>
                  {isSigningUp ? (
                    <LoaderIcon className="size-5 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-text-secondary">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-accent-primary hover:text-accent-secondary transition-colors ml-1">
                  Sign In
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
export default SignUpPage;
