"use client"

import { Button } from "@/components/ui/button"
import { Download, Trash2, Loader2, ExternalLink } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface FileListProps {
  files: any[]
  loading: boolean
  onDeleteSuccess: () => void
  viewMode: "list" | "grid"
}

export function FileList({ files, loading, onDeleteSuccess, viewMode }: FileListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDelete = async (key: string) => {
    try {
      setDeleting(key)
      const response = await fetch("/api/s3/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      })

      if (!response.ok) throw new Error("Delete failed")

      toast({
        title: "Success",
        description: "File deleted successfully",
      })
      onDeleteSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = async (key: string) => {
    try {
      const response = await fetch("/api/s3/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      })

      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = key.split("/").pop() || "download"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const handleOpenInNewTab = async (key: string) => {
    try {
      const response = await fetch("/api/s3/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      })

      if (!response.ok) throw new Error("Failed to generate URL")

      const { url } = await response.json()
      window.open(url, "_blank")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open file",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading files...</div>
  }

  if (files.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No files yet. Upload one to get started!</div>
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <div key={file.Key} className="border rounded-lg p-4 hover:shadow-lg transition-shadow flex flex-col">
            <button
              onClick={() => handleOpenInNewTab(file.Key)}
              className="flex-1 text-left mb-3 hover:text-primary transition-colors cursor-pointer"
            >
              <p className="font-medium text-sm truncate" title={file.Key.split("/").pop()}>
                {file.Key.split("/").pop()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{(file.Size / 1024).toFixed(2)} KB</p>
              <p className="text-xs text-muted-foreground">{new Date(file.LastModified).toLocaleDateString()}</p>
            </button>
            <div className="flex gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => handleOpenInNewTab(file.Key)}
                title="Open in new tab"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => handleDownload(file.Key)}
                title="Download"
              >
                <Download className="w-3 h-3" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => handleDelete(file.Key)}
                disabled={deleting === file.Key}
                title="Delete"
              >
                {deleting === file.Key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.Key}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <button
            onClick={() => handleOpenInNewTab(file.Key)}
            className="flex-1 min-w-0 text-left hover:text-primary transition-colors cursor-pointer"
          >
            <p className="font-medium truncate">{file.Key.split("/").pop()}</p>
            <p className="text-sm text-muted-foreground">
              {(file.Size / 1024).toFixed(2)} KB • {new Date(file.LastModified).toLocaleDateString()}
            </p>
          </button>
          <div className="flex gap-2 ml-4">
            <Button variant="outline" size="sm" onClick={() => handleOpenInNewTab(file.Key)} title="Open in new tab">
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload(file.Key)}>
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(file.Key)}
              disabled={deleting === file.Key}
            >
              {deleting === file.Key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
