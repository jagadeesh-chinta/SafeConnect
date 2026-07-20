import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      default: null,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 60 * 1000), // 1 minute from now
    },
  },
  { timestamps: true }
);

otpSchema.pre("validate", function (next) {
  if (!this.email && !this.phoneNumber) {
    return next(new Error("OTP must be associated with email or phoneNumber"));
  }
  return next();
});

// Auto delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, otp: 1 });
otpSchema.index({ phoneNumber: 1, otp: 1 });

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
