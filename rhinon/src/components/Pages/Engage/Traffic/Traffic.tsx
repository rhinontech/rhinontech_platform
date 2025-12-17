"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft, Plus, ChevronDown, Edit } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useEffect, useRef, useState } from "react";
import {
  createConversation,
  getAllLiveVisitors,
} from "@/services/engage/trafficServices";
import { Button } from "@/components/ui/button";
import { io } from "socket.io-client";
import { useUserStore } from "@/utils/store";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Loading from "@/app/loading";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { websitetraffic } from "../../../../../public";

type CustomerStatus =
  | "all"
  | "chatting"
  | "supervised"
  | "queued"
  | "waiting"
  | "invited"
  | "browsing";

interface CustomerTab {
  id: CustomerStatus;
  label: string;
  count: number;
}

function LiveDuration({ startTime }: { startTime: string }) {
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const update = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      let text = "";
      if (days > 0) text += `${days}d `;
      if (hours > 0 || days > 0) text += `${hours}h `;
      if (minutes > 0 || hours > 0 || days > 0) text += `${minutes}m `;
      text += `${seconds}s`;

      setDuration(text || "0s");
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span>{duration}</span>;
}

export default function Traffic() {
  const { toggleAutomateSidebar } = useSidebar();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(true);
  const socketRef = useRef<any>(null);
  const [readyRooms, setReadyRooms] = useState<string[]>([]);
  const router = useRouter();
  const role = Cookies.get("currentRole");
  const chatbotId = useUserStore((state) => state.userData.chatbotId);

  const [activeTab, setActiveTab] = useState<CustomerStatus>("all");
  const [customerTabs, setCustomerTabs] = useState<CustomerTab[]>([
    { id: "all", label: "All customers", count: 1 },
    { id: "chatting", label: "Chatting", count: 0 },
    { id: "supervised", label: "Supervised", count: 0 },
    { id: "queued", label: "Queued", count: 0 },
    { id: "waiting", label: "Waiting for reply", count: 0 },
    { id: "invited", label: "Invited", count: 0 },
    { id: "browsing", label: "Browsing", count: 1 },
  ]);

  const setUserData = useUserStore((state) => state.setUserData);
  const fetchAllLiveVisitors = async (chatbotId: string) => {
    setFetching(true);
    try {
      const response = await getAllLiveVisitors(chatbotId);

      // Sort visitors: online first, then by updatedAt desc
      const sorted = [...response].sort((a, b) => {
        if (a.is_online && !b.is_online) return -1; // a online first
        if (!a.is_online && b.is_online) return 1; // b online first

        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

      const onlineVisitors = sorted.filter((v) => v.is_online);

      setUserData({
        trafficCount: onlineVisitors.length,
      });

      setVisitors(sorted);

      // Update tab counts based on conversation status
      setCustomerTabs((prev) =>
        prev.map((tab) => {
          let count = 0;

          switch (tab.id) {
            case "all":
              count = sorted.length;
              break;
            case "browsing":
              count = sorted.filter(
                (v) => v.is_online && !v.conversation_status?.has_conversation
              ).length;
              break;
            case "chatting":
              count = sorted.filter(
                (v) =>
                  v.conversation_status?.has_conversation &&
                  !v.conversation_status?.is_closed
              ).length;
              break;
            case "supervised":
              count = sorted.filter(
                (v) =>
                  v.conversation_status?.has_conversation &&
                  v.conversation_status?.assigned_user_id !== null
              ).length;
              break;
            case "queued":
              count = sorted.filter(
                (v) =>
                  v.conversation_status?.has_conversation &&
                  v.conversation_status?.is_new &&
                  v.conversation_status?.assigned_user_id === null
              ).length;
              break;
            case "waiting":
              count = sorted.filter(
                (v) =>
                  v.conversation_status?.has_conversation &&
                  v.conversation_status?.last_message_role === "user"
              ).length;
              break;
            case "invited":
              count = readyRooms.length;
              break;
            default:
              count = 0;
          }

          return { ...tab, count };
        })
      );
    } catch (error) {
      console.error("Failed to fetch live visitors data", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      await fetchAllLiveVisitors(chatbotId);
    };
    fetchAll();
  }, []);

  const lastAnnounced = useRef<string | null>(null);

  // Unlock audio context after first click (browser autoplay policy)
  // useEffect(() => {
  //   const unlock = () => {
  //     window.removeEventListener("click", unlock);
  //     // Preload voices
  //     speechSynthesis.getVoices();
  //   };
  //   window.addEventListener("click", unlock);
  // }, []);

  // function speakNewUser(visitorId: string) {
  //   if (!("speechSynthesis" in window)) return;

  //   // Prevent saying it twice for the same visitor
  //   if (lastAnnounced.current === visitorId) return;
  //   lastAnnounced.current = visitorId;

  //   const msg = new SpeechSynthesisUtterance("New user came");
  //   msg.lang = "en-US";
  //   msg.rate = 0.9; // slightly slower for softer tone
  //   msg.pitch = 0.8; // lower pitch for calm voice
  //   msg.volume = 0.8; // softer volume

  //   // Try to get a smooth, friendly voice
  //   const voices = speechSynthesis.getVoices();
  //   const preferred = voices.find((v) =>
  //     /Google UK English Female|Google US English Female|Microsoft Zira/.test(
  //       v.name
  //     )
  //   );
  //   if (preferred) {
  //     msg.voice = preferred;
  //   }

  //   speechSynthesis.speak(msg);
  // }

  useEffect(() => {
    if (!chatbotId) return;

    // Disconnect previous socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      query: {
        chatbot_id: chatbotId,
        dashboard: true,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket dashboard room");
    });

    socket.on("visitor_update", (data: any) => {
      const { type, visitor } = data;
      const { userData, setUserData } = useUserStore.getState();

      setVisitors((prev) => {
        let updated: typeof prev = [];
        const exists = prev.find((v) => v.visitor_id === visitor.visitor_id);

        if (type === "connected") {
          if (exists) {
            updated = prev.map((v) =>
              v.visitor_id === visitor.visitor_id ? visitor : v
            );
            setUserData({
              trafficCount: (userData.trafficCount || 0) + 1,
            });
          } else {
            // speakNewUser(visitor.visitor_id);
            updated = [...prev, visitor];

            // Increment traffic count when new user connects
            setUserData({
              trafficCount: (userData.trafficCount || 0) + 1,
            });
          }
        } else if (type === "disconnected") {
          updated = prev.map((v) =>
            v.visitor_id === visitor.visitor_id ? visitor : v
          );

          // Decrement only if user goes offline
          if (
            visitor &&
            visitor.is_online === false &&
            exists?.is_online === true
          ) {
            setUserData({
              trafficCount: Math.max((userData.trafficCount || 1) - 1, 0),
            });
          }
        } else {
          updated = prev;
        }

        // Always sort: online first, then by updatedAt desc
        const sorted = [...updated].sort((a, b) => {
          if (a.is_online && !b.is_online) return -1;
          if (!a.is_online && b.is_online) return 1;
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });

        // Update tab counts after visitor changes
        setCustomerTabs((prevTabs) =>
          prevTabs.map((tab) => {
            let count = 0;

            switch (tab.id) {
              case "all":
                count = sorted.length;
                break;
              case "browsing":
                count = sorted.filter(
                  (v) => v.is_online && !v.conversation_status?.has_conversation
                ).length;
                break;
              case "chatting":
                count = sorted.filter(
                  (v) =>
                    v.conversation_status?.has_conversation &&
                    !v.conversation_status?.is_closed
                ).length;
                break;
              case "supervised":
                count = sorted.filter(
                  (v) =>
                    v.conversation_status?.has_conversation &&
                    v.conversation_status?.assigned_user_id !== null
                ).length;
                break;
              case "queued":
                count = sorted.filter(
                  (v) =>
                    v.conversation_status?.has_conversation &&
                    v.conversation_status?.is_new &&
                    v.conversation_status?.assigned_user_id === null
                ).length;
                break;
              case "waiting":
                count = sorted.filter(
                  (v) =>
                    v.conversation_status?.has_conversation &&
                    v.conversation_status?.last_message_role === "user"
                ).length;
                break;
              case "invited":
                count = readyRooms.length;
                break;
              default:
                count = 0;
            }

            return { ...tab, count };
          })
        );

        return sorted;
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [chatbotId]);

  const handleTrigger = async (
    user_email: string,
    chatbot_id: string,
    user_id: string,
    roomID: string
  ) => {
    const payload = {
      user_email: user_email ? user_email : "New Customer",
      chatbot_id,
      user_id,
    };

    let conversationId = null;

    try {
      const response = await createConversation(payload);
      console.log(response);
      conversationId = response?.conversation_id; //  conversation id
      console.log(conversationId);
    } catch (error) {
      console.log("error creating conversation", error);
    }

    if (socketRef.current) {
      console.log(`[Dashboard] Emitting open_chat to ${roomID}`);

      socketRef.current.emit("open_chat", {
        room: roomID,
        conversationId, //  send id
      });

      setReadyRooms((prev) => [...prev, roomID]);
    } else {
      console.warn("Socket not connected.");
    }
  };

  const filteredVisitors = visitors.filter((visitor) => {
    const convStatus = visitor.conversation_status;

    switch (activeTab) {
      case "all":
        return true;
      case "browsing":
        // Online visitors without active conversations
        return visitor.is_online && !convStatus?.has_conversation;
      case "chatting":
        // Visitors with active conversations (not closed)
        return convStatus?.has_conversation && !convStatus?.is_closed;
      case "supervised":
        // Conversations assigned to a support agent
        return (
          convStatus?.has_conversation && convStatus?.assigned_user_id !== null
        );
      case "queued":
        // New, unassigned conversations
        return (
          convStatus?.has_conversation &&
          convStatus?.is_new &&
          convStatus?.assigned_user_id === null
        );
      case "waiting":
        // Last message was from user (not support)
        return (
          convStatus?.has_conversation &&
          convStatus?.last_message_role === "user"
        );
      case "invited":
        // Visitors who have been invited to chat (readyRooms)
        return readyRooms.includes(visitor.room);
      default:
        return true;
    }
  });

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b h-[60px] px-6">
          <div className="flex items-center gap-4">
            <PanelLeft
              onClick={toggleAutomateSidebar}
              className="h-4 w-4 cursor-pointer"
            />
            <h2 className="text-lg font-semibold">Traffic</h2>
          </div>
        </div>
        {fetching && <Loading areaOnly />}

        {!fetching && (visitors?.length > 0 || readyRooms?.length > 0) ? (
          <>
            <div className="border-b">
              <div className="flex items-center px-6">
                {customerTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}>
                    {tab.label}
                    <Badge variant="secondary" className="text-xs">
                      {tab.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create campaign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent">
                  Match all filters
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Add filter
                </Button>
              </div>
            </div> */}

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-5">
                <div className="relative min-h-[400px]">
                  {fetching ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 z-10">
                      <Loading areaOnly />
                      <span className="text-sm font-medium text-muted-foreground mt-2">
                        Loading visitors...
                      </span>
                    </div>
                  ) : filteredVisitors.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-muted-foreground">
                        No visitors found for this filter.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                U
                              </span>
                            </div>
                          </TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Actions</TableHead>
                          <TableHead>Activity</TableHead>
                          <TableHead>Chatting with</TableHead>
                          <TableHead className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              Time on all pages
                              <ChevronDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVisitors.map((visitor) => (
                          <TableRow key={visitor.visitor_id}>
                            <TableCell>
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">
                                  U
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {visitor.ip_address ||
                                visitor.visitor_id.slice(0, 12)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {visitor.visitor_email || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    readyRooms.includes(visitor.room)
                                      ? router.push(`/${role}/chats`)
                                      : handleTrigger(
                                          visitor.visitor_email,
                                          visitor.chatbot_id,
                                          visitor.visitor_id,
                                          visitor.room
                                        )
                                  }
                                  disabled={!visitor.is_online}>
                                  {readyRooms.includes(visitor.room)
                                    ? "Go to Chat"
                                    : "Start chat"}
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    visitor.is_online
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                                  }`}
                                />
                                <span className="text-sm">
                                  {visitor.is_online ? "Browsing" : "Offline"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              -
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {visitor.is_online ? (
                                <LiveDuration startTime={visitor.created_at} />
                              ) : visitor.last_seen ? (
                                new Date(visitor.last_seen).toLocaleString()
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        ) : (
          !fetching && (
            <div className="flex flex-1 flex-col items-center justify-center text-center py-12 px-4">
              {/* Image */}
              <div className="w-full flex justify-center mb-6">
                <Image
                  src={websitetraffic}
                  alt="Empty chat illustration"
                  width={240}
                  height={240}
                  className="object-contain h-[280px] w-auto rounded-lg opacity-90 dark:opacity-80 transition-opacity duration-300"
                />
              </div>

              {/* Text */}
              <div className="max-w-md mx-auto">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 leading-snug">
                  Install chat widget to see visitors
                </h1>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  There are visitors waiting on your website. Install the chat
                  widget to connect with visitors browsing your site.
                </p>
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={() => router.push(`/${role}/settings/messenger`)}
                  className="rounded-md px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  Install Widget
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
