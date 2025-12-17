"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  PanelLeft,
  PanelRight,
  Loader2,
  FileText,
  MapPin,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTicketStore, useUserStore } from "@/utils/store";
import { useSidebar } from "@/context/SidebarContext";
import {
  fetchClosedTicketHistory,
  fetchTicketById,
  sendTicketEmail,
  updateTicket,
} from "@/services/tickets/ticketsService";
import { getUsers } from "@/services/teams/teamServices";
import { getVisitorsIpAddressForTickets } from "@/services/engage/trafficServices";
import { getSocket } from "@/services/webSocket";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TICKET_INPUT from "@/components/Common/ticket-input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { foundation } from "react-syntax-highlighter/dist/esm/styles/hljs";
import Loading from "@/app/loading";

// ------------------------- //
// TYPES
interface Attachment {
  url: string;
  size: number;
  filename: string;
  contentType?: string;
}

interface Conversation {
  role: "support" | "customer" | "note";
  text: string;
  timestamp?: string;
  attachments?: Attachment[];
}

interface Customer {
  email: string;
  custom_data?: Record<string, any>;
}

interface TicketResponse {
  id: number;
  ticket_id: string;
  subject: string;
  priority: string;
  status: string;
  conversations: Conversation[];
  created_at: string;
  updated_at: string;
  customer: Customer;
  assigned_user_id?: number | null;
  rating?: number | null;
  custom_data: any;
}

interface Reply {
  id: string;
  from: string;
  to: string;
  date?: string;
  content: string;
  attachments: Attachment[];
}

interface UITicket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  from: string;
  created: string;
  updated: string;
  replies: Reply[];
  assigned_user_id?: number | null;
  rating?: number | null;
  custom_data: any;
}

