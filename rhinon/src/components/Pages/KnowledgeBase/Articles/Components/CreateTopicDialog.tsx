"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
interface CreateTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTopic: (name: string, description?: string, topicId?: string) => void;
  initialName?: string;
  initialDescription?: string;
  topicId?: string; // optional, if editing
}

export function CreateTopicDialog({
  open,
  onOpenChange,
  onCreateTopic,
  initialName = "",
  initialDescription = "",
  topicId,
}: CreateTopicDialogProps) {
  const [name, setName] = useState(initialName || "");
  const [description, setDescription] = useState(initialDescription || "");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setName(initialName || "");
      setDescription(initialDescription || "");
    }
  }, [open, initialName, initialDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateTopic(name.trim(), description.trim() || undefined, topicId);
      setName("");
      setDescription("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {topicId ? "Edit Topic" : "Create New Topic"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic-name">Topic Name</Label>
            <Input
              id="topic-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter topic name..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-description">Description (Optional)</Label>
            <Textarea
              id="topic-description"
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setDescription(e.target.value);
                }
              }}
              placeholder="Enter topic description..."
              rows={3}
              className="h-24 resize-none overflow-y-auto"
            />

            <p className="text-sm text-gray-500 mt-1">
              {description.length}/200 characters
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {topicId ? "Update Topic" : "Create Topic"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
