"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSecureViewUrl } from "@/services/fileUploadService";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: "image" | "pdf" | "video";
}

export function FileViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: FileViewerModalProps) {
  const [secureUrl, setSecureUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !fileUrl) return;

    // If it's a legacy URL or a data URL (preview), use it directly
    if (fileUrl.startsWith("http") || fileUrl.startsWith("data:")) {
      setSecureUrl(fileUrl);
      return;
    }

    // Otherwise, assume it's an S3 Key and fetch a signed URL
    setLoading(true);
    let active = true;

    const resolveSrc = async () => {
      try {
        const url = await getSecureViewUrl(fileUrl);
        if (active && url) {
          setSecureUrl(url);
        }
      } catch (err) {
        console.error("Failed to load secure file", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    resolveSrc();

    return () => {
      active = false;
    };
  }, [fileUrl, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-w-[90vw] max-h-[90vh] bg-white/0 rounded-lg shadow-2xl">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="shrink-0 absolute top-[-40px] right-0 bg-destructive/70 hover:text-white text-white hover:bg-destructive/60"
          >
            Close
          </Button>
          {loading ? (
            <div className="flex items-center justify-center w-[300px] h-[200px] bg-white rounded-xl">
              <span className="text-gray-500">Loading...</span>
            </div>
          ) : (
            <>
              {fileType === "image" ? (
                <img
                  src={secureUrl}
                  alt={fileName}
                  className="max-w-full max-h-[70vh] object-contain bg-transparent mx-auto rounded-xl"
                />
              ) : fileType === "video" ? (
                <video
                  src={secureUrl}
                  controls
                  className="max-w-full max-h-[70vh] bg-black rounded-xl mx-auto"
                />
              ) : (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(
                    secureUrl
                  )}&embedded=true`}
                  title={fileName}
                  className="w-full h-[70vh] border-0 rounded-xl"
                  style={{ minWidth: "600px" }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
