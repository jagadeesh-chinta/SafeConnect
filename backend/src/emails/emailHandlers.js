import { mailer, sender, assertMailerConfig } from '../lib/mailer.js';
import {createWelcomeEmailTemplate, createOTPEmailTemplate} from './emailTemplates.js';

export const sendWelcomeEmail = async (email , name, clientURL) => {
    assertMailerConfig();
    try {
        const info = await mailer.sendMail({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: 'Welcome to Chatify!',
            html: createWelcomeEmailTemplate(name, clientURL)
        });
        console.log("Welcome email sent successfully:", info?.messageId || info?.response || "OK");
    } catch (error) {
        console.error("Error sending welcome email:", error);
        const reason = error?.message || "SMTP provider rejected the request";
        throw new Error(`Failed to send welcome email: ${reason}`);
    }
};

export const sendOTPEmail = async (email, otp) => {
    assertMailerConfig();
    try {
        const info = await mailer.sendMail({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: 'Your Chatify OTP',
            text: `Your OTP is ${otp}. It expires in 1 minute.`,
            html: createOTPEmailTemplate(otp)
        });
        console.log("OTP email sent successfully:", info?.messageId || info?.response || "OK");
    } catch (error) {
        console.error("Error sending OTP email:", error);
        const reason = error?.message || "SMTP provider rejected the request";
        throw new Error(`Failed to send OTP email: ${reason}`);
    }
};