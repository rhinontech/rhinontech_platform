"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/utils/store";
import {
  deleteConversation,
  getConversations,
  getConversationsById,
  getConversationsByUserId,
  markConversationAsSeen,
  updateConversation,
} from "@/services/chats/chatsService";
import { getVisitorsIpAddressForChats } from "@/services/engage/trafficServices";
import { FileViewerModal } from "@/components/Common/FileViewerModal/FileViewerModal";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { getUsers } from "@/services/teams/teamServices";
import { getSocket } from "@/services/webSocket";
import { getCustomers } from "@/services/crm/entitiesServices";
import { getWhatsAppContacts, getWhatsAppAccounts } from "@/services/settings/whatsappServices";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Import split components
import { ChatSidebar } from "./ChatSidebar";
import { ChatInfoSidebar } from "./ChatInfoSidebar";
import { ChatWindow } from "./ChatWindow";
import { WhatsAppPanel } from "./WhatsAppPanel";
import { X, Info, MessageCircle } from "lucide-react";

export default function Chats() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<"details" | "whatsapp">(
    "details"
  );
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [readOnlyConversation, setReadOnlyConversation] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<any>([]);
  const [visitorId, setVisitorId] = useState("");
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<any>(null);

  // Chat history states
  const [chatHistoryByUser, setChatHistoryByUser] = useState<
    Record<string, any[]>
  >({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentUserHistory, setCurrentUserHistory] = useState<any[]>([]);

  // File modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    url: string;
    name: string;
    type: "image" | "pdf";
  } | null>(null);

  const [location, setLocation] = useState<{
    lat: number;
    lon: number;
    city: string;
    country: string;
    region: string;
  } | null>(null);

  // User store data
  const orgId = useUserStore((state) => state.userData.orgId);
  const userId = useUserStore((state) => state.userData.userId);
  const profilePic = useUserStore((state) => state.userData.profilePic);
  const firstName = useUserStore((state) => state.userData.userFirstName);
  const lastName = useUserStore((state) => state.userData.userLastName);
  const chatbot_id = useUserStore((state) => state.userData.chatbotId);

  const [hasWhatsAppAccounts, setHasWhatsAppAccounts] = useState(false);

  // Check for active WA accounts on mount
  useEffect(() => {
    const checkAccounts = async () => {
      try {
        const accounts = await getWhatsAppAccounts();
        const hasActive = accounts && accounts.some((acc: any) => acc.status === "active");
        setHasWhatsAppAccounts(!!hasActive);
      } catch (e) {
        console.error("Failed to check WA accounts", e);
      }
    };
    checkAccounts();
  }, []);

  // Auto-switch tab if conditions not met
  useEffect(() => {
    if (rightPanelTab === "whatsapp") {
      const hasPhone = !!selectedConversation?.phone_number;
      if (!hasPhone || !hasWhatsAppAccounts) {
        setRightPanelTab("details");
      }
    }
  }, [rightPanelTab, selectedConversation, hasWhatsAppAccounts]);

  // Utility functions
  const groupConversationsByUser = (conversations: any[]) => {
    return conversations.reduce((acc: Record<string, any[]>, conv) => {
      const email = conv.user_id;
      if (!acc[email]) {
        acc[email] = [];
      }
      acc[email].push(conv);
      return acc;
    }, {});
  };

  const sortConversations = (convs: any[]) => {
    return convs.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      const aLast = a.messages?.length
        ? new Date(a.messages[a.messages.length - 1].timestamp).getTime()
        : 0;
      const bLast = b.messages?.length
        ? new Date(b.messages[b.messages.length - 1].timestamp).getTime()
        : 0;

      return bLast - aLast;
    });
  };

  // Fetch conversations on load
  useEffect(() => {
    if (!orgId) return;

    fetchConversations();
    fetchAllUsers();
  }, [orgId]);

  // Fetch IP and location when conversation changes
  useEffect(() => {
    const handleVisitorUpdate = (data: any) => {
      const { visitor } = data;
      if (visitor.visitor_id === selectedConversation?.user_id) {
        setIsOnline(!!visitor.is_online);
        console.log(
          `Updated status for ${visitor.visitor_id}: ${visitor.is_online}`
        );
      }
    };

    const fetchLocationData = async () => {
      if (!selectedConversation) {
        setLocation(null);
        setIsOnline(false);
        return;
      }
      try {
        const response = await getVisitorsIpAddressForChats(
          chatbot_id,
          selectedConversation.user_id
        );
        setIsOnline(!!response.is_online);
        setVisitorId(response.visitor_id);

        // Check if location data is already stored in database
        if (response.latitude && response.longitude) {
          const locationData = {
            lat: response.latitude,
            lon: response.longitude,
            city: response.city || "N/A",
            country: response.country || "N/A",
            region: response.region || "N/A",
          };
          setLocation(locationData);
          return;
        }

        // Fallback to ipapi.co for legacy visitors without stored location
        const ipAddress = response.ip_address;
        if (!ipAddress) {
          setLocation(null);
          return;
        }
        const cached = localStorage.getItem("geoLocations");
        const cache = cached ? JSON.parse(cached) : {};
        if (cache[ipAddress]) {
          setLocation(cache[ipAddress]);
          return;
        }
        const res = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const locationData = {
            lat: data.latitude,
            lon: data.longitude,
            city: data.city,
            country: data.country_name,
            region: data.region,
          };
          setLocation(locationData);
          const updatedCache = { ...cache, [ipAddress]: locationData };
          localStorage.setItem("geoLocations", JSON.stringify(updatedCache));
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
        setIsOnline(false);
        setLocation(null);
      }
    };
    fetchLocationData();

    if (socketRef.current) {
      socketRef.current.on("visitor_update", handleVisitorUpdate);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("visitor_update", handleVisitorUpdate);
      }
    };
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const rawData = await getConversations(chatbot_id);
      const data = Array.isArray(rawData) ? rawData : [];

      const filteredData = data.filter(
        (conv: any) =>
          !conv.assigned_user_id ||
          conv.assigned_user_id.toString() === userId?.toString()
      );

      const groupedByUser = groupConversationsByUser(filteredData);
      const latestConversations: any[] = [];
      const historyByUser: Record<string, any[]> = {};

      Object.entries(groupedByUser).forEach(
        ([userEmail, userConversations]) => {
          const sortedUserConvs = userConversations.sort((a, b) => {
            const aLast = a.messages?.length
              ? new Date(a.messages[a.messages.length - 1].timestamp).getTime()
              : 0;
            const bLast = b.messages?.length
              ? new Date(b.messages[b.messages.length - 1].timestamp).getTime()
              : 0;
            return bLast - aLast;
          });
          latestConversations.push(sortedUserConvs[0]);
          historyByUser[userEmail] = sortedUserConvs;
        }
      );

      const sortedLatestConversations = sortConversations(latestConversations);
      setConversations(sortedLatestConversations);
      setChatHistoryByUser(historyByUser);

      const unreadCount = sortedLatestConversations.filter(
        (c) => c.is_new
      ).length;
      const { setUserData } = useUserStore.getState();
      setUserData({
        newChatCount: unreadCount,
      });

      if (sortedLatestConversations.length > 0) {
        const firstUnpinned = sortedLatestConversations.find(
          (c) => !c.is_pinned
        );
        if (firstUnpinned) {
          setSelectedConversation(firstUnpinned);
          fetchMessages(firstUnpinned);
        } else {
          setSelectedConversation(sortedLatestConversations[0]);
          fetchMessages(sortedLatestConversations[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await getUsers();
      setAvailableUsers(response.data || []);
    } catch (error) {
      console.error("error getting all users");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversation: any) => {
    if (!conversation) return;

    try {
      const [userMsgs, chatbotMsgs] = await Promise.allSettled([
        getConversationsByUserId(
          conversation.chatbot_id,
          conversation.chatbot_history,
          conversation.user_id
        ),
        getConversationsById(
          conversation.chatbot_history,
          conversation.chatbot_id
        ),
      ]);

      const userConversationData =
        userMsgs.status === "fulfilled" ? userMsgs.value : null;
      const userHistory = userConversationData?.messages || [];
      const botHistory =
        chatbotMsgs.status === "fulfilled"
          ? chatbotMsgs.value.history || []
          : [];

      // Update selected conversation with phone number if available from backend
      if (userConversationData?.phone_number) {
        console.log(
          "Enriching conversation with Phone:",
          userConversationData.phone_number
        );
        setSelectedConversation((prev: any) => ({
          ...prev,
          phone_number: userConversationData.phone_number,
        }));
      }

      let mergedMessages: any[] = [];

      if (botHistory.length && userHistory.length) {
        mergedMessages = [
          ...botHistory,
          {
            id: botHistory.length + userHistory.length,
            text: "<hr>",
            role: "separator",
            timestamp: new Date().toISOString(),
          },
          ...userHistory,
        ];
      } else {
        mergedMessages = [...botHistory, ...userHistory];
      }

      setMessages(mergedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const deleteChat = async (conversationId: number) => {
    try {
      await deleteConversation(conversationId);

      setConversations((prev) => {
        const updated = prev.filter((conv) => conv.id !== conversationId);

        if (updated.length === 0) {
          setSelectedConversation(null);
          setMessages([]);
        } else if (
          selectedConversation &&
          selectedConversation.id === conversationId
        ) {
          setSelectedConversation(updated[0]);
          fetchMessages(updated[0]);
        }

        return updated;
      });

      setChatHistoryByUser((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((userEmail) => {
          updated[userEmail] = updated[userEmail].filter(
            (conv) => conv.id !== conversationId
          );
          if (updated[userEmail].length === 0) {
            delete updated[userEmail];
          }
        });
        return updated;
      });
      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Failed to delete chat", error);
      toast.error("Failed to delete chat");
    }
  };

  const updatePinChat = async (conversationId: number, isPinned: boolean) => {
    try {
      const updatedConversation = await updateConversation(conversationId, {
        is_pinned: !isPinned,
      });

      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, is_pinned: updatedConversation.is_pinned }
            : conv
        );
        return sortConversations(updated);
      });

      if (selectedConversation && selectedConversation.id === conversationId) {
        setSelectedConversation((prev: any) => ({
          ...prev,
          is_pinned: updatedConversation.is_pinned,
        }));
      }
      toast.success("Chat pin status updated successfully");
    } catch (error) {
      console.error("Failed to update pinned chat", error);
      toast.error("Failed to update pinned chat");
    }
  };

  const selectConversation = (conv: any) => {
    setReadOnlyConversation(false);
    setSelectedConversation(conv);
    fetchMessages(conv);

    if (conv.is_new) {
      markConversationAsSeen(conv.id);

      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, is_new: false } : c))
      );

      const { userData, setUserData } = useUserStore.getState();
      setUserData({
        newChatCount: Math.max((userData.newChatCount || 1) - 1, 0),
      });
    }
  };

  const handleConversationUpdate = async (
    conversationId: number,
    assignedUserId: number
  ) => {
    try {
      if (readOnlyConversation) {
        console.error("Cannot update read-only conversation");
        return;
      }

      const updated = await updateConversation(conversationId, {
        assigned_user_id: assignedUserId,
      });

      setConversations((prevConversations) => {
        let updatedConversations = prevConversations.map((conv) =>
          conv.id === conversationId
            ? { ...conv, assigned_user_id: assignedUserId }
            : conv
        );

        if (assignedUserId === userId) {
          setSelectedConversation((prev: any) =>
            prev?.id === conversationId
              ? { ...prev, assigned_user_id: userId }
              : prev
          );
        } else {
          updatedConversations = updatedConversations.filter(
            (conv) => conv.id !== conversationId
          );
          setSelectedConversation(updatedConversations[0] || null);
        }

        return updatedConversations;
      });

      return updated;
    } catch (error) {
      console.error("Failed to update conversation:", error);
    }
  };

  const openHistory = () => {
    if (!selectedConversation) return;

    const userEmail = selectedConversation.user_id;
    const userHistory = chatHistoryByUser[userEmail] || [];

    setCurrentUserHistory(userHistory);
    setIsHistoryOpen(true);
  };

  const sendMessage = async (input: string, provider: string) => {
    if (!input.trim() || !selectedConversation) return;

    // Check if this is a WhatsApp trigger
    const isWhatsAppTrigger =
      input === "whatsapp_trigger" && provider === "system";

    const newMessage = {
      user_email: selectedConversation.user_email,
      chatbot_id: selectedConversation.chatbot_id,
      user_id: selectedConversation.user_id,
      role: isWhatsAppTrigger ? "whatsapp_trigger" : "support",
      sender_name: firstName + " " + lastName,
      sender_image: profilePic,
      text: isWhatsAppTrigger ? "whatsapp_trigger" : input,
      chatbot_history: selectedConversation.chatbot_history,
      timestamp: new Date().toISOString(),
    };

    const socket = getSocket();
    socket.emit("message", newMessage);

    setMessages((prev) => [...prev, newMessage]);

    if (!selectedConversation.assigned_user_id) {
      await updateConversation(selectedConversation.id, {
        assigned_user_id: userId,
      });

      setSelectedConversation((prev: any) =>
        prev ? { ...prev, assigned_user_id: userId } : prev
      );
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === selectedConversation.id
            ? { ...conv, assigned_user_id: userId }
            : conv
        )
      );
    }
  };

  // WebSocket handling
  useEffect(() => {
    const socket = getSocket();

    const handleConversation = (newConversation: any) => {
      if (newConversation.chatbot_id !== chatbot_id) return;

      setConversations((prev) => {
        const updated = [
          newConversation,
          ...prev.filter((c) => c.id !== newConversation.id),
        ];
        return sortConversations(updated);
      });
    };

    const handleMessage = (newMessage: any) => {
      const { userData, setUserData } = useUserStore.getState();

      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.chatbot_history === newMessage.chatbot_history) {
            const isCurrent = selectedConversation?.id === c.id;
            const is_new = !isCurrent;

            if (is_new) {
              setUserData({
                newChatCount: (userData.newChatCount || 0) + 1,
              });
            }

            return {
              ...c,
              is_new,
              messages: [...(c.messages || []), newMessage],
            };
          }
          return c;
        });

        return sortConversations(updated);
      });

      if (
        newMessage.chatbot_history === selectedConversation?.chatbot_history &&
        newMessage.chatbot_id === chatbot_id
      ) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const handleWhatsAppMessage = (data: { message: any }) => {
      const whatsappMsg = data.message;
      // We need to map this message to a conversation.
      // The conversation is identified by 'phone_number_id' of the account and user 'from_number' (or 'to_number' if outbound)
      // But wait, our conversations list in Chats.tsx is chatbot conversations.
      // Is there a unified conversation model?
      // In 'fetchConversations', we fetch conversations for 'chatbot_id'.
      // WhatsApp messages might need to be linked to these conversations or create new ones?
      // Looking at 'processIncomingMessage', it creates a 'whatsapp_messages' record, NOT a 'messages' record linked to chatbot_history.
      // It seems WhatsApp conversations are distinct or need to be merged?
      // However, 'getConversations' returns a list.
      // If the user wants "WhatsApp Banner" on the chat list, it implies they appear in this list.

      // ASSUMPTION: The 'getConversations' endpoint returns mixed conversations or we need to fetch WhatsApp contacts separately?
      // Viewing 'getConversations' service...
      // If WhatsApp messages are separate, we might need to handle them differently.
      // But the user said "in the chats list also not showing the banner".
      // Let's assume for now we need to match by phone number.

      const { userData, setUserData } = useUserStore.getState();

      // Find conversation with this user's phone number
      const fromNumber =
        whatsappMsg.direction === "inbound"
          ? whatsappMsg.from_number
          : whatsappMsg.to_number; // The user's phone

      setConversations((prev) => {
        // Check if conversation exists (by checking user_id usually, which might be phone for WA?)
        // Or we might store phone_number in the conversation object specific to WA.
        // Let's try to match by phone_number if available, or fallback to user_id.

        let found = false;
        const updated = prev.map((c) => {
          // Check match. 'user_id' for WA might be the phone number?
          // Or 'phone_number' field?
          const isMatch =
            c.phone_number === fromNumber || c.user_id === fromNumber; // heuristic

          if (isMatch) {
            found = true;
            const isCurrent = selectedConversation?.id === c.id;

            if (!isCurrent) {
              setUserData({ newChatCount: (userData.newChatCount || 0) + 1 });
            }

            // Update conversation
            // Add badge 'has_whatsapp_unread'
            return {
              ...c,
              is_new: !isCurrent,
              has_whatsapp_unread: !isCurrent,
              messages: [
                ...(c.messages || []),
                {
                  text:
                    whatsappMsg.content ||
                    (whatsappMsg.media_url ? "📷 Media" : "Message"),
                  timestamp: whatsappMsg.created_at,
                  role: "user", // UI expects role for styling
                  id: whatsappMsg.id,
                },
              ],
            };
          }
          return c;
        });

        if (found) return sortConversations(updated);

        // If not found, we probably should reload conversations or add a optimistic new one.
        // For now, let's just return updated.
        return updated;
      });

      // If currently selected
      if (
        selectedConversation &&
        (selectedConversation.phone_number === fromNumber ||
          selectedConversation.user_id === fromNumber)
      ) {
        // Add to messages list?
        // 'messages' state in Chats.tsx seems to be mixed?
        // The 'WhatsAppPanel' fetches its own messages via 'getWhatsAppMessages'.
        // 'Chats.tsx' renders 'WhatsAppPanel' if 'rightPanelTab === "whatsapp"'.
        // So 'Chats.tsx' messages state is for the chatbot flow.
        // BUT, to show "New Message" in the sidebar, we just updated the conversation list above.
      }
    };

    socket.on("newConversation", handleConversation);
    socket.on("message", handleMessage);
    socket.on("whatsapp:message:received", handleWhatsAppMessage);

    return () => {
      socket.off("newConversation", handleConversation);
      socket.off("message", handleMessage);
      socket.off("whatsapp:message:received", handleWhatsAppMessage);
    };
  }, [selectedConversation, chatbot_id]);

  const handleOpenFile = (file: {
    url: string;
    name: string;
    type: "image" | "pdf";
  }) => {
    setSelectedFile(file);
    setIsModalOpen(true);
  };

  const getFileType = (fileName: string, fileUrl: string): "image" | "pdf" => {
    const extension = fileName.toLowerCase().split(".").pop();
    if (
      extension &&
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)
    ) {
      return "image";
    }
    if (extension === "pdf" || fileUrl.includes(".pdf")) {
      return "pdf";
    }
    return "image";
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border bg-background">
      <ChatSidebar
        isOpen={leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={selectConversation}
        loading={loading}
      />

      <ChatWindow
        selectedConversation={selectedConversation}
        messages={messages}
        isOnline={isOnline}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
        readOnlyConversation={readOnlyConversation}
        onToggleLeftSidebar={() => setLeftSidebarOpen(true)}
        onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
        onSendMessage={sendMessage}
        onOpenFile={handleOpenFile}
      />

      {rightSidebarOpen && (
        <div
          className={cn(
            "flex flex-col border-l bg-muted/30 transition-all duration-300 ease-in-out",
            rightSidebarOpen ? "w-96" : "w-0 overflow-hidden"
          )}>
          {selectedConversation && (
            <>
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b h-[60px] px-3">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setRightPanelTab("details")}
                    className={cn(
                      "p-2 rounded-md transition-all",
                      rightPanelTab === "details"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}>
                    <Info className="h-4 w-4" />
                  </button>
                  {selectedConversation?.phone_number && hasWhatsAppAccounts && (
                    <button
                      onClick={() => setRightPanelTab("whatsapp")}
                      className={cn(
                        "p-2 rounded-md transition-all",
                        rightPanelTab === "whatsapp"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}>
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightSidebarOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {rightPanelTab === "details" ? (
                  <ChatInfoSidebar
                    isOpen={true}
                    onClose={() => setRightSidebarOpen(false)}
                    selectedConversation={selectedConversation}
                    isOnline={isOnline}
                    visitorId={visitorId}
                    location={location}
                    availableUsers={availableUsers}
                    messages={messages}
                    chatHistoryCount={
                      (chatHistoryByUser[selectedConversation?.user_id]
                        ?.length || 1) - 1
                    }
                    onPinChat={updatePinChat}
                    onDeleteChat={deleteChat}
                    onOpenHistory={openHistory}
                    onUpdateConversation={handleConversationUpdate}
                    onOpenFile={handleOpenFile}
                    hideHeader={true}
                  />
                ) : (
                  <WhatsAppPanel
                    selectedConversation={selectedConversation}
                    isOnline={isOnline}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}

      {selectedFile && (
        <FileViewerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          fileUrl={selectedFile.url}
          fileName={selectedFile.name}
          fileType={selectedFile.type}
        />
      )}

      {/* Chat History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogOverlay className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />
        <DialogContent className="fixed left-1/2 top-1/2 z-[110] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-6 shadow-lg">
          {(() => {
            const [viewConv, setViewConv] = useState<any>(null);

            if (viewConv) {
              return (
                <div>
                  <DialogHeader>
                    <DialogTitle>
                      Conversation - {selectedConversation?.user_email}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="my-4 max-h-[300px] overflow-y-auto space-y-4">
                    {viewConv.messages?.length > 0 ? (
                      viewConv.messages.map((msg: any, idx: number) => {
                        const isUser = msg.role === "user";

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex",
                              isUser ? "justify-start" : "justify-end"
                            )}>
                            <div
                              className={cn(
                                "max-w-[70%] rounded-lg px-3 py-2",
                                isUser
                                  ? "bg-muted text-foreground"
                                  : "bg-primary text-primary-foreground"
                              )}>
                              <div className="text-sm">
                                {/<a\s+href=.*<\/a>/i.test(msg.text) ? (
                                  (() => {
                                    const match = msg.text.match(
                                      /href="([^"]+)".*>(.*?)<\/a>/i
                                    );
                                    const fileUrl = match ? match[1] : "";
                                    const fileName = match
                                      ? match[2]
                                      : "Download file";
                                    const isImage =
                                      /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                        fileName
                                      );

                                    return isImage ? (
                                      <div
                                        onClick={() => {
                                          setSelectedFile({
                                            url: fileUrl,
                                            name: fileName,
                                            type: getFileType(
                                              fileName,
                                              fileUrl
                                            ),
                                          });
                                          setIsHistoryOpen(false);
                                          setIsModalOpen(true);
                                        }}
                                        className="cursor-pointer block max-w-xs rounded-lg overflow-hidden border shadow-sm hover:opacity-90">
                                        <img
                                          src={fileUrl}
                                          alt={fileName}
                                          className="w-full h-auto"
                                        />
                                        <p className="text-xs text-gray-600 text-center truncate p-1 bg-gray-50">
                                          {fileName}
                                        </p>
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => {
                                          setSelectedFile({
                                            url: fileUrl,
                                            name: fileName,
                                            type: getFileType(
                                              fileName,
                                              fileUrl
                                            ),
                                          });
                                          setIsHistoryOpen(false);
                                          setIsModalOpen(true);
                                        }}
                                        className="cursor-pointer flex items-center gap-2 p-2 border rounded-lg bg-white shadow-sm hover:bg-gray-50">
                                        📎
                                        <div className="flex-1 truncate">
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {fileName}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <p className="text-sm">{msg.text}</p>
                                )}
                              </div>
                              <p
                                className={cn(
                                  "mt-1 text-xs",
                                  isUser
                                    ? "text-muted-foreground"
                                    : "text-primary-foreground/70"
                                )}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-muted-foreground">
                        No messages
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setViewConv(null)}
                      className="mr-2">
                      Back
                    </Button>
                  </DialogFooter>
                </div>
              );
            }

            if (currentUserHistory.length > 1) {
              return (
                <div>
                  <DialogHeader>
                    <DialogTitle>
                      Chat History - {selectedConversation?.user_email}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {currentUserHistory.slice(1).map((conv, index) => (
                      <div
                        key={conv.id}
                        className="p-3 rounded-md border cursor-pointer hover:bg-accent"
                        onClick={() => setViewConv(conv)}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">
                              Conversation{" "}
                              {currentUserHistory.length - index - 1}
                            </p>
                            <p className="text-sm font-medium text-muted-foreground mt-1">
                              {conv.user_email} →{" "}
                              {availableUsers.find(
                                (user: any) =>
                                  user.user_id === conv.assigned_user_id
                              )?.email || "Unassigned"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {conv.messages?.length > 0 ? (
                                <>
                                  Last message:{" "}
                                  {new Date(
                                    conv.messages[
                                      conv.messages.length - 1
                                    ]?.timestamp
                                  ).toLocaleString()}
                                </>
                              ) : (
                                "No messages"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsHistoryOpen(false)}
                      className="mr-2 mt-2">
                      Back
                    </Button>
                  </DialogFooter>
                </div>
              );
            } else {
              return (
                <div className="text-center py-8">
                  <DialogHeader>
                    <DialogTitle>
                      Chat History - {selectedConversation?.user_email}
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    No past conversations found for{" "}
                    {selectedConversation?.user_email}
                  </p>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsHistoryOpen(false)}
                      className="mr-2">
                      Back
                    </Button>
                  </DialogFooter>
                </div>
              );
            }
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
