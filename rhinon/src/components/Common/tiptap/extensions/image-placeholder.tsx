"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
  isValidUrl,
} from "@/lib/tiptap-utils";
import {
  type CommandProps,
  Node,
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from "@tiptap/react";
import { Image, Link, Upload, Loader2, X } from "lucide-react";
import { type FormEvent, useState, useEffect } from "react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { cn } from "@/lib/utils";

export interface ImagePlaceholderOptions {
  HTMLAttributes: Record<string, any>;
  onUpload?: (url: string) => void;
  onError?: (error: string) => void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imagePlaceholder: {
      /**
       * Inserts an image placeholder
       */
      insertImagePlaceholder: () => ReturnType;
    };
  }
}

export const ImagePlaceholder = Node.create<ImagePlaceholderOptions>({
  name: "image-placeholder",
  group: "block",
  inline: false,

  addOptions() {
    return {
      HTMLAttributes: {},
      onUpload: () => {},
      onError: () => {},
    };
  },

  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      { class: "tiptap-image-block" },
      [
        "img",
        mergeAttributes(HTMLAttributes, {
          style: "display:block;max-width:100%;margin:0 auto;",
        }),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImagePlaceholderComponent, {
      className: NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
    });
  },

  addCommands() {
    return {
      insertImagePlaceholder: () => (props: CommandProps) => {
        return props.commands.insertContent({
          type: "image-placeholder",
        });
      },
    };
  },
});

function ImagePlaceholderComponent(props: NodeViewProps) {
  const { editor, extension, selected, deleteNode } = props;
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const {
    previewUrl,
    fileInputRef,
    handleFileChange,
    handleRemove,
    uploading,
    error,
  } = useImageUpload({
    onUpload: (imageUrl) => {
      editor
        .chain()
        .focus()
        .setImage({
          src: imageUrl,
          alt: altText || fileInputRef.current?.files?.[0]?.name,
        })
        .run();

      // Clean up and close
      handleRemove();
      setAltText("");
      deleteNode();
    },
  });

  // Auto-expand when inserted
  useEffect(() => {
    setIsExpanded(true);
  }, []);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileChange({ target: input } as any);
      }
    }
  };

  const handleInsertEmbed = (e: FormEvent) => {
    e.preventDefault();
    const valid = isValidUrl(url);
    if (!valid) {
      setUrlError(true);
      return;
    }
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: altText }).run();
      setUrl("");
      setAltText("");
      deleteNode();
    }
  };

  const handleClose = () => {
    handleRemove();
    setUrl("");
    setAltText("");
    deleteNode();
  };

  const handleUploadClick = () => {
    if (previewUrl && !uploading) {
      // Trigger the actual upload
      const form = new FormData();
      if (fileInputRef.current?.files?.[0]) {
        form.append("file", fileInputRef.current.files[0]);
        // Your upload logic here - the useImageUpload hook should handle this
        // For now, we'll assume the hook handles the upload automatically
      }
    }
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <NodeViewWrapper className="w-full my-4">
      <div className="relative">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add Image</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v: any) => setActiveTab(v)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" disabled={uploading}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" disabled={uploading}>
                <Link className="mr-2 h-4 w-4" />
                URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                  "my-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                  isDragActive && "border-primary bg-primary/10",
                  error && "border-destructive bg-destructive/10"
                )}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mx-auto max-h-[200px] rounded-lg object-cover"
                    />
                    <div className="space-y-2">
                      <Input
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        placeholder="Alt text (optional)"
                        disabled={uploading}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={handleRemove}
                          disabled={uploading}
                        >
                          Remove
                        </Button>
                        <Button
                          onClick={handleUploadClick}
                          disabled={uploading}
                        >
                          {uploading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {uploading ? "Uploading..." : "Upload"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="image-upload"
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-4",
                        uploading && "pointer-events-none opacity-50"
                      )}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          SVG, PNG, JPG or GIF
                        </p>
                      </div>
                    </label>
                  </>
                )}
                {error && (
                  <p className="mt-2 text-sm text-destructive">{error}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="url">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (urlError) setUrlError(false);
                    }}
                    placeholder="Enter image URL..."
                    disabled={uploading}
                  />
                  {urlError && (
                    <p className="text-xs text-destructive">
                      Please enter a valid URL
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Alt text (optional)"
                    disabled={uploading}
                  />
                </div>
                <Button
                  onClick={handleInsertEmbed}
                  className="w-full"
                  disabled={!url || uploading}
                >
                  Add Image
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
