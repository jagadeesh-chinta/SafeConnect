/**
 * authorize.js — Run this ONCE to generate a Gmail API refresh token.
 *
 * Usage:
 *   node authorize.js
 *
 * A browser window will open. Log in to your Gmail account (chintuchinta25@gmail.com)
 * and click Allow. The refresh_token will be printed to the console.
 * Copy it and paste it as GOOGLE_REFRESH_TOKEN in backend/.env
 */

import fs from "fs";
import { google } from "googleapis";
import http from "http";
import { URL } from "url";

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

async function authorize() {
    const credentials = JSON.parse(fs.readFileSync("./credentials.json", "utf8"));
    const { client_id, client_secret, redirect_uris } = credentials.web;

    // Use a loopback redirect for installed/CLI flows
    const redirectUri = "http://localhost:4200/oauth2callback";

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",          // Force refresh_token to always be returned
        scope: SCOPES,
    });

    console.log("\n✅ Open this URL in your browser:\n");
    console.log(authUrl);
    console.log("\nWaiting for the OAuth2 callback on http://localhost:4200/oauth2callback ...\n");

    // Start a local server to capture the authorization code
    const code = await new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const reqUrl = new URL(req.url, "http://localhost:4200");
            const code = reqUrl.searchParams.get("code");
            if (code) {
                res.end("✅ Authorization successful! You can close this tab and return to the terminal.");
                server.close();
                resolve(code);
            } else {
                res.end("❌ Authorization failed. No code received.");
                server.close();
                reject(new Error("No authorization code received"));
            }
        });
        server.listen(4200, () => {
            console.log("🔊 Listening for OAuth callback on port 4200...");
        });
    });

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    console.log("\n✅ Successfully obtained tokens!\n");
    console.log("Copy the refresh_token below and paste it as GOOGLE_REFRESH_TOKEN in backend/.env:\n");
    console.log(JSON.stringify(tokens, null, 2));
    console.log("\n🔑 GOOGLE_REFRESH_TOKEN =", tokens.refresh_token);
}

authorize().catch(console.error);
