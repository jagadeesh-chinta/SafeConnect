import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import FriendRequestBlock from "./FriendRequestBlock";
import MessageContextMenu from "./MessageContextMenu";
import RemoveFriendConfirmation from "./RemoveFriendConfirmation";
import ViewUserProfile from "./ViewUserProfile";
import ScreenshotOverlay from "./ScreenshotOverlay";
import { RotateCcw, Volume2, Clock, Download, CheckCircle2, FileVideo2, FileAudio2, FileText, ExternalLink, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { detectLanguage, getVoiceForLanguage } from "../lib/languageDetection";
import { axiosInstance } from "../lib/axios";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const EDIT_DELETE_WINDOW_MS = 2 * 60 * 60 * 1000;
GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
const DOCUMENT_EXTENSIONS_REGEX = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|csv|rtf|odt|ods|odp)(\?|$)/i;
const DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".csv", ".rtf", ".odt", ".ods", ".odp"];
const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
]);
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_AUDIO_DOCUMENT_SIZE_BYTES = 100 * 1024 * 1024;

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remaining = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
};

const sanitizeFileName = (name = "") => {
  if (!name || typeof name !== "string") return "";
  return name.split(/[\\/]/).pop()?.trim() || "";
};

const hasAllowedDocumentExtension = (fileName = "") => {
  const lowered = fileName.toLowerCase();
  return DOCUMENT_EXTENSIONS.some((ext) => lowered.endsWith(ext));
};

const getDroppedMediaType = (file) => {
  const isMp4 = file.type === "video/mp4";
  const isMp3 = file.type === "audio/mpeg" || file.type === "audio/mp3";
  const isPdf = file.type === "application/pdf";
  const isDocument = isPdf || DOCUMENT_MIME_TYPES.has(file.type) || hasAllowedDocumentExtension(file.name || "");

  if (isMp4) return "video";
  if (isMp3) return "audio";
  if (isPdf) return "pdf";
  if (isDocument) return "document";
  return null;
};

const getDropValidationError = (file) => {
  const mediaType = getDroppedMediaType(file);
  if (!mediaType) return "Only MP4, MP3, and document files are allowed";

  if (mediaType === "video" && file.size > MAX_VIDEO_SIZE_BYTES) {
    return "Video size must be less than 50MB";
  }

  if ((mediaType === "audio" || mediaType === "pdf" || mediaType === "document") && file.size > MAX_AUDIO_DOCUMENT_SIZE_BYTES) {
    return "Audio/Document size must be less than 100MB";
  }

  return null;
};

const getExtensionLabel = (fileName = "", fileUrl = "") => {
  const source = sanitizeFileName(fileName) || sanitizeFileName(fileUrl);
  const extension = source.includes(".") ? source.split(".").pop() : "DOC";
  return (extension || "DOC").toUpperCase().slice(0, 5);
};

