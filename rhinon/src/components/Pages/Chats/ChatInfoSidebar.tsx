"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { X, History, Trash2, MapPin, Phone, PhoneOff } from "lucide-react";
import { TbPin, TbPinnedOff } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { RightSidebarSkeleton } from "@/components/Common/Skeleton/Skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { io } from "socket.io-client";
import { useUserStore } from "@/utils/store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCallContext } from "@/context/CallContext";

interface ChatInfoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedConversation: any;
  isOnline: boolean;
  visitorId: string;
  location: {
    lat: number;
    lon: number;
    city: string;
    country: string;
    region: string;
  } | null;
  availableUsers: any[];
  messages: any[];
  chatHistoryCount: number;
  onPinChat: (conversationId: number, isPinned: boolean) => void;
  onDeleteChat: (conversationId: number) => void;
  onOpenHistory: () => void;
  onUpdateConversation: (
    conversationId: number,
    assignedUserId: number
  ) => void;
  onOpenFile: (file: {
    url: string;
    name: string;
    type: "image" | "pdf";
  }) => void;
  hideHeader?: boolean;
}

export function ChatInfoSidebar({
  isOpen,
  onClose,
  selectedConversation,
  isOnline,
  visitorId,
  hideHeader = false,
  location,
  availableUsers,
  messages,
  chatHistoryCount,
  onPinChat,
  onDeleteChat,
  onOpenHistory,
  onUpdateConversation,
  onOpenFile,
}: ChatInfoSidebarProps) {
  const { startCall, isInCall } = useCallContext();
  const [isViewAll, setIsViewAll] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  // ========== HELPERS ==========
  const getFileType = (fileName: string, fileUrl: string): "image" | "pdf" => {
    const ext = fileName.toLowerCase().split(".").pop();
    if (ext && ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
      return "image";
    if (ext === "pdf" || fileUrl.includes(".pdf")) return "pdf";
    return "image";
  };

  const getSharedMedia = () =>
    messages
      .map((msg) => {
        const text = msg?.text ?? "";
        if (typeof text !== "string" || !text.includes("href=")) return null;
        const match = text.match(/href="([^"]+)".*>(.*?)<\/a>/i);
        if (!match) return null;
        const fileUrl = match[1];
        const fileName = match[2];
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
        return { url: fileUrl, name: fileName, isImage };
      })
      .filter(Boolean);

  // ========== UI ==========
  const handleStartCall = () => {
    if (!visitorId) return toast.error("No visitor selected");
    startCall(visitorId);
  };

  const renderContent = () => (
    <>

      <div className="text-center">
        <Avatar className="h-20 w-20 mx-auto mb-3">
          <AvatarImage
            src={selectedConversation?.avatar || "/placeholder.svg"}
          />
          <AvatarFallback className="text-lg">
            {selectedConversation?.user_email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-lg">
          {selectedConversation?.user_email}
        </h3>
        <p className="text-sm text-muted-foreground">
          {selectedConversation?.messages?.length > 0 &&
            new Date(
              selectedConversation.messages[
                selectedConversation.messages.length - 1
              ]?.timestamp
            ).toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>

      <Separator />

      {/* Quick Actions */}
      <div className="space-y-2 p-4">
        <h4 className="font-medium text-sm">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          {/* 📞 Call Button */}
          <Button
            variant="outline"
            size="sm"
            className="justify-start text-green-600 border-green-400 hover:bg-green-50"
            onClick={handleStartCall}
            disabled={isInCall || !isOnline}>
            <Phone className="h-4 w-4 mr-2" /> Call
          </Button>

          {/* Pin Chat */}
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() =>
              onPinChat(
                selectedConversation?.id,
                selectedConversation?.is_pinned
              )
            }>
            {selectedConversation?.is_pinned ? (
              <>
                <TbPinnedOff className="h-4 w-4 mr-2" /> Unpin Chat
              </>
            ) : (
              <>
                <TbPin className="h-4 w-4 mr-2" /> Pin Chat
              </>
            )}
          </Button>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">Assignee</Label>
          <Select
            value={selectedConversation?.assigned_user_id?.toString() || ""}
            onValueChange={(value) =>
              onUpdateConversation(selectedConversation?.id, parseInt(value))
            }>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Assign to..." />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((user: any) => (
                <SelectItem key={user.id} value={user.user_id.toString()}>
                  {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Chat Settings */}
      <div className="space-y-3 p-4">
        <h4 className="font-medium text-sm">Chat Settings</h4>
        <Button
          variant="ghost"
          className="w-full justify-start"
          size="sm"
          onClick={onOpenHistory}>
          <History className="h-4 w-4 mr-2" /> Chat History ({chatHistoryCount})
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive"
          onClick={() => {
            setOpenDeleteConfirm(true);
          }}
          size="sm"
          disabled={!selectedConversation}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete Chat
        </Button>
      </div>

      <Separator />

      {/* Location */}
      <div className="space-y-3 p-2">
        {location ? (
          <>
            <div className="h-64 w-full rounded-lg overflow-hidden">
              <iframe
                src={`https://www.google.com/maps?q=${location.lat},${location.lon}&z=8&output=embed`}
                className="w-full h-full border-0"
                allowFullScreen={false}
                loading="lazy"></iframe>
            </div>
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>
                {location.city || "N/A"}, {location.region || "N/A"},{" "}
                {location.country || "N/A"}
              </span>
            </div>
          </>
        ) : (
          <div className="h-64 w-full flex items-center justify-center rounded-lg bg-muted text-muted-foreground">
            Location not available
          </div>
        )}
      </div>

      <Separator />

      {/* Shared Media */}
      <div className="space-y-3 p-4">
        <h4 className="font-medium text-sm">Shared Media</h4>
        <div className="grid grid-cols-3 gap-2">
          {getSharedMedia()
            .slice(0, !isViewAll ? 6 : undefined)
            .map((file: any, i) =>
              file.isImage ? (
                <div
                  key={i}
                  onClick={() =>
                    onOpenFile({
                      url: file.url,
                      name: file.name,
                      type: getFileType(file.name, file.url),
                    })
                  }
                  className="aspect-square rounded-md border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  key={i}
                  onClick={() =>
                    onOpenFile({
                      url: file.url,
                      name: file.name,
                      type: getFileType(file.name, file.url),
                    })
                  }
                  className="cursor-pointer flex flex-col items-center justify-center aspect-square rounded-md border bg-white p-2 text-center hover:bg-gray-50">
                  <span className="text-2xl">📎</span>
                  <p className="text-xs truncate w-full">{file.name}</p>
                </div>
              )
            )}

          {getSharedMedia().length === 0 && (
            <p className="text-xs text-muted-foreground col-span-3">
              No media shared yet.
            </p>
          )}
        </div>

        {getSharedMedia().length > 6 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsViewAll(!isViewAll)}>
            {isViewAll ? "View Few Media" : "View All Media"}
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
        <DialogContent className="z-1000 max-w-xl">
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenDeleteConfirm(false)}>
              No
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteChat(selectedConversation?.id);
                setOpenDeleteConfirm(false);
              }}>
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // When hideHeader is true, render just the content in a ScrollArea (used when embedded in tabs)
  if (hideHeader) {
    if (!selectedConversation) {
      return (
        <div className="p-6">
          <RightSidebarSkeleton />
        </div>
      );
    }
    return (
      <ScrollArea className="flex-1 h-full p-4 space-y-6">
        {renderContent()}
      </ScrollArea>
    );
  }

  // Default: render with full wrapper and header
  return (
    <div
      className={cn(
        "flex flex-col border-l bg-muted/30 transition-all duration-300 ease-in-out",
        isOpen ? "w-96" : "w-0 overflow-hidden"
      )}>
      {isOpen && selectedConversation ? (
        <>
          <div className="flex items-center justify-between border-b h-[60px] p-4">
            <h2 className="text-lg font-semibold">Chat Info</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 h-0 p-4 space-y-6">
            {renderContent()}
          </ScrollArea>
        </>
      ) : (
        <div className="p-6 mr-6">
          <RightSidebarSkeleton />
        </div>
      )}
    </div>
  );
}