// ------------------------- //
// COMPONENT
export default function TicketDetail() {
  const params = useParams();
  const router = useRouter();
  const { ticketType } = useTicketStore();
  const { setIsSupportOpen } = useSidebar();
  const userId = useUserStore((s) => s.userData.userId);
  const chatbotId = useUserStore((s) => s.userData.chatbotId);

  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<UITicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [attachment, setAttachment] = useState<any>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );
  const [showReplyComposer, setShowReplyComposer] = useState(false);

  // ---- Ticket History States ----
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyViewTicket, setHistoryViewTicket] = useState<any>(null);

  // ------------------------- //
  // FETCHERS
  useEffect(() => {
    fetchTicket();
    fetchUsers();
    setIsSupportOpen(false);
  }, [ticketId]);

  // SOCKET UPDATE LISTENER
  useEffect(() => {
    const socket = getSocket();

    socket.on("ticket:updated", ({ ticketId: updatedId, updatedTicket }) => {
      if (!ticket) return;
      if (updatedId === ticket.id) {
        // merge updated fields
        setTicket((prev) =>
          prev
            ? {
              ...prev,
              title: updatedTicket.subject ?? prev.title,
              description:
                updatedTicket.conversations?.[0]?.text ?? prev.description,
              priority: updatedTicket.priority ?? prev.priority,
              status: updatedTicket.status?.toLowerCase() ?? prev.status,
              updated: updatedTicket.updated_at ?? prev.updated,
              custom_data: updatedTicket.custom_data ?? prev.custom_data,
              replies:
                updatedTicket.conversations?.map(
                  (conv: any, index: number) => ({
                    id: `${updatedTicket.id}-reply-${index}`,
                    from:
                      conv.role === "support"
                        ? "Support"
                        : conv.role === "note"
                          ? "Note"
                          : "Customer",
                    to:
                      conv.role === "support"
                        ? updatedTicket.customer?.email
                        : "Support Team",
                    date: conv.timestamp,
                    content: conv.text,
                    attachments: conv.attachments || [],
                  })
                ) ?? prev.replies,
            }
            : prev
        );
      }
    });

    return () => {
      socket.off("ticket:updated");
    };
  }, [ticket]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const foundTicket: TicketResponse = await fetchTicketById(ticketId);
      if (!foundTicket) {
        setError("Ticket not found");
        setTicket(null);
        return;
      }

      console.log(foundTicket.custom_data);

      const transformed: UITicket = {
        id: foundTicket.ticket_id,
        title: foundTicket.subject,
        description:
          foundTicket.conversations?.[0]?.text || "No description provided.",
        priority: foundTicket.priority || "Low",
        status: foundTicket.status || "open",
        from: foundTicket.customer?.email || "Unknown",
        created: foundTicket.created_at,
        updated: foundTicket.updated_at,
        assigned_user_id: foundTicket.assigned_user_id || null,
        rating: foundTicket.rating ?? null,
        custom_data: foundTicket.custom_data ?? {},
        replies:
          foundTicket.conversations?.map((conv, index) => ({
            id: `${foundTicket.id}-reply-${index}`,
            from:
              conv.role === "support"
                ? "Support"
                : conv.role === "note"
                  ? "Note"
                  : "Customer",
            to:
              conv.role === "support"
                ? foundTicket.customer?.email
                : "Support Team",
            date: conv.timestamp,
            content: conv.text,
            attachments: conv.attachments || [],
          })) || [],
      };

      console.log(transformed);
      setTicket(transformed);

      // Fetch closed ticket history
      try {
        const history = await fetchClosedTicketHistory(foundTicket.ticket_id);
        setHistoryTickets(history || []);
      } catch (err) {
        console.error("Failed to load ticket history", err);
      }

      // Save or replace ticket in localStorage
      const existingTickets = JSON.parse(
        localStorage.getItem("ticketContent") || "[]"
      );

      const updatedTickets = Array.isArray(existingTickets)
        ? [
          ...existingTickets.filter((t) => t.id !== transformed.id),
          transformed,
        ]
        : [transformed];

      localStorage.setItem("ticketContent", JSON.stringify(updatedTickets));

      if (transformed.replies.length > 0) {
        setExpandedReplies(
          new Set([transformed.replies[transformed.replies.length - 1].id])
        );
      }

      fetchLocation(foundTicket.customer.email);
    } catch (err) {
      console.error("Error fetching ticket:", err);
      setError("Failed to fetch ticket");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await getUsers();
      setAvailableUsers(users.data || []);
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const fetchLocation = async (email: string) => {
    try {
      const res = await getVisitorsIpAddressForTickets(chatbotId, email);
      if (!res) {
        setLocation(null);
        return;
      }

      // Check if location data is already stored in database
      if (res.latitude && res.longitude) {
        setLocation({
          lat: res.latitude,
          lon: res.longitude,
          city: res.city || "N/A",
          country: res.country || "N/A",
          region: res.region || "N/A",
        });
        return;
      }

      // Fallback to ipapi.co for legacy visitors without stored location
      if (!res.ip_address) {
        setLocation(null);
        return;
      }

      const locRes = await fetch(`https://ipapi.co/${res.ip_address}/json/`);
      const data = await locRes.json();
      if (data.latitude && data.longitude) {
        setLocation({
          lat: data.latitude,
          lon: data.longitude,
          city: data.city,
          country: data.country_name,
          region: data.region,
        });
      } else {
        setLocation(null);
      }
    } catch {
      setLocation(null);
    }
  };

  // ------------------------- //
  // ACTIONS
  // Send Reply & Update Local State
  const handleReplySend = async (content: string, provider: string) => {
    if (!ticket) return;
    try {
      await sendTicketEmail(ticket.id, {
        provider,
        message: content,
        subject: ticket.title,
        attachment: attachment || "",
      });
      const newReply = {
        id: `${ticket.id}-reply-${Date.now()}`,
        from: "Support",
        to: ticket.from || "Customer",
        date: new Date().toISOString(),
        content,
        attachments: attachment ? [attachment] : [],
      };

      // --- optimistic UI update
      setTicket((prev) =>
        prev
          ? {
            ...prev,
            replies: [...prev.replies, newReply],
            updated: new Date().toISOString(),
          }
          : prev
      );
      setAttachment(null);
    } catch (err) {
      console.error("Error sending reply:", err);
    }
  };

  // Update Ticket Fields (status / priority / assignee)
  const handleUpdate = async (
    field: "status" | "priority" | "assignee_id",
    value: string | number
  ) => {
    if (!ticket) return;
    try {
      // --- Optimistic UI update

      await updateTicket(ticket.id, { [field]: value } as any);
      setTicket((prev) =>
        prev
          ? {
            ...prev,
            [field]:
              field === "status" || field === "priority"
                ? (value as string)
                : value,
            updated: new Date().toISOString(),
          }
          : prev
      );
      toast.success(`Ticket ${field} updated successfully.`);
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
      toast.success(`Failed to update ticket ${field}.`);
    }
  };

  const toggleReply = (id: string) => {
    setExpandedReplies((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const getPriorityColor = (p: string) =>
    p.toLowerCase() === "high"
      ? "text-red-500"
      : p.toLowerCase() === "medium"
        ? "text-yellow-500"
        : "text-green-500";

  const getStatusBadge = (s: string) => {
    const c: Record<string, string> = {
      open: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
    };
    return c[s] || "";
  };

  // ------------------------- //
  // RENDER
  if (loading)
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
        <Loading areaOnly />
      </div>
    );

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-col flex-1 min-h-0 w-full">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b h-[60px] px-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span
              className="text-primary hover:underline cursor-pointer"
              onClick={() =>
                router.push(`filter/${ticketType.replace(/_/g, "_")}`)
              }>
              {ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} tickets
            </span>
            <ChevronRight size={20} />
            {ticket ? ticket.title : "Ticket"}
          </h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="h-8 w-8">
            {rightSidebarOpen ? <PanelRight /> : <PanelLeft />}
          </Button>
        </div>

        {/* BODY (Scrollable fix) */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 h-0 p-4">
            {!ticket ? (
              <p className="text-center text-red-500">
                {error || "Ticket not found"}
              </p>
            ) : (
              <>
                {/* Ticket Overview */}
                <div className="border rounded-lg p-4 bg-accent/30 space-y-3">
                  <h2 className="text-2xl font-bold">{ticket.title}</h2>
                  <div className="flex gap-3">
                    <span
                      className={`text-sm font-medium ${getPriorityColor(
                        ticket.priority
                      )}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getStatusBadge(
                        ticket.status
                      )}`}>
                      {ticket.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="prose prose-sm max-w-none dark:prose-invert text-foreground" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p>Ticket ID: {ticket.id}</p>
                    <p>From: {ticket.from}</p>
                    <p>Created: {new Date(ticket.created).toLocaleString()}</p>
                    <p>Updated: {new Date(ticket.updated).toLocaleString()}</p>
                  </div>
                </div>

                {/* Replies */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Reply Thread ({ticket.replies.length})
                  </h3>
                  <div className="space-y-3">
                    {ticket.replies.map((reply, index) => {
                      const isExpanded = expandedReplies.has(reply.id);
                      const isLatest = index === ticket.replies.length - 1;
                      return (
                        <div
                          key={reply.id}
                          className={cn(
                            "border rounded-lg overflow-hidden",
                            isLatest ? "bg-accent/30" : ""
                          )}>
                          <div
                            className="p-4 cursor-pointer hover:bg-accent/50 flex justify-between items-start"
                            onClick={() => toggleReply(reply.id)}>
                            <div>
                              <h4 className="font-semibold">{reply.from}</h4>
                              <p className="text-sm text-muted-foreground">
                                To: {reply.to}
                              </p>
                              {reply.date && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(reply.date).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <ChevronRight
                              className={cn(
                                "h-5 w-5 transition-transform text-muted-foreground",
                                isExpanded && "rotate-90"
                              )}
                            />
                          </div>

                          {isExpanded && (
                            <div className="p-4 pt-0 space-y-4 border-t">
                              {/* Dynamically scrollable content */}
                              <div className="max-h-[70vh] overflow-y-auto rounded-md bg-background">
                                <div className="p-3 prose prose-sm max-w-none dark:prose-invert">
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: reply.content,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Attachments */}
                              {reply.attachments?.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="text-sm font-semibold">
                                    Attachments ({reply.attachments.length})
                                  </h5>
                                  <div className="space-y-2">
                                    {reply.attachments.map((att, ai) => (
                                      <div
                                        key={ai}
                                        onClick={() => {
                                          setSelectedFile(att);
                                          setIsDialogOpen(true);
                                        }}
                                        className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-accent/20">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm truncate">
                                          {att.filename}
                                        </span>
                                        <span className="text-xs ml-auto text-muted-foreground">
                                          {(att.size / 1024).toFixed(1)} KB
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowReplyComposer(!showReplyComposer)}>
                    Reply
                  </Button>
                  {/* <Button variant="outline">Note</Button> */}
                </div>

                {showReplyComposer && (
                  <div className="mt-6">
                    {ticket.status === "Resolved" ? (
                      <p className="text-center text-muted-foreground text-sm">
                        This ticket is closed.
                      </p>
                    ) : (
                      <TICKET_INPUT
                        onSubmit={handleReplySend}
                        setAttachment={setAttachment}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Right Sidebar */}
      <div
        className={cn(
          "flex flex-col border-l transition-all duration-300 ease-in-out",
          rightSidebarOpen ? "w-96" : "w-0 overflow-hidden"
          // activeTab === "details" && " bg-muted/30",
          // activeTab === "copilot" && "bg-background"
        )}>
        {rightSidebarOpen && ticket && (
          <Tabs
            value={"details"}
            // onValueChange={setActiveTab}
            className="flex flex-col h-full gap-0">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b h-[60px] p-4 w-full">
              <TabsList className="w-full">
                <TabsTrigger value="details">Details</TabsTrigger>
                {/* <TabsTrigger value="copilot">Co-Pilot</TabsTrigger> */}
              </TabsList>
            </div>

            {/* Ticket Details Tab */}
            <TabsContent value="details" className="flex-1 flex overflow-auto">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6 text-sm">
                  <div className="text-center">
                    <Avatar className="h-20 w-20 mx-auto mb-3">
                      <AvatarImage src={"/placeholder.svg"} />
                      <AvatarFallback className="text-lg">
                        {ticket.from
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{ticket.from}</h3>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {new Date(ticket.updated).toLocaleString()}
                    </p>
                  </div>

                  <Separator />

                  {/* Ticket Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Ticket Info</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">
                          Ticket ID:
                        </Label>
                        <h3 className="font-semibold text-l">{ticket.id}</h3>
                      </div>

                      {ticket.custom_data &&
                        Object.entries(ticket.custom_data).map(
                          ([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground capitalize">
                                {key.replace(/_/g, " ")}:
                              </Label>
                              <h3 className="font-semibold text-l">
                                {String(value)}
                              </h3>
                            </div>
                          )
                        )}

                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">
                          Rating:
                        </Label>
                        {ticket.rating == null ? (
                          <h3 className="font-semibold text-l">Not Rated</h3>
                        ) : (
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={
                                  i < (ticket.rating ?? 0)
                                    ? "text-yellow-500 text-lg" // filled star
                                    : "text-gray-300 text-lg" // empty star
                                }>
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Status Dropdown */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-0.5">
                      Status
                    </Label>
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleUpdate("status", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Open", "In Progress", "Resolved"].map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority Dropdown */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-0.5">
                      Priority
                    </Label>
                    <Select
                      value={ticket.priority}
                      onValueChange={(value) =>
                        handleUpdate("priority", value)
                      }>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Low", "Medium", "High"].map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignee Dropdown */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-0.5">
                      Assignee
                    </Label>
                    <Select
                      value={ticket.assigned_user_id?.toString() || ""}
                      onValueChange={(value) =>
                        handleUpdate("assignee_id", parseInt(value))
                      }>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((u) => (
                          <SelectItem key={u.id} value={u.user_id.toString()}>
                            {u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* ---- Ticket History ---- */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Ticket History</h4>

                    <Button
                      variant="outline"
                      className="w-full text-left"
                      onClick={() => setHistoryOpen(true)}>
                      Past Tickets ({historyTickets.length})
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
                            {location.city || "N/A"}, {location.region || "N/A"}
                            , {location.country || "N/A"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="h-64 w-full flex items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        Location not available
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Co-Pilot Tab */}
            {/* <TabsContent
              value="copilot"
              className="flex-1 flex flex-col overflow-hidden">
              <Copilot ticketDetails={ticket} />
            </TabsContent> */}
          </Tabs>
        )}
      </div>

      {/* Ticket History Modal */}
      {/* Ticket History Modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg">
          {!historyViewTicket ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Resolved Ticket History – {ticket?.from}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-2 max-h-[400px] overflow-y-auto mt-4">
                {historyTickets.length > 0 ? (
                  historyTickets.map((conv: any) => (
                    <div
                      key={conv.ticket_id}
                      className="p-3 rounded-md border cursor-pointer hover:bg-accent"
                      onClick={() => setHistoryViewTicket(conv)}>
                      <div className="flex flex-col gap-1">
                        {/* Ticket ID + Badge */}
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            Ticket #{conv.ticket_id}
                          </p>
                          <span className="text-xs px-2 py-1 rounded bg-green-200 text-green-800">
                            Resolved
                          </span>
                        </div>

                        {/* Subject → Assigned User */}
                        <p className="text-sm font-medium text-muted-foreground">
                          {conv.subject} →{" "}
                          {availableUsers.find(
                            (u: any) => u.user_id === conv.assigned_user_id
                          )?.email || "Unassigned"}
                        </p>

                        {/* Last Message Time */}
                        <p className="text-xs text-muted-foreground">
                          {conv.conversations?.length > 0 ? (
                            <>
                              Last message:{" "}
                              {new Date(
                                conv.conversations[
                                  conv.conversations.length - 1
                                ]?.timestamp
                              ).toLocaleString()}
                            </>
                          ) : (
                            "No messages"
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">
                    No resolved tickets found.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setHistoryOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Ticket #{historyViewTicket.ticket_id}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 max-h-[400px] overflow-y-auto mt-4">
                {historyViewTicket.conversations?.map(
                  (msg: any, idx: number) => {
                    const isSupport = msg.role === "support";
                    const isNote = msg.role === "note";

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex",
                          isSupport
                            ? "justify-end"
                            : isNote
                              ? "justify-center"
                              : "justify-start"
                        )}>
                        <div
                          className={cn(
                            "max-w-[75%] rounded-lg px-3 py-2",
                            isSupport
                              ? "bg-primary text-primary-foreground"
                              : isNote
                                ? "bg-yellow-200 text-yellow-900 text-center"
                                : "bg-muted"
                          )}>
                          {/* Message HTML */}
                          <div
                            className="prose prose-sm"
                            dangerouslySetInnerHTML={{ __html: msg.text }}
                          />

                          {/* Attachments */}
                          {msg.attachments?.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map((att: any, i: number) => (
                                <div
                                  key={i}
                                  className="p-2 bg-white rounded-md border cursor-pointer hover:bg-gray-50"
                                  onClick={() => {
                                    setSelectedFile(att);
                                    setIsDialogOpen(true);
                                  }}>
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm truncate">
                                      {att.filename}
                                    </span>
                                    <span className="text-xs ml-auto text-muted-foreground">
                                      {(att.size / 1024).toFixed(1)} KB
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Timestamp */}
                          {msg.timestamp && (
                            <p
                              className={cn(
                                "mt-1 text-xs",
                                isSupport
                                  ? "text-primary-foreground/70"
                                  : isNote
                                    ? "text-yellow-700"
                                    : "text-muted-foreground"
                              )}>
                              {new Date(msg.timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setHistoryViewTicket(null)}>
                  Back
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* File Preview */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.filename}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setIsDialogOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          <div className="mt-4 flex justify-center">
            {selectedFile &&
              selectedFile.url.match(/\.(jpg|png|jpeg|gif|webp)$/i) ? (
              <img
                src={selectedFile.url}
                alt={selectedFile.filename}
                className="max-h-[70vh] rounded-md"
              />
            ) : selectedFile?.url.match(/\.pdf$/i) ? (
              <iframe
                src={selectedFile.url}
                className="w-full h-[70vh] border rounded-md"></iframe>
            ) : (
              <a
                href={selectedFile?.url}
                target="_blank"
                rel="noreferrer"
                className="underline text-blue-600">
                Open file
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
