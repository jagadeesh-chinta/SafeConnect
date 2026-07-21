import { google } from "googleapis";
import { ENV } from "./env.js";

// Build the OAuth2 client using credentials from .env
const OAuth2 = google.auth.OAuth2;

const createOAuth2Client = () => {
    const client = new OAuth2(
        ENV.GOOGLE_CLIENT_ID,
        ENV.GOOGLE_CLIENT_SECRET
    );
    client.setCredentials({
        refresh_token: ENV.GOOGLE_REFRESH_TOKEN,
    });
    return client;
};

/**
 * Send an email using the Gmail API (OAuth2 — no SMTP).
 * Returns the Gmail API response data.
 */
export const sendMailWithGmailAPI = async ({ to, subject, html, text }) => {
    const auth = createOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth });

    const fromName = ENV.EMAIL_FROM_NAME || "Chatify";
    const fromEmail = ENV.EMAIL_USER;

    // Build the raw RFC 2822 message
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
    const messageParts = [
        `From: ${fromName} <${fromEmail}>`,
        `To: ${to}`,
        `Content-Type: text/html; charset=utf-8`,
        `MIME-Version: 1.0`,
        `Subject: ${utf8Subject}`,
        ``,
        html || text || "",
    ];
    const message = messageParts.join("\n");

    // Gmail API requires base64url encoding
    const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    const res = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw: encodedMessage,
        },
    });

    return res.data;
};

// Sender metadata (used in emailHandlers)
export const sender = {
    email: ENV.EMAIL_USER,
    name: ENV.EMAIL_FROM_NAME || "Chatify",
};

export const assertMailerConfig = () => {
    if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET || !ENV.GOOGLE_REFRESH_TOKEN || !ENV.EMAIL_USER) {
        throw new Error(
            "Gmail API is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and EMAIL_USER in backend/.env"
        );
    }
};
