import nodemailer from "nodemailer";
import { ENV } from "./env.js";

const smtpPort = Number(ENV.SMTP_PORT || 587);
const smtpSecure = String(ENV.SMTP_SECURE || "false").toLowerCase() === "true";

export const mailer = nodemailer.createTransport({
  host: ENV.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
});

export const sender = {
  email: ENV.EMAIL_FROM || ENV.SMTP_USER,
  name: ENV.EMAIL_FROM_NAME || "Chatify",
};

export const assertMailerConfig = () => {
  if (!ENV.SMTP_USER || !ENV.SMTP_PASS) {
    throw new Error("SMTP is not configured. Set SMTP_USER and SMTP_PASS in backend/.env");
  }
};
