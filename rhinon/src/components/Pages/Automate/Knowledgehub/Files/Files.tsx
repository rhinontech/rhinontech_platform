"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useRouter, useSearchParams } from "next/navigation";

import { useState, useCallback, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PanelLeft, Upload, FileText, X, Info, Plus, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import images from "@/components/Constants/Images";
import {
  createOrUpdateAutomation,
  getAutomation,
  trainAndSetAssistant,
} from "@/services/automations/automationServices";
import { uploadPdfFile } from "@/services/fileUploadService";
import { useUserStore } from "@/utils/store";
import Loading from "@/app/loading";
import { FileViewerModal } from "@/components/Common/FileViewerModal/FileViewerModal";
import { toast } from "sonner";
import { PLAN_LIMITS } from "@/lib/plans";

interface FileItem {
  s3Name: string;
  originalName: string;
  size: number;
  uploadedAt: string;
}

export default function Files() {
  const router = useRouter();
  const { toggleAutomateSidebar } = useSidebar();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [showHero, setShowHero] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isInternalOnly, setIsInternalOnly] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fetching, setFetching] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, isLoading] = useState(false);
  const orgPlan = useUserStore((state) => state.userData.orgPlan);
  const chatbotId = useUserStore((state) => state.userData.chatbotId);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  const subscriptionLimit = PLAN_LIMITS[orgPlan]?.file || 3;
  const canAddFile = files.length < subscriptionLimit;

  const allowedExtensions = ["pdf", "doc", "docx", "txt", "ppt", "pptx"];

  const getFiles = async () => {
    setFetching(true);
    try {
      const response = await getAutomation();
      const fetchedFiles = response.training_pdf || [];
      setFiles(fetchedFiles);
    } catch (error) {
      console.error("Error getting PDFs:", error);
    } finally {
      setFetching(false);
    }
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    getFiles();
  }, []);

  useEffect(() => {
    // Wait until files are fetched before handling addFile param
    if (fetching) return;

    const addFileParam = searchParams.get("addFile");

    if (addFileParam === "true") {
      const canAddFile = files.length < subscriptionLimit;
      if (canAddFile) {
        setIsUploadModalOpen(true);
      } else {
        toast.error(
          "You’ve reached your plan limit. Upgrade your plan to upload more files."
        );
      }

      // Remove ?addFile=true from the URL after handling
      const currentUrl = window.location.pathname;
      router.replace(currentUrl);
    }
  }, [searchParams, canAddFile, fetching, router]);

  const handleConfirmUpload = async () => {
    isLoading(true);
    if (!selectedFile) return;

    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 20;
      });
    }, 150);

    try {
      const response = await uploadPdfFile(selectedFile);
      if (!response || !response.fileName) {
        throw new Error("File upload failed");
      }

      const newFile: FileItem = {
        s3Name: response.fileName,
        originalName: selectedFile.name,
        size: selectedFile.size,
        uploadedAt: new Date().toISOString(),
      };

      const updatedFiles = [...files, newFile];

      await createOrUpdateAutomation({
        training_pdf: updatedFiles,
        isChatbotTrained: false,
      });
      setFiles(updatedFiles);
      setIsUploadModalOpen(false);
      toast.success("File added successfully.");
      try {
        await trainAndSetAssistant(chatbotId);
      } catch (trainError) {
        console.error("Failed to retrain chatbot after upload:", trainError);
        toast.error("File uploaded, but retraining failed.");
      }
      console.log("PDF uploaded successfully");

      setSelectedFile(null);
      setUploadProgress(null);
    } catch (error) {
      setUploadProgress(null);
      clearInterval(progressInterval);
      console.error("Upload failed:", error);
      // message.error("Upload failed. Please try again.");
      toast.error("Failed to added file.");

    } finally {
      isLoading(false);
    }
  };

  const removeFile = async (fileId: string) => {
    const updatedFiles = files.filter((file) => file.s3Name !== fileId);

    try {
      await createOrUpdateAutomation({
        training_pdf: updatedFiles,
        isChatbotTrained: false,
      });
      setFiles(updatedFiles);
      toast.success("File removed successfully.");
      try {
        await trainAndSetAssistant(chatbotId);
      } catch (trainError) {
        console.error(
          "Failed to retrain chatbot after file deletion:",
          trainError
        );
        toast.error("File removed, but retraining failed.");
      }
    } catch (error) {
      console.error("Failed to update automation after file deletion", error);
      console.error("Failed to update file list.");
      toast.error("Failed to remove file.");
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelect(droppedFiles);
  }, []);

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFileSelect(selectedFiles);
  };

  const handleFileSelect = (uploadedFiles: File[]) => {
    const file = uploadedFiles[0];
    const extension = file?.name.split(".").pop()?.toLowerCase();
    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (!file) return;

    if (!extension || !allowedExtensions.includes(extension)) {
      toast.error(
        "Invalid file type. Allowed types: pdf, doc, docx, txt, ppt, pptx."
      );
      return;
    }

    if (file.size > maxSize) {
      toast.error("File is too large. Maximum allowed size is 10 MB.");
      return;
    }

    setSelectedFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setUploadProgress(null);
    setIsInternalOnly(false);
  };

  return (
    <>
      <div className="flex h-full w-full overflow-hidden bg-background">
        <div className="flex flex-1 flex-col w-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 h-[60px] p-4">
            <div className="flex items-center gap-4">
              <PanelLeft onClick={toggleAutomateSidebar} className="h-4 w-4" />
              <h2 className="text-base font-bold">Files</h2>
            </div>
            <Button
              onClick={() => {
                if (!canAddFile) {
                  toast.error(
                    "You’ve reached your plan limit. Upgrade your plan to upload more files."
                  );
                  return;
                }
                setIsUploadModalOpen(true);
              }}
              disabled={fetching}
              className={cn(
                "bg-primary text-primary-foreground",
                !canAddFile && "opacity-50 cursor-not-allowed"
              )}>
              <Plus className="h-4 w-4 mr-2" />
              Add File
            </Button>
          </div>

          <ScrollArea className="flex-1 h-0">
            {showHero && (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="flex w-full p-5 rounded-lg bg-gradient-to-r from-transparent to-secondary">
                  <div className="flex-1 flex flex-col gap-[12px] justify-center items-start">
                    <p className="font-semibold text-2xl">Add Files</p>
                    <p className="text-base text-muted-foreground">
                      Upload Files with valuable knowledge about your business.
                      Add product brochures, employee handbooks, training
                      manuals, and other key documents
                    </p>
                    <p className="flex items-center gap-2 text-primary">
                      <Info className="h-4 w-4" />
                      Tell me more
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex gap-[9px]">
                    <Image
                      src={images.FilePlaceholder}
                      width={167}
                      height={213}
                      alt={""}
                    />
                    <X
                      className="cursor-pointer"
                      onClick={() => setShowHero(false)}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="relative min-h-[200px]">
              {fetching ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
                  <Loading areaOnly />
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No files added
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md">
                      Upload a file with your business knowledge to support
                      agents at work.
                    </p>
                    <Button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Add File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {files.map((file) => (
                    <div
                      key={file.uploadedAt}
                      onClick={() => {
                        setPreviewFile(file);
                        setIsPreviewOpen(true);
                      }}
                      className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {file.originalName}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </span>
                            {/* {file.isInternal && (
                            <>
                              <span>•</span>
                              <span className="text-primary">
                                Internal only
                              </span>
                            </>
                          )} */}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.s3Name);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {previewFile && (
        <FileViewerModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          fileUrl={`https://rhinon-beta-assets-v2-beta.s3.ap-south-1.amazonaws.com/platform-uploads/${previewFile.s3Name}`} // adjust path
          fileName={previewFile.originalName}
          fileType={previewFile.originalName.split(".").pop()}
        />
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add File</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Upload a File to extract text data. This knowledge will be used
              for internal assistance from{" "}
              <span className="text-primary font-medium underline decoration-primary/30">
                Copilot
              </span>{" "}
              and for generating{" "}
              <span className="text-primary font-medium underline decoration-primary/30">
                reply suggestions
              </span>{" "}
              in customer chats.
            </div>

            {/* Upload Area */}
            {uploadProgress !== null ? (
              <div className="space-y-4">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploading...</p>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress}% complete
                  </p>
                </div>
              </div>
            ) : selectedFile ? (
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {selectedFile.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-primary hover:text-primary/80">
                    Replace file
                    <Edit className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200",
                  isDragOver
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-accent/20"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}>
                <div className="space-y-4">
                  <Button
                    onClick={handleFileSelectClick}
                    className="bg-foreground text-background hover:bg-foreground/90">
                    <Upload className="h-4 w-4 mr-2" />
                    Select a file
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    or drag and drop it here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    File • 10 MB max
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={uploadProgress !== null}>
                Cancel
              </Button>
              <Button
                onClick={
                  selectedFile ? handleConfirmUpload : handleFileSelectClick
                }
                disabled={uploadProgress !== null || loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {selectedFile ? "Add file" : "Select file"}
              </Button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
