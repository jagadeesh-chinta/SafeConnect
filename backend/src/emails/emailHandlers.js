import { sendMailWithGmailAPI, sender, assertMailerConfig } from '../lib/mailer.js';
import { createWelcomeEmailTemplate, createOTPEmailTemplate } from './emailTemplates.js';

export const sendWelcomeEmail = async (email, name, clientURL) => {
    assertMailerConfig();
    try {
        const result = await sendMailWithGmailAPI({
            to: email,
            subject: 'Welcome to Chatify!',
            html: createWelcomeEmailTemplate(name, clientURL),
        });
        console.log("Welcome email sent successfully via Gmail API:", result?.id || "OK");
    } catch (error) {
        console.error("Error sending welcome email:", error);
        const reason = error?.message || "Gmail API rejected the request";
        throw new Error(`Failed to send welcome email: ${reason}`);
    }
};

export const sendOTPEmail = async (email, otp) => {
    assertMailerConfig();
    try {
        const result = await sendMailWithGmailAPI({
            to: email,
            subject: 'Your Chatify OTP',
            text: `Your OTP is ${otp}. It expires in 1 minute.`,
            html: createOTPEmailTemplate(otp),
        });
        console.log("OTP email sent successfully via Gmail API:", result?.id || "OK");
    } catch (error) {
        console.error("Error sending OTP email:", error);
        const reason = error?.message || "Gmail API rejected the request";
        throw new Error(`Failed to send OTP email: ${reason}`);
    }
};