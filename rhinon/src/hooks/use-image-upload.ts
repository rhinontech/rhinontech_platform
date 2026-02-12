import { uploadFileAndGetFullUrl } from "@/services/fileUploadService";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageUploadProps {
  onUpload?: (url: string) => void;
}

export function useImageUpload({
  onUpload,
  onError,
}: {
  onUpload?: (url: string) => void;
  onError?: (e: string) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const result = await uploadFileAndGetFullUrl(file);
      const key = result?.key;
      if (!key) throw new Error("No S3 key returned from server");

      // Store S3 key (not presigned URL) in article content
      // The viewer will resolve it to presigned URL when displaying
      onUpload?.(key);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Failed to upload image");
      onError?.("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return {
    previewUrl,
    fileInputRef,
    handleFileChange,
    handleRemove,
    uploading,
    error,
  };
}