function ChatContainer() {
  const navigate = useNavigate();
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    friendStatus,
    fetchFriendStatus,
    deleteForMe,
    deleteForEveryone,
    setEditingMessage,
    isChatDeleted,
    removeFriend,
    sendMessage,
    isUploadingMedia,
  } = useChatStore();
  const { authUser } = useAuthStore();

  const messageEndRef = useRef(null);
  const chatContentRef = useRef(null);
  const screenshotTimeoutRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const screenshotAttemptNotifyRef = useRef(0);
  const dragCounterRef = useRef(0);

  const [contextMenu, setContextMenu] = useState(null); // { x, y, message }
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [showScreenshotOverlay, setShowScreenshotOverlay] = useState(false);
  const [downloadedMediaMap, setDownloadedMediaMap] = useState({});
  const [downloadingMediaMap, setDownloadingMediaMap] = useState({});
  const [mediaThumbnails, setMediaThumbnails] = useState({});
  const [thumbnailLoadingMap, setThumbnailLoadingMap] = useState({});
  const [mediaDurationMap, setMediaDurationMap] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const hasFiles = Array.from(e.dataTransfer?.types || []).includes("Files");
    if (!hasFiles) return;

    dragCounterRef.current += 1;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    if (!droppedFiles.length) return;

    for (const file of droppedFiles) {
      const validationError = getDropValidationError(file);
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        continue;
      }

      const mediaType = getDroppedMediaType(file);
      if (!mediaType) continue;

      await sendMessage({
        text: "",
        mediaFile: file,
        type: mediaType,
        fileName: file.name,
        fileSize: file.size,
        scheduledAt: null,
      });
    }
  }, [sendMessage]);

  const getMediaFileName = useCallback((fileName, type) => {
    const cleanName = sanitizeFileName(fileName);
    if (cleanName) return cleanName;
    if (type === "video") return "video.mp4";
    if (type === "pdf") return "document.pdf";
    if (type === "document") return "document.file";
    return "audio.mp3";
  }, []);

  const downloadMedia = useCallback(async (messageId, fileUrl, mediaType, fileName) => {
    if (!fileUrl) {
      toast.error("File URL not available");
      return;
    }

    const downloadFileName = getMediaFileName(fileName, mediaType);
    setDownloadingMediaMap((prev) => ({ ...prev, [messageId]: true }));

    try {
      // Fetching as blob prevents browsers from opening audio/video URLs directly.
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error("Unable to download file");
      }

      const fileBlob = await response.blob();
      const blobUrl = URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setDownloadedMediaMap((prev) => ({ ...prev, [messageId]: true }));
    } catch (error) {
      toast.error("Failed to download file");
    } finally {
      setDownloadingMediaMap((prev) => ({ ...prev, [messageId]: false }));
    }
  }, [getMediaFileName]);

  const createPdfThumbnail = useCallback(async (fileUrl) => {
    const loadingTask = getDocument(fileUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const initialViewport = page.getViewport({ scale: 1 });
    const targetWidth = 260;
    const scale = targetWidth / initialViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context unavailable");

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;

    const thumbnail = canvas.toDataURL("image/jpeg", 0.82);
    pdf.destroy();
    return thumbnail;
  }, []);

  const createVideoThumbnail = useCallback((fileUrl) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = fileUrl;
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        video.onloadeddata = null;
        video.onseeked = null;
        video.onerror = null;
      };

      video.onerror = () => {
        cleanup();
        reject(new Error("Could not load video"));
      };

      video.onloadeddata = () => {
        const targetTime = Number.isFinite(video.duration) && video.duration > 1 ? 1 : 0;
        video.currentTime = targetTime;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          const width = Math.min(320, video.videoWidth || 320);
          const height = video.videoWidth
            ? Math.round((width / video.videoWidth) * video.videoHeight)
            : 180;
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas context unavailable");

          context.drawImage(video, 0, 0, width, height);
          const thumbnail = canvas.toDataURL("image/jpeg", 0.82);
          cleanup();
          resolve(thumbnail);
        } catch (error) {
          cleanup();
          reject(error);
        }
      };
    });
  }, []);

  const createDocumentThumbnail = useCallback((fileName, fileUrl) => {
    const extension = getExtensionLabel(fileName, fileUrl);
    const displayName = sanitizeFileName(fileName) || "Document";
    const shortName = displayName.length > 24 ? `${displayName.slice(0, 21)}...` : displayName;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="520" height="300" viewBox="0 0 520 300">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
          <linearGradient id="chip" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#06b6d4" />
            <stop offset="100%" stop-color="#22d3ee" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="520" height="300" rx="22" fill="url(#bg)" />
        <rect x="26" y="26" width="468" height="248" rx="18" fill="#0b1220" stroke="#334155" />
        <rect x="52" y="56" width="110" height="52" rx="12" fill="url(#chip)" />
        <text x="107" y="89" text-anchor="middle" fill="#082f49" font-family="Segoe UI, Arial" font-size="24" font-weight="700">${extension}</text>
        <text x="52" y="154" fill="#e2e8f0" font-family="Segoe UI, Arial" font-size="28" font-weight="600">${shortName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>
        <text x="52" y="196" fill="#94a3b8" font-family="Segoe UI, Arial" font-size="20">Document preview</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, []);

  const openPdfInNewTab = useCallback((fileUrl) => {
    if (!fileUrl) {
      toast.error("File URL not available");
      return;
    }

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }, []);

  const saveMediaAs = useCallback(async (fileUrl, mediaType, fileName) => {
    if (!fileUrl) {
      toast.error("File URL not available");
      return;
    }

    const saveName = getMediaFileName(fileName, mediaType);

    try {
      if ((mediaType === "pdf" || mediaType === "audio" || mediaType === "video" || mediaType === "document") && window.showSaveFilePicker) {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error("Unable to fetch file");
        }

        const fileBlob = await response.blob();
        const pickerType = mediaType === "pdf"
          ? {
              description: "PDF Document",
              accept: { "application/pdf": [".pdf"] },
            }
          : mediaType === "audio"
            ? {
                description: "MP3 Audio",
                accept: { "audio/mpeg": [".mp3"] },
              }
            : mediaType === "video"
              ? {
                description: "MP4 Video",
                accept: { "video/mp4": [".mp4"] },
              }
              : {
                  description: "Document",
                  accept: {
                    "application/pdf": [".pdf"],
                    "application/msword": [".doc"],
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
                    "application/vnd.ms-powerpoint": [".ppt"],
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
                    "application/vnd.ms-excel": [".xls"],
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
                    "text/plain": [".txt"],
                    "text/csv": [".csv"],
                    "application/rtf": [".rtf"],
                    "application/vnd.oasis.opendocument.text": [".odt"],
                    "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
                    "application/vnd.oasis.opendocument.presentation": [".odp"],
                  },
                };

        const fileHandle = await window.showSaveFilePicker({
          suggestedName: saveName,
          types: [pickerType],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(fileBlob);
        await writable.close();
        return;
      }

      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = saveName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      if (error?.name === "AbortError") return;
      toast.error("Failed to save file");
    }
  }, [getMediaFileName]);

  useEffect(() => {
    const candidateMessages = messages.filter((msg) => {
      const isVideo = msg.type === "video" || /\.mp4(\?|$)/i.test(msg.fileUrl || "");
      const isPdf = msg.type === "pdf" || /\.pdf(\?|$)/i.test(msg.fileUrl || "");
      const isDocument = msg.type === "document" || (DOCUMENT_EXTENSIONS_REGEX.test(msg.fileUrl || "") && !isPdf);
      return (isVideo || isPdf || isDocument) && msg.fileUrl && !mediaThumbnails[msg._id] && !thumbnailLoadingMap[msg._id];
    });

    if (!candidateMessages.length) return;

    let isActive = true;

    const buildThumbnail = async (msg) => {
      try {
        setThumbnailLoadingMap((prev) => ({ ...prev, [msg._id]: true }));

        const isVideo = msg.type === "video" || /\.mp4(\?|$)/i.test(msg.fileUrl || "");
        const isPdf = msg.type === "pdf" || /\.pdf(\?|$)/i.test(msg.fileUrl || "");
        const thumbnail = isVideo
          ? await createVideoThumbnail(msg.fileUrl)
          : isPdf
            ? await createPdfThumbnail(msg.fileUrl)
            : createDocumentThumbnail(msg.fileName, msg.fileUrl);

        if (!isActive) return;
        setMediaThumbnails((prev) => ({ ...prev, [msg._id]: thumbnail }));
      } catch {
        // Keep graceful fallback UI when thumbnail generation fails.
      } finally {
        if (isActive) {
          setThumbnailLoadingMap((prev) => ({ ...prev, [msg._id]: false }));
        }
      }
    };

    candidateMessages.forEach((msg) => {
      buildThumbnail(msg);
    });

    return () => {
      isActive = false;
    };
  }, [messages, mediaThumbnails, thumbnailLoadingMap, createPdfThumbnail, createVideoThumbnail, createDocumentThumbnail]);

  useEffect(() => {
    const candidates = messages.filter((msg) => {
      const isVideo = msg.type === "video" || /\.mp4(\?|$)/i.test(msg.fileUrl || "");
      const isAudio = msg.type === "audio" || /\.mp3(\?|$)/i.test(msg.fileUrl || "");
      const hasDuration = Number.isFinite(Number(msg.duration)) && Number(msg.duration) > 0;
      return (isVideo || isAudio) && msg.fileUrl && !hasDuration && !mediaDurationMap[msg._id];
    });

    if (!candidates.length) return;

    let isActive = true;

    const loadDuration = (msg) =>
      new Promise((resolve) => {
        const isVideo = msg.type === "video" || /\.mp4(\?|$)/i.test(msg.fileUrl || "");
        const element = document.createElement(isVideo ? "video" : "audio");
        element.preload = "metadata";
        element.src = msg.fileUrl;

        const cleanup = () => {
          element.onloadedmetadata = null;
          element.onerror = null;
          element.src = "";
        };

        element.onloadedmetadata = () => {
          const duration = Number.isFinite(element.duration) ? element.duration : null;
          cleanup();
          resolve(duration);
        };

        element.onerror = () => {
          cleanup();
          resolve(null);
        };
      });

    candidates.forEach(async (msg) => {
      const duration = await loadDuration(msg);
      if (!isActive || !Number.isFinite(duration) || duration <= 0) return;
      setMediaDurationMap((prev) => ({ ...prev, [msg._id]: duration }));
    });

    return () => {
      isActive = false;
    };
  }, [messages, mediaDurationMap]);

  // Text-to-Speech function with auto language detection
  const speakMessage = useCallback((messageId, text) => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-Speech not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    if (!text || text.trim() === "") {
      toast.error("No text to speak.");
      return;
    }

    const detectedLang = detectLanguage(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = detectedLang;

    const voice = getVoiceForLanguage(detectedLang);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
      toast.error("Failed to speak message.");
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    fetchFriendStatus && fetchFriendStatus(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages, fetchFriendStatus]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Privacy Protection: Screenshot Detection and Copy Prevention
  useEffect(() => {
    const notifyScreenshot = async (type) => {
      if (!selectedUser?._id) return;

      const now = Date.now();
      if (type === "screenshot_attempt" && now - screenshotAttemptNotifyRef.current < 5000) return;

      if (type === "screenshot_attempt") screenshotAttemptNotifyRef.current = now;

      try {
        await axiosInstance.post("/notifications", {
          receiverId: selectedUser._id,
          type,
        });
      } catch (error) {
        console.log("screenshot notification error:", error?.response?.data?.message || error.message);
      }
    };

    const triggerScreenshotProtection = () => {
      setIsBlurred(true);
      setShowScreenshotOverlay(true);

      // Clear existing timeouts
      if (screenshotTimeoutRef.current) clearTimeout(screenshotTimeoutRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);

      // Auto-reset after 4 seconds
      screenshotTimeoutRef.current = setTimeout(() => {
        setShowScreenshotOverlay(false);
      }, 4000);

      blurTimeoutRef.current = setTimeout(() => {
        setIsBlurred(false);
      }, 4000);

      notifyScreenshot("screenshot_attempt");
    };

    const handleScreenshotDetection = (e) => {
      // Windows/Linux: PrintScreen, Ctrl+PrintScreen, Shift+PrintScreen
      const isPrintScreenKey = e.key === "PrintScreen";
      const isWindowsShiftPrint = e.shiftKey && e.key === "PrintScreen";
      const isWindowsCtrlPrint = e.ctrlKey && e.key === "PrintScreen";
      
      // macOS: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5, Cmd+Shift+S
      const isMacScreenshot =
        (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5")) ||
        (e.metaKey && e.shiftKey && (e.key === "s" || e.key === "S"));

      if (isPrintScreenKey || isWindowsShiftPrint || isWindowsCtrlPrint || isMacScreenshot) {
        e.preventDefault();
        triggerScreenshotProtection();
      }
    };

    const handleScreenshotKeyup = (e) => {
      // Also handle keyup for PrintScreen as a fallback
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerScreenshotProtection();
      }
    };

    const handleRightClickPrevention = (e) => {
      if (chatContentRef.current && chatContentRef.current.contains(e.target)) {
        e.preventDefault();
      }
    };

    const handleCopyPrevention = (e) => {
      if (chatContentRef.current && chatContentRef.current.contains(e.target)) {
        // Ctrl+C on Windows/Linux
        if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
          e.preventDefault();
        }
        // Cmd+C on Mac
        if (e.metaKey && (e.key === "c" || e.key === "C")) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleScreenshotDetection);
    document.addEventListener("keyup", handleScreenshotKeyup);
    document.addEventListener("contextmenu", handleRightClickPrevention);
    document.addEventListener("keydown", handleCopyPrevention);

    return () => {
      document.removeEventListener("keydown", handleScreenshotDetection);
      document.removeEventListener("keyup", handleScreenshotKeyup);
      document.removeEventListener("contextmenu", handleRightClickPrevention);
      document.removeEventListener("keydown", handleCopyPrevention);
      if (screenshotTimeoutRef.current) clearTimeout(screenshotTimeoutRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, [selectedUser]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleRemoveFriendConfirm = async () => {
    const success = await removeFriend(selectedUser._id);
    if (success) {
      setShowRemoveConfirm(false);
    }
  };

  const handleViewProfile = () => {
    setViewingProfile(true);
  };

  const handleBackFromProfile = () => {
    setViewingProfile(false);
  };

  if (viewingProfile) {
    return <ViewUserProfile userId={selectedUser._id} onBack={handleBackFromProfile} />;
  }

  return (
    <div
      className="relative flex flex-col h-full"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ChatHeader onViewProfile={handleViewProfile} onRemoveFriend={() => setShowRemoveConfirm(true)} />

      {showScreenshotOverlay && <ScreenshotOverlay isVisible={showScreenshotOverlay} />}
      <div
        className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-200 ${isDragOver ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!isDragOver}
      >
        <div className="w-full h-full bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center">
          <div className="px-8 py-6 rounded-3xl border border-accent-primary/30 bg-bg-elevated text-center shadow-2xl animate-scale-in">
            <p className="text-accent-primary text-xl font-bold">Drop files to upload</p>
            {isUploadingMedia && <p className="text-text-secondary text-sm mt-2 flex items-center justify-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />Uploading...</p>}
          </div>
        </div>
      </div>

      <div
        ref={chatContentRef}
        className={`relative flex-1 px-3 md:px-4 overflow-y-auto custom-scrollbar py-4 md:py-6 chat-no-select ${
          isBlurred ? "chat-blur" : ""
        }`}
      >
        {(() => {
          const ownSentMessages = messages.filter(
            (m) => m.senderId === authUser._id && m.status !== "scheduled"
          );
          const lastOwnSentMessageId = ownSentMessages.length
            ? ownSentMessages[ownSentMessages.length - 1]._id
            : null;

          return messages.length > 0 && !isMessagesLoading ? (
            <div className="w-full space-y-4 md:space-y-6">
                {messages.map((msg) => {
                  const isOwn = msg.senderId === authUser._id;
                  const isScheduled = msg.status === "scheduled" && msg.isScheduled;
                  const isLastOwnMessage = msg._id === lastOwnSentMessageId;
                  const tickStatus = msg.isRead ? "seen" : msg.isDelivered ? "delivered" : "sent";
                  const isVideo =
                    msg.type === "video" ||
                    (!!msg.fileUrl && /\.mp4(\?|$)/i.test(msg.fileUrl));
                  const isAudio =
                    msg.type === "audio" ||
                    (!!msg.fileUrl && /\.mp3(\?|$)/i.test(msg.fileUrl));
                  const isPdf =
                    msg.type === "pdf" ||
                    (!!msg.fileUrl && /\.pdf(\?|$)/i.test(msg.fileUrl));
                  const isDocument =
                    msg.type === "document" ||
                    (!!msg.fileUrl && DOCUMENT_EXTENSIONS_REGEX.test(msg.fileUrl) && !/\.pdf(\?|$)/i.test(msg.fileUrl));
                  const isMedia = isVideo || isAudio || isPdf || isDocument;
                  const isDownloaded = !!downloadedMediaMap[msg._id];
                  const isDownloading = !!downloadingMediaMap[msg._id];
                  const mediaType = isVideo ? "video" : isAudio ? "audio" : isPdf ? "pdf" : "document";
                  const mediaFileName = getMediaFileName(msg.fileName, mediaType);
                  const mediaSizeText = formatFileSize(Number(msg.fileSize));
                  const durationValue = Number.isFinite(Number(msg.duration)) && Number(msg.duration) > 0
                    ? Number(msg.duration)
                    : mediaDurationMap[msg._id] || null;
                  const durationText = (mediaType === "video" || mediaType === "audio") && durationValue
                    ? formatDuration(durationValue)
                    : "";
                  const thumbnailSrc = mediaThumbnails[msg._id];
                  const effectiveThumbnailSrc = msg.thumbnailUrl || thumbnailSrc;
                  const isThumbnailLoading = !!thumbnailLoadingMap[msg._id];

                  return (
                    <div
                      key={msg._id}
                      className={`chat chat-message-in ${isOwn ? "chat-end" : "chat-start"}`}
                      onMouseEnter={() => !isOwn && setHoveredMessageId(msg._id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                    >
                      <div
                        className={`chat-bubble chat-bubble-tail ${isOwn ? "chat-bubble-tail-own" : "chat-bubble-tail-other"} relative rounded-3xl px-4 py-3 shadow-md ${
                          isScheduled
                            ? "bg-warning/20 text-warning border border-warning/30"
                            : isOwn
                              ? "bg-accent-primary text-bg-primary rounded-br-sm"
                              : "bg-bg-elevated text-text-primary rounded-bl-sm border border-border"
                        }`}
                        onContextMenu={(e) => {
                          if (!isOwn) return;
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, message: msg });
                        }}
                      >
                        {isScheduled && (
                          <div className="flex items-center gap-1 text-xs text-warning mb-1.5 -mt-0.5 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Scheduled</span>
                          </div>
                        )}

                        {!isOwn && msg.text && (hoveredMessageId === msg._id || speakingMessageId === msg._id) && (
                          <button
                            type="button"
                            onClick={() => speakMessage(msg._id, msg.text)}
                            className={`absolute -right-8 top-1 p-1 rounded-full transition-all duration-200 ${
                              speakingMessageId === msg._id
                                ? "text-accent-primary bg-bg-secondary"
                                : "text-text-muted hover:text-accent-primary hover:bg-bg-secondary"
                            }`}
                            title="Listen to message"
                          >
                            <Volume2 className={`w-4 h-4 ${speakingMessageId === msg._id ? "animate-pulse" : ""}`} />
                          </button>
                        )}

                        {msg.image && <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />}
                        {isMedia && msg.fileUrl && !isDownloaded && (
                          <div className={`mt-1 w-full max-w-xs rounded-2xl border p-3 ${isOwn ? "bg-bg-primary/20 border-bg-primary/30" : "bg-bg-secondary/50 border-border"}`}>
                            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border bg-bg-elevated shadow-inner">
                              {isAudio ? (
                                <div className="w-full h-full flex items-center justify-between px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-300/30 flex items-center justify-center">
                                      <FileAudio2 className="w-4 h-4 text-accent-primary" />
                                    </div>
                                    <span className="text-xs text-text-secondary font-medium">Audio file</span>
                                  </div>
                                  <div className="flex items-end gap-1 h-8 opacity-80">
                                    <span className="w-1 h-3 rounded bg-accent-primary" />
                                    <span className="w-1 h-6 rounded bg-accent-primary" />
                                    <span className="w-1 h-4 rounded bg-accent-primary" />
                                    <span className="w-1 h-7 rounded bg-accent-primary" />
                                    <span className="w-1 h-5 rounded bg-accent-primary" />
                                  </div>
                                </div>
                              ) : effectiveThumbnailSrc ? (
                                <img src={effectiveThumbnailSrc} alt="Media thumbnail" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {isThumbnailLoading ? (
                                    <span className="text-xs text-text-muted font-medium">Generating preview...</span>
                                  ) : isVideo ? (
                                    <video
                                      src={msg.fileUrl}
                                      preload="metadata"
                                      muted
                                      playsInline
                                      className="w-full h-full object-cover"
                                    />
                                  ) : isPdf || isDocument ? (
                                    <FileText className="w-8 h-8 text-cyan-300" />
                                  ) : (
                                    <FileVideo2 className="w-8 h-8 text-cyan-300" />
                                  )}
                                </div>
                              )}

                              <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-bg-surface/80 backdrop-blur-md border border-border flex items-center justify-center shadow-sm">
                                {isVideo ? (
                                  <span className="text-[10px] font-bold text-text-primary">▶</span>
                                ) : isPdf ? (
                                  <span className="text-[10px] font-bold text-text-primary">PDF</span>
                                ) : isDocument ? (
                                  <span className="text-[10px] font-bold text-text-primary">DOC</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-text-primary">♪</span>
                                )}
                              </div>
                            </div>

                            <div className="mt-2 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isOwn ? "text-bg-primary" : "text-text-primary"}`}>{mediaFileName}</p>
                              <p className={`text-[11px] uppercase tracking-wider font-bold mt-0.5 ${isOwn ? "text-bg-primary/70" : "text-text-muted"}`}>{mediaType} file</p>
                              <p className={`text-[11px] mt-0.5 ${isOwn ? "text-bg-primary/80" : "text-text-secondary"}`}>
                                {mediaSizeText || "Size unavailable"}
                                {durationText ? ` | Duration: ${durationText}` : ""}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isDownloading}
                              onClick={() => downloadMedia(msg._id, msg.fileUrl, mediaType, mediaFileName)}
                              className={`mt-4 w-full rounded-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all px-3 py-2.5 text-sm font-bold flex items-center justify-center gap-2 ${isOwn ? "bg-bg-primary/20 hover:bg-bg-primary/30 text-bg-primary border border-bg-primary/20" : "bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20"}`}
                            >
                              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                              {isDownloading ? "Downloading..." : "Download"}
                            </button>
                          </div>
                        )}
                        {isMedia && msg.fileUrl && isDownloaded && (
                          <div className={`mt-1 w-full max-w-xs space-y-3 rounded-2xl p-3 border ${isOwn ? "bg-bg-primary/20 border-bg-primary/30" : "bg-bg-secondary/50 border-border"}`}>
                            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border bg-bg-elevated shadow-inner">
                              {isAudio ? (
                                <div className="w-full h-full flex items-center justify-between px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-300/30 flex items-center justify-center">
                                      <FileAudio2 className="w-4 h-4 text-accent-primary" />
                                    </div>
                                    <span className="text-xs text-text-secondary font-medium">Audio file</span>
                                  </div>
                                  <div className="flex items-end gap-1 h-8 opacity-80">
                                    <span className="w-1 h-3 rounded bg-accent-primary" />
                                    <span className="w-1 h-6 rounded bg-accent-primary" />
                                    <span className="w-1 h-4 rounded bg-accent-primary" />
                                    <span className="w-1 h-7 rounded bg-accent-primary" />
                                    <span className="w-1 h-5 rounded bg-accent-primary" />
                                  </div>
                                </div>
                              ) : effectiveThumbnailSrc ? (
                                <img src={effectiveThumbnailSrc} alt="Media thumbnail" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {isPdf ? (
                                    <FileText className="w-8 h-8 text-cyan-300" />
                                  ) : isDocument ? (
                                    <FileText className="w-8 h-8 text-cyan-300" />
                                  ) : (
                                    <FileVideo2 className="w-8 h-8 text-cyan-300" />
                                  )}
                                </div>
                              )}

                              <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-bg-surface/80 backdrop-blur-md border border-border flex items-center justify-center shadow-sm">
                                {isVideo ? (
                                  <span className="text-[10px] font-bold text-text-primary">▶</span>
                                ) : isPdf ? (
                                  <span className="text-[10px] font-bold text-text-primary">PDF</span>
                                ) : isDocument ? (
                                  <span className="text-[10px] font-bold text-text-primary">DOC</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-text-primary">♪</span>
                                )}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <p className={`text-sm font-semibold truncate ${isOwn ? "text-bg-primary" : "text-text-primary"}`}>{mediaFileName}</p>
                              <p className={`text-[11px] mt-0.5 ${isOwn ? "text-bg-primary/80" : "text-text-secondary"}`}>
                                {mediaSizeText || "Size unavailable"}
                                {durationText ? ` | Duration: ${durationText}` : ""}
                              </p>
                            </div>

                            <div className={`text-[11px] font-bold flex items-center gap-1 ${isOwn ? "text-bg-primary" : "text-success"}`}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Downloaded
                            </div>

                            {isPdf ? (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => openPdfInNewTab(msg.fileUrl)}
                                  className={`rounded-xl transition-all px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 ${isOwn ? "bg-bg-primary/20 hover:bg-bg-primary/30 text-bg-primary border border-bg-primary/20" : "bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20"}`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Open
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveMediaAs(msg.fileUrl, "pdf", mediaFileName)}
                                  className={`rounded-xl transition-all px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 ${isOwn ? "bg-bg-primary/10 hover:bg-bg-primary/20 text-bg-primary border border-bg-primary/10" : "bg-bg-elevated hover:bg-bg-secondary text-text-primary border border-border"}`}
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Save As
                                </button>
                              </div>
                            ) : isVideo ? (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => openPdfInNewTab(msg.fileUrl)}
                                  className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-300/30 text-cyan-200 transition-colors px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Play
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveMediaAs(msg.fileUrl, "video", mediaFileName)}
                                  className="rounded-lg bg-slate-700/70 hover:bg-slate-600/70 border border-white/10 text-slate-100 transition-colors px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Save As
                                </button>
                              </div>
                            ) : isAudio ? (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => openPdfInNewTab(msg.fileUrl)}
                                  className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-300/30 text-cyan-200 transition-colors px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Play
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveMediaAs(msg.fileUrl, mediaType, mediaFileName)}
                                  className="rounded-lg bg-slate-700/70 hover:bg-slate-600/70 border border-white/10 text-slate-100 transition-colors px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Save As
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => openPdfInNewTab(msg.fileUrl)}
                                  className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-300/30 text-cyan-200 transition-colors px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Open
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveMediaAs(msg.fileUrl, "document", mediaFileName)}
                                  className="rounded-lg bg-slate-700/70 hover:bg-slate-600/70 border border-white/10 text-slate-100 transition-colors px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Save As
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {msg.text && <p className="mt-2">{msg.text}</p>}

                        <p className={`text-[11px] mt-2 opacity-85 flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                          {msg.status === "scheduled" && msg.isScheduled && (
                            <>
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span className="text-amber-400">
                                Scheduled: {new Date(msg.scheduledAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          )}

                          {msg.status !== "scheduled" && (
                            <>
                              {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </>
                          )}

                          {msg.edited && <span className="italic text-[10px] opacity-60">(edited)</span>}

                          {isOwn && !isScheduled && (
                            <span
                              className={`chat-message-ticks ${
                                tickStatus === "seen"
                                  ? "chat-message-ticks-seen"
                                  : "chat-message-ticks-muted"
                              } ${isLastOwnMessage && tickStatus === "seen" ? "chat-message-ticks-animate" : ""}`}
                              aria-label={tickStatus}
                            >
                              {tickStatus === "seen" ? "✓✓" : "✓"}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
            </div>
          ) : isMessagesLoading ? (
              <MessagesLoadingSkeleton />
            ) : isChatDeleted ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-400/10 rounded-full flex items-center justify-center mb-5">
                  <RotateCcw className="size-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-200 mb-3">This chat was deleted</h3>
                <p className="text-slate-400 text-sm max-w-md mb-5">
                  You previously deleted this conversation. Restore it from the RestoreChat section to view old messages.
                </p>
                <button
                  onClick={() => navigate("/restore-chat")}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Go to Restore Chat
                </button>
              </div>
          ) : friendStatus && friendStatus.status === "friends" ? (
            <NoChatHistoryPlaceholder name={selectedUser.fullName} />
          ) : (
            <FriendRequestBlock otherUser={selectedUser} status={friendStatus} />
          );
        })()}
      </div>

      {contextMenu && (
        (() => {
          const message = contextMenu.message;
          const sentAt = message.status === "scheduled"
            ? Number.POSITIVE_INFINITY
            : new Date(message.scheduledAt || message.createdAt).getTime();
          const canEditOrDeleteForEveryone = Number.isFinite(sentAt)
            ? Date.now() - sentAt <= EDIT_DELETE_WINDOW_MS
            : true;

          return (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDeleteForMe={() => deleteForMe(contextMenu.message._id)}
          onDeleteForEveryone={() => deleteForEveryone(contextMenu.message._id)}
          onEdit={() => setEditingMessage(contextMenu.message)}
          canEditOrDeleteForEveryone={canEditOrDeleteForEveryone}
        />
          );
        })()
      )}

      {friendStatus && friendStatus.status === "friends" ? <MessageInput /> : null}

      {showRemoveConfirm && (
        <RemoveFriendConfirmation
          userName={selectedUser.fullName}
          onConfirm={handleRemoveFriendConfirm}
          onCancel={() => setShowRemoveConfirm(false)}
        />
      )}
    </div>
  );
}

export default ChatContainer;
