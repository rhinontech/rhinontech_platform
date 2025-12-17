"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Italic,
  Underline,
  Link2,
  Paperclip,
  Send,
  X,
} from "lucide-react";

interface ReplyComposerProps {
  recipientEmail: string;
  senderEmail: string;
  onSend?: (content: string) => void;
  onClose?: () => void;
}

export const ReplyComposer = ({
  recipientEmail,
  senderEmail,
  onSend,
  onClose,
}: ReplyComposerProps) => {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) return;

    setIsSending(true);
    try {
      // Call the onSend callback if provided
      if (onSend) {
        await onSend(content);
      }
      setContent("");
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border-t bg-background p-4 space-y-3">
      {/* Header with close button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Reply</h3>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* From and To fields */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium">From:</span>
          <span className="text-foreground">{senderEmail}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium">To:</span>
          <span className="text-foreground">{recipientEmail}</span>
        </div>
      </div>

      {/* Textarea */}
      <Textarea
        placeholder="Write your reply..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-32 resize-none"
      />

      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-md">
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Link">
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2">
        {onClose && (
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          size="sm"
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {isSending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
};
