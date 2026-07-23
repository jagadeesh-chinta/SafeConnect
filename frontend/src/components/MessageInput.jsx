import { useRef, useState, useEffect, useCallback } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, Undo2Icon, MicIcon, ClockIcon, PaperclipIcon, FileAudio2, FileText } from "lucide-react";
import { getPreferredRecognitionLanguage } from "../lib/languageDetection";

const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_AUDIO_PDF_SIZE_BYTES = 100 * 1024 * 1024;
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

const hasAllowedDocumentExtension = (fileName = "") => {
  const lowered = fileName.toLowerCase();
  return DOCUMENT_EXTENSIONS.some((ext) => lowered.endsWith(ext));
};

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

const extractMediaDuration = (file, mediaElementType) =>
  new Promise((resolve) => {
    const mediaUrl = URL.createObjectURL(file);
    const element = document.createElement(mediaElementType);
    element.preload = "metadata";
    element.src = mediaUrl;

    const cleanup = () => {
      element.onloadedmetadata = null;
      element.onerror = null;
      URL.revokeObjectURL(mediaUrl);
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

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [mediaFileName, setMediaFileName] = useState("");
  const [mediaFileSize, setMediaFileSize] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(null);

  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const inputRef = useRef(null);
  const undoTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const schedulerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  // --- Speech Recognition Setup with Auto Language Detection ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Use browser's preferred language for speech recognition
      recognition.lang = getPreferredRecognitionLanguage();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => (prev ? prev + " " + transcript : transcript));
        inputRef.current?.focus();
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.error("Microphone permission denied. Please allow microphone access.");
        } else if (event.error === "no-speech") {
          toast.error("No speech detected. Please try again.");
        } else {
          toast.error("Voice recognition error. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleVoiceInput = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Voice recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        toast.error("Failed to start voice recognition. Please try again.");
      }
    }
  }, [isListening]);

  const {
    sendMessage,
    isSoundEnabled,
    isUploadingMedia,
    mediaUploadProgress,
    selectedUser,
    editingMessage,
    setEditingMessage,
    editMessage,
    deletedMessageTemp,
    undoDeleteForMe,
    confirmDeleteForMe,
  } = useChatStore();
  const socket = useAuthStore((state) => state.socket);
  const authUser = useAuthStore((state) => state.authUser);

  const emitStopTyping = useCallback(() => {
    if (!socket || !authUser?._id || !selectedUser?._id) return;
    socket.emit("stop_typing", {
      fromUserId: authUser._id,
      toUserId: selectedUser._id,
    });
  }, [socket, authUser?._id, selectedUser?._id]);

  const handleTypingSignal = useCallback(
    (value) => {
      if (!socket || !authUser?._id || !selectedUser?._id || editingMessage) return;

      clearTimeout(typingTimeoutRef.current);

      if (!value.trim()) {
        emitStopTyping();
        return;
      }

      socket.emit("typing", {
        fromUserId: authUser._id,
        toUserId: selectedUser._id,
      });

      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping();
      }, 500);
    },
    [socket, authUser?._id, selectedUser?._id, editingMessage, emitStopTyping]
  );

  // --- UNDO DELETE timer ---
  useEffect(() => {
    if (deletedMessageTemp) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        confirmDeleteForMe(deletedMessageTemp._id);
      }, 5000);
    }
    return () => clearTimeout(undoTimerRef.current);
  }, [deletedMessageTemp, confirmDeleteForMe]);

  // --- EDIT: populate input ---
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || "");
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      emitStopTyping();
    };
  }, [emitStopTyping]);

  const cancelEdit = useCallback(() => {
    setEditingMessage(null);
    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  }, [setEditingMessage]);

  const handleUndo = useCallback(() => {
    clearTimeout(undoTimerRef.current);
    undoDeleteForMe();
  }, [undoDeleteForMe]);

  // --- Close scheduler popup on outside click ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (schedulerRef.current && !schedulerRef.current.contains(e.target)) {
        setShowScheduler(false);
      }
    };
    if (showScheduler) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showScheduler]);

  // --- Get minimum datetime for scheduler (now + 1 minute) ---
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  const handleScheduleToggle = () => {
    if (showScheduler) {
      // Clear and close
      setScheduledDateTime("");
      setShowScheduler(false);
    } else {
      setShowScheduler(true);
    }
  };

  const handleClearSchedule = () => {
    setScheduledDateTime("");
    setShowScheduler(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    // Editing mode
    if (editingMessage) {
      if (!text.trim()) return;
      if (isSoundEnabled) playRandomKeyStrokeSound();
      editMessage(editingMessage._id, text.trim());
      setText("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      return;
    }

    if (!text.trim() && !imagePreview && !mediaFile) return;

    // Validate scheduled time if set
    if (scheduledDateTime) {
      const scheduledDate = new Date(scheduledDateTime);
      const now = new Date();
      if (scheduledDate <= now) {
        toast.error("Scheduled time must be in the future");
        return;
      }
    }

    if (isSoundEnabled) playRandomKeyStrokeSound();

    sendMessage({
      text: text.trim(),
      image: imagePreview,
      mediaFile,
      type: mediaType,
      fileUrl: mediaPreview,
      fileName: mediaFileName,
      fileSize: mediaFileSize,
      duration: mediaDuration,
      scheduledAt: scheduledDateTime ? new Date(scheduledDateTime).toISOString() : null,
    });

    clearTimeout(typingTimeoutRef.current);
    emitStopTyping();

    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setImagePreview("");
    setMediaFile(null);
    setMediaType(null);
    setMediaFileName("");
    setMediaFileSize(0);
    setMediaDuration(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
    setScheduledDateTime("");
    setShowScheduler(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaPreview(null);
    setMediaFile(null);
    setMediaType(null);
    setMediaFileName("");
    setMediaFileSize(0);
    setMediaDuration(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleMediaChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isMp4 = file.type === "video/mp4";
    const isMp3 = file.type === "audio/mpeg" || file.type === "audio/mp3";
    const isPdf = file.type === "application/pdf";
    const isDocument = isPdf || DOCUMENT_MIME_TYPES.has(file.type) || hasAllowedDocumentExtension(file.name);

    if (!isMp4 && !isMp3 && !isDocument) {
      toast.error("Only MP4, MP3, and document files are allowed");
      return;
    }

    if (isMp4 && file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error("Video size must be less than 50MB");
      return;
    }

    if ((isMp3 || isDocument) && file.size > MAX_AUDIO_PDF_SIZE_BYTES) {
      toast.error("Audio/Document size must be less than 100MB");
      return;
    }

    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    let extractedDuration = null;
    if (isMp4) {
      extractedDuration = await extractMediaDuration(file, "video");
    } else if (isMp3) {
      extractedDuration = await extractMediaDuration(file, "audio");
    }

    setMediaFile(file);
    setMediaType(isMp4 ? "video" : isMp3 ? "audio" : isPdf ? "pdf" : "document");
    setMediaFileName(file.name || "attachment");
    setMediaFileSize(file.size || 0);
    setMediaDuration(extractedDuration);
    setMediaPreview(objectUrl);

    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    setMediaPreview(null);
    setMediaFile(null);
    setMediaType(null);
    setMediaFileName("");
    setMediaFileSize(0);
    setMediaDuration(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  return (
    <div className="p-4 md:p-6 border-t border-border bg-bg-surface/50 backdrop-blur-md relative shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
      {/* Undo delete notification */}
      {deletedMessageTemp && (
        <div className="absolute -top-12 left-0 right-0 bg-bg-surface backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between text-sm text-text-primary z-10 shadow-sm font-medium">
          <span>Message deleted</span>
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1 text-accent-primary hover:text-accent-secondary font-bold transition-colors"
          >
            <Undo2Icon className="w-3.5 h-3.5" />
            UNDO
          </button>
        </div>
      )}

      {/* Edit mode indicator */}
      {editingMessage && !deletedMessageTemp && (
        <div className="absolute -top-12 left-0 right-0 bg-bg-surface backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between text-sm text-text-primary z-10 shadow-sm font-medium">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></span>Editing message...</span>
          <button type="button" onClick={cancelEdit} className="text-text-muted hover:text-text-primary font-bold transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Scheduled message indicator */}
      {scheduledDateTime && !editingMessage && !deletedMessageTemp && (
        <div className="absolute -top-12 left-0 right-0 bg-gradient-to-r from-warning/20 to-warning/10 border-b border-warning/30 px-6 py-3 flex items-center justify-between text-sm text-warning z-10 backdrop-blur-md font-medium">
          <span className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4" />
            Scheduled for: {new Date(scheduledDateTime).toLocaleString()}
          </span>
          <button
            type="button"
            onClick={handleClearSchedule}
            className="text-warning hover:text-white font-bold transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="w-full mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-white/20"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/10 transition-all shadow-md"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {mediaPreview && mediaType && (
        <div className="w-full mb-3 flex items-center">
          <div className="relative w-full max-w-xs rounded-xl border border-border p-2 bg-bg-secondary/80 backdrop-blur-sm shadow-md">
            {mediaType === "video" ? (
              <video
                controls
                src={mediaPreview}
                className="w-full max-h-36 rounded-lg object-cover"
              />
            ) : (
              <div className="flex items-center gap-2 px-1 py-1">
                <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center">
                  {mediaType === "audio" ? <FileAudio2 className="w-5 h-5 text-accent-primary" /> : <FileText className="w-5 h-5 text-accent-primary" />}
                </div>
              </div>
            )}
            <div className="mt-2 min-w-0 px-1">
              <p className="text-sm text-text-primary font-medium truncate">{mediaFileName || (mediaType === "pdf" || mediaType === "document" ? "document.file" : mediaType === "video" ? "video.mp4" : "audio.mp3")}</p>
              <p className="text-[11px] text-text-muted uppercase tracking-wide font-semibold mt-0.5">{mediaType} file</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {formatFileSize(mediaFileSize) || "Size unavailable"}
                {(mediaType === "video" || mediaType === "audio") && mediaDuration ? ` | Duration: ${formatDuration(mediaDuration)}` : ""}
              </p>
            </div>
            <button
              onClick={removeMedia}
              className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/10 transition-all shadow-md"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {text.trim().length > 0 && !editingMessage && (
        <div className="mb-2 ml-2 text-xs text-accent-primary font-medium flex items-center gap-2">
          Typing
          <span className="typing-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      )}

      {isUploadingMedia && (
        <div className="mb-2 ml-2 text-xs text-accent-primary font-medium flex items-center gap-2 animate-pulse">
          Uploading media {mediaUploadProgress}%
        </div>
      )}

      <form onSubmit={handleSendMessage} className="w-full flex items-end gap-2 md:gap-3 bg-bg-secondary p-1.5 md:p-2 rounded-[24px] border border-border shadow-inner">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            handleTypingSignal(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              // Only prevent default and submit if not on a mobile touch device, 
              // or let users use the send button. 
              // Wait, usually on desktop Enter sends, Shift+Enter new line.
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          rows={1}
          style={{ height: "auto" }}
          className="flex-1 min-w-0 bg-transparent py-3 px-4 md:px-5 text-text-primary placeholder-text-muted text-sm md:text-base focus:outline-none transition-all resize-none overflow-y-auto max-h-[120px] custom-scrollbar"
          placeholder={editingMessage ? "Edit your message..." : "Type your message..."}
        />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <input
          type="file"
          accept="video/mp4,audio/mpeg,audio/mp3,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,application/rtf,application/vnd.oasis.opendocument.text,application/vnd.oasis.opendocument.spreadsheet,application/vnd.oasis.opendocument.presentation,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.rtf,.odt,.ods,.odp"
          ref={mediaInputRef}
          onChange={handleMediaChange}
          className="hidden"
        />

        <div className="flex gap-1 md:gap-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`glass-button text-text-secondary hover:text-accent-primary rounded-xl px-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${
              imagePreview ? "text-accent-primary bg-accent-primary/10" : ""
            }`}
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            className={`glass-button text-text-secondary hover:text-accent-primary rounded-xl px-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${
              mediaPreview ? "text-accent-primary bg-accent-primary/10" : ""
            }`}
            title="Attach MP4, MP3, or document"
          >
            <PaperclipIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`glass-button rounded-xl px-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors relative ${
              isListening 
                ? "text-danger bg-danger/10" 
                : "text-text-secondary hover:text-accent-primary"
            }`}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            <MicIcon className="w-5 h-5" />
            {isListening && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Schedule Message Button */}
          <div className="relative" ref={schedulerRef}>
            <button
              type="button"
              onClick={handleScheduleToggle}
              className={`glass-button rounded-xl px-3 py-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors relative ${
                scheduledDateTime
                  ? "text-warning bg-warning/10"
                  : "text-text-secondary hover:text-accent-primary"
              }`}
              title={scheduledDateTime ? "Scheduled message" : "Schedule message"}
              disabled={editingMessage}
            >
              <ClockIcon className="w-5 h-5" />
              {scheduledDateTime && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </button>

            {/* Scheduler Popup */}
            {showScheduler && (
              <div className="absolute bottom-full right-0 mb-4 glass-card border border-border rounded-xl shadow-2xl p-5 min-w-[280px] md:min-w-[300px] z-20 animate-fade-in-up">
                <div className="text-sm text-text-primary font-semibold mb-4 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-warning" />
                  <span>Schedule Message</span>
                </div>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  min={getMinDateTime()}
                  className="w-full bg-bg-secondary border border-border rounded-lg py-2.5 px-3 text-text-primary text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                />
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleClearSchedule}
                    className="flex-1 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-bg-secondary border border-border rounded-lg transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduler(false)}
                    disabled={!scheduledDateTime}
                    className="primary-button flex-1 px-3 py-2.5 text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    Set Time
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={(!text.trim() && !imagePreview && !mediaFile) || isUploadingMedia}
            className="primary-button rounded-[16px] px-4 md:px-5 py-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center ml-1"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
export default MessageInput;
