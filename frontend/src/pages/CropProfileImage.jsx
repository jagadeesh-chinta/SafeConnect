import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import Cropper from "react-easy-crop";
import { ArrowLeft, Upload, Save, X, ZoomIn, ZoomOut } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

// Helper function to create cropped image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // Set canvas size to the cropped area size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as base64 string
  return canvas.toDataURL("image/jpeg", 0.9);
};

function CropProfileImage() {
  const navigate = useNavigate();
  const { setAuthUser } = useAuthStore();
  const fileInputRef = useRef(null);

  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    });
    reader.readAsDataURL(file);
  };

  // Handle crop complete
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle save
  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.error("Please select and crop an image first");
      return;
    }

    setIsUploading(true);
    try {
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      if (!croppedImageBase64) {
        throw new Error("Failed to crop image");
      }

      const res = await axiosInstance.put("/user/update-avatar", {
        profilePic: croppedImageBase64,
      });

      setAuthUser(res.data);
      toast.success("Profile picture updated successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error uploading cropped image:", error);
      toast.error(error.response?.data?.message || "Failed to update profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate("/profile");
  };

  // Reset image selection
  const handleReset = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const pageTheme = localStorage.getItem("chatTheme") || "dark";

  return (
    <div className={`feature-page chat-theme-${pageTheme} flex items-center justify-center p-4`}>
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleCancel}
            className="feature-back-btn cursor-pointer relative z-10 flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Profile</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="feature-card p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-100 mb-1">Crop Profile Picture</h1>
            <p className="text-slate-400 text-sm">
              {imageSrc ? "Drag to reposition, use slider to zoom" : "Select an image to crop"}
            </p>
          </div>

          {!imageSrc ? (
            /* Upload Section */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-accent-primary rounded-xl p-12 cursor-pointer transition-colors group bg-bg-secondary/30 hover:bg-bg-secondary/50"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-bg-elevated group-hover:bg-accent-primary/10 flex items-center justify-center transition-all ring-4 ring-transparent group-hover:ring-accent-primary/5">
                    <Upload className="w-8 h-8 text-text-muted group-hover:text-accent-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-text-primary font-bold mb-1">Click to upload image</p>
                    <p className="text-text-secondary text-sm">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            /* Crop Section */
            <div className="space-y-6">
              {/* Crop Area */}
              <div className="relative w-full h-80 bg-bg-secondary/80 rounded-2xl overflow-hidden border border-border shadow-inner">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              {/* Zoom Control */}
              <div className="flex items-center gap-4 px-4">
                <ZoomOut className="w-5 h-5 text-slate-400" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-2 bg-bg-elevated rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
                <ZoomIn className="w-5 h-5 text-slate-400" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 primary-button disabled:opacity-50 font-bold rounded-xl transition-all shadow-md shadow-accent-primary/20"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isUploading ? "Uploading..." : "Save"}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isUploading}
                  className="px-4 py-3 bg-bg-elevated hover:bg-bg-secondary text-text-primary border border-border rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isUploading}
                  className="px-6 py-3 bg-bg-elevated hover:bg-bg-secondary text-text-primary border border-border rounded-xl transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CropProfileImage;
