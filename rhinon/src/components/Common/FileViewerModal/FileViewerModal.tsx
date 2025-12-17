"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          {fileType === "image" ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-[70vh] object-contain bg-transparent mx-auto rounded-xl"
            />
          ) : fileType === "video" ? (
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-[70vh] bg-black rounded-xl mx-auto"
            />
          ) : (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(
                fileUrl
              )}&embedded=true`}
              title={fileName}
              className="w-full h-[70vh] border-0 rounded-xl"
              style={{ minWidth: "600px" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
