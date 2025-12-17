"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  MoreHorizontal,
  GripVertical,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
export interface Topic {
  folder_id: string;
  name: string;
  description?: string;
  articles: any[];
  created_at: string;
  updated_at: string;
  isExpanded?: boolean;
}

interface TopicRowProps {
  id: string;
  topic: Topic;
  onToggleExpansion: (id: string) => void;
  onAddArticle: (topicId: string) => void;
  onEditTopic: (topic: Topic) => void;
  onDeleteTopic: (id: string) => void;
  filteredCount?: number;
  children?: React.ReactNode;
}

export function TopicRow({
  id,
  topic,
  onToggleExpansion,
  onAddArticle,
  onEditTopic,
  onDeleteTopic,
  children,
  filteredCount,
}: TopicRowProps) {
  const [isHovered, setIsHovered] = useState(false);
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

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded-md transition-colors",
          "border-l-2 border-transparent",
          isDragging && "opacity-50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onToggleExpansion(topic.folder_id)}>
        <div className="flex items-center gap-1">
          <div {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {topic.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <Folder className="h-4 w-4 text-blue-600" />
        </div>

        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="font-medium truncate max-w-2xl">{topic.name}</span>
            <span className="text-sm text-muted-foreground">
              {filteredCount ?? topic.articles.length}{" "}
              {(filteredCount ?? topic.articles.length) === 1
                ? "article"
                : "articles"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {isHovered && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onAddArticle(topic.folder_id)}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onEditTopic(topic);
                  }}>
                  Edit topic
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onAddArticle(topic.folder_id);
                  }}>
                  Add article
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
                      Delete topic
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the topic.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={(e) => {
                          e.preventDefault();
                          onDeleteTopic(topic.folder_id);
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
        </div>
      </div>

      {topic.isExpanded && children}
    </>
  );
}
