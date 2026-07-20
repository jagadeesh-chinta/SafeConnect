import express from "express";
import path from "path";
import cors from "cors";
import {ENV} from "./lib/env.js";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import friendRoutes from "./routes/friend.route.js";
import notificationRoutes from "./routes/notification.route.js";
import chatkeyRoutes from "./routes/chatkey.route.js";
import chatRoutes from "./routes/chat.route.js";
import userRoutes from "./routes/user.route.js";
import {connectDB} from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import { startMessageScheduler } from "./services/scheduler.service.js";


const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

app.use(express.json({limit: "5mb"})); //req.body
app.use(cors({
  origin: ENV.CLIENT_URL,
  credentials: true
}));
app.use(cookieParser()); //req.cookies
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chatkey", chatkeyRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);
// compatibility: expose friend endpoints at top-level /api/* paths as well
app.use("/api", friendRoutes);

// Test SMTP connection
app.get("/api/test-smtp", async (req, res) => {
  try {
    const { mailer } = await import("./lib/mailer.js");
    const verified = await mailer.verify();
    if(verified) {
      res.status(200).json({success: true, message: "Gmail SMTP connection verified!"});
    } else {
      res.status(500).json({success: false, message: "Gmail SMTP verification failed"});
    }
  } catch (error) {
    res.status(500).json({success: false, message: error?.message || "SMTP connection error"});
  }
});

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend","dist","index.html"));
  });
}

server.listen(PORT, () =>{
  console.log("server running on port: " + PORT)
  connectDB();
  // Start the scheduled message processor
  startMessageScheduler();
}
);
