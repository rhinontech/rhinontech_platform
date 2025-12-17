"use client";

import {
  FileText,
  ExternalLink,
  MoreHorizontal,
  GripVertical,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface Article {
  articleId: string;
  title: string;
  content: string;
  topicId?: string;
  status: "published" | "draft";
  views: number;
  likes: number;
  dislikes: number;
  createdAt: string;
  updatedAt: string;
}

interface ArticleRowProps {
  id: string;
  article: Article;
  onEdit: () => void;
  onView: () => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: "published" | "draft") => void;
}

export function ArticleRow({
  id,
  article,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
}: ArticleRowProps) {
  const [openConfirmationDialog, setOpenConfirmationDialog] =
    useState<boolean>(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-4 py-3 px-2 ml-8 hover:bg-muted/30 rounded-md transition-colors",
        "border-l-2 border-transparent hover:border-primary/20",
        isDragging && "opacity-50"
      )}>
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
        </div>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-1 flex gap-10 pr-10 items-center">
        {/* Title */}
        <div className="flex flex-1 items-center gap-2">
          {/* <span className="font-medium truncate">{article.title}</span> */}
          <div className="flex items-center gap-2 group">
            <span className="font-medium truncate max-w-2xl">
              {article.title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onView}>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Status */}
        <div>
          <Badge
            variant={article.status === "published" ? "default" : "secondary"}
            className={cn(
              article.status === "published"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
            )}>
            {article.status === "published" ? "Published" : "Draft"}
          </Badge>
        </div>

        {/* Last updated */}
        <div className="text-sm text-muted-foreground">
          {formatDate(article.updatedAt)}
        </div>

        {/* Performance */}
        {/* <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{article.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            <span>{article.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="h-3 w-3" />
            <span>{article.dislikes}</span>
          </div>
        </div> */}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            Edit article
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              onStatusChange(
                article.articleId,
                article.status === "published" ? "draft" : "published"
              )
            }>
            {article.status === "published" ? "Unpublish" : "Publish"}
          </DropdownMenuItem>
          <AlertDialog
            open={openConfirmationDialog}
            onOpenChange={setOpenConfirmationDialog}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault(); // prevent default behavior
                }}
                className="text-destructive">
                Delete article
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  topic.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    onDelete(article.articleId);
                    setOpenConfirmationDialog(false);
                  }}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
