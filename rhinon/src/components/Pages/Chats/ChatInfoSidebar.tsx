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
  const userEmail = useUserStore((state) => state.userData.userEmail);
  const [isViewAll, setIsViewAll] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState("00:00");

  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const socketRef = useRef<any>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<any[]>([]);

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  // ========== SOCKET INITIALIZATION ==========
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      if (userEmail) {
        socket.emit("register_manual", {
          callId: userEmail,
          username: "Agent",
        });
        console.log(`🎧 Auto-registered as Caller: ${userEmail}`);
      }
    });

    socket.on("registered_manual", ({ callId }) => {
      console.log("Registered manual:", callId);
    });

    socket.on("call_accepted_manual", async ({ from }) => {
      console.log("Call accepted:", from);
      setIsCalling(false);
      startPeerConnection(from, true);
    });

    socket.on("call_rejected_manual", () => {
      console.log("Call rejected by receiver");
      setIsCalling(false);
      toast.info("Call was rejected by the receiver.");
    });

    socket.on("offer_manual", async ({ offer, from }) => {
      console.log("Offer received:", from);
      startPeerConnection(from, false, offer);
    });

    socket.on("answer_manual", async ({ answer }) => {
      if (peerRef.current)
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
    });

    socket.on("ice_candidate_manual", ({ candidate }) => {
      if (!candidate || !peerRef.current) return;

      const ice = new RTCIceCandidate(candidate);
      if (!peerRef.current.remoteDescription) {
        pendingCandidatesRef.current.push(ice);
        console.log("Queued ICE candidate");
      } else {
        peerRef.current.addIceCandidate(ice).catch(console.error);
      }
    });

    socket.on("call_ended_manual", () => {
      console.log("Remote ended call");
      endCall();
    });

    return () => {
      socket.disconnect();
      console.log("Socket disconnected");
    };
  }, [userEmail]);

  // ========== CALL TIMER ==========
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall && callStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const s = String(elapsed % 60).padStart(2, "0");
        setCallDuration(`${m}:${s}`);
      }, 1000);
    } else {
      setCallDuration("00:00");
    }
    return () => clearInterval(interval);
  }, [isInCall, callStartTime]);

  // ========== CALL HANDLERS ==========

  const handleStartCall = async () => {
    if (!visitorId) return alert("No visitor selected");
    if (!socketRef.current) return alert("Socket not ready");

    console.log(`📞 Preparing to call visitor ${visitorId}`);

    // Step 1: Ask for microphone access first
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      // immediately stop temporary stream (we’ll recreate later)
      testStream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.error("Mic permission denied:", err);
      toast.error("Please allow microphone access to start the call.");
      return;
    }

    // Step 2: Proceed with original logic
    console.log(`Calling visitor ${visitorId}`);

    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsInCall(false);
    setCallStartTime(null);
    setCallDuration("00:00");

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    setIsCalling(true);
    socketRef.current.emit("call_user_manual", { targetCallId: visitorId });
  };

  const startPeerConnection = async (
    remoteSocketId: string,
    isCaller: boolean,
    remoteOffer?: RTCSessionDescriptionInit
  ) => {
    const socket = socketRef.current;
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:3.109.172.202:3478",
            "turn:3.109.172.202:3478?transport=udp",
            "turn:3.109.172.202:3478?transport=tcp",
          ],
          username: "rhinon",
          credential: "rtWebRtc@123",
        },
      ],
    });

    peerRef.current = peer;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    stream.getTracks().forEach((t) => peer.addTrack(t, stream));

    peer.ontrack = (e) => {
      if (remoteAudioRef.current)
        remoteAudioRef.current.srcObject = e.streams[0];
    };

    peer.onicecandidate = (e) => {
      if (e.candidate)
        socket.emit("ice_candidate_manual", {
          candidate: e.candidate,
          to: remoteSocketId,
        });
    };

    if (isCaller) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("offer_manual", { offer, to: remoteSocketId });
    } else if (remoteOffer) {
      await peer.setRemoteDescription(new RTCSessionDescription(remoteOffer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer_manual", { answer, to: remoteSocketId });
      for (const c of pendingCandidatesRef.current) {
        await peer.addIceCandidate(c);
      }
      pendingCandidatesRef.current = [];
    }

    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsInCall(true);
    setCallStartTime(Date.now());
  };

  const endCall = () => {
    console.log("Ending call...");

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.muted = false; // reset speaker
    }

    if (socketRef.current) {
      socketRef.current.emit("end_call_manual");
    }

    setIsCalling(false);
    setIsInCall(false);
    setIsMuted(false);
    setIsSpeakerOn(true);
    setCallStartTime(null);
    setCallDuration("00:00");
    console.log("Call ended and media reset");
  };

  // ========== MEDIA HELPERS ==========
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
  // When hideHeader is true, we render without the outer wrapper (used when embedded in tabs)

  // ========== CALL TIMEOUT HANDLER ==========
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isCalling) {
      timeout = setTimeout(() => {
        console.log("Call timeout - no answer");
        toast.error("No answer from user.");
        endCall();
      }, 30000); // 30 seconds
    }
    return () => clearTimeout(timeout);
  }, [isCalling]);

  // Shared content for both modes
  const renderContent = () => (
    <>
      {/* Active Call Info */}
      {isInCall && (
        <div className="p-3 border rounded-md bg-green-50 text-center shadow-sm mb-2">
          <h4 className="font-semibold text-green-800 mb-1">🎧 In Call</h4>
          <p className="text-sm text-green-700 mb-2">
            Duration: {callDuration}
          </p>

          <div className="flex justify-center gap-2 mb-2">
            <Button
              onClick={() => {
                if (localStreamRef.current) {
                  localStreamRef.current.getAudioTracks().forEach((t) => {
                    t.enabled = !t.enabled;
                  });
                  setIsMuted((prev) => !prev);
                }
              }}
              variant="outline"
              className={cn(
                "flex-1",
                isMuted
                  ? "border-red-400 text-red-600"
                  : "border-green-400 text-green-700"
              )}>
              {isMuted ? "🔇 Unmute" : "🎤 Mute"}
            </Button>

            <Button
              onClick={() => {
                setIsSpeakerOn((prev) => {
                  const newVal = !prev;
                  if (remoteAudioRef.current)
                    remoteAudioRef.current.muted = !newVal;
                  return newVal;
                });
              }}
              variant="outline"
              className={cn(
                "flex-1",
                isSpeakerOn
                  ? "border-green-400 text-green-700"
                  : "border-gray-400 text-gray-600"
              )}>
              {isSpeakerOn ? "🔊 Speaker On" : "🔈 Speaker Off"}
            </Button>
          </div>

          <Button
            onClick={endCall}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1 w-full">
            <PhoneOff className="h-4 w-4" /> End Call
          </Button>
        </div>
      )}

      <audio ref={remoteAudioRef} autoPlay />

      {isCalling && (
        <div className="p-3 border rounded-md bg-yellow-50 text-center shadow-sm mb-2">
          <h4 className="font-semibold text-yellow-800 mb-1">📞 Calling...</h4>
          <p className="text-sm text-yellow-700 mb-3">
            Waiting for receiver to accept.
          </p>
          <Button
            onClick={() => {
              if (socketRef.current) socketRef.current.emit("end_call_manual");
              setIsCalling(false);
              console.log("Call cancelled before answer");
            }}
            className="bg-red-600 hover:bg-red-700 text-white w-full flex items-center justify-center gap-1">
            <PhoneOff className="h-4 w-4" /> Cancel Call
          </Button>
        </div>
      )}

      {/* -------- Existing Original UI -------- */}
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
