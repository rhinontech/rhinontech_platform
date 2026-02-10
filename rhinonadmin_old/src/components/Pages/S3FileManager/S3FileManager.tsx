"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cloud, AlertCircle, Grid3x3, List } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUpload } from "./file-upload";
import { FileList } from "./file-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export function S3FileManager() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/s3/list");
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadSuccess = () => {
    fetchFiles();
  };

  const handleDeleteSuccess = () => {
    fetchFiles();
  };

  return (
    <div className="flex h-[calc(100vh-4.5rem)] w-full overflow-hidden rounded-lg border-2 bg-background">
      {/* Main Content */}
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 h-[60px] px-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">S3 File Manager</h2>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-0 p-6">
          <div className="mb-8 flex justify-between">
            <div className="flex items-center gap-5">
              <p className="text-muted-foreground">
                Upload, manage, and organize your files in AWS S3
              </p>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div>
                <CardTitle className="text-lg">Your Files</CardTitle>
                <CardDescription>
                  {files.length} file(s) in folder
                </CardDescription>
              </div>
              <div>
                <FileList
                  files={files}
                  loading={loading}
                  onDeleteSuccess={handleDeleteSuccess}
                  viewMode={viewMode}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
