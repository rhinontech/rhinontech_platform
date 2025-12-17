"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft, PanelRight, UserPlus } from "lucide-react";
import Image from "next/image";
import workPlaceholder from "@/assets/placeholders/workimg4.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useTicketStore } from "@/utils/store";
import { getSocket } from "@/services/webSocket";
import {
  fetchTickets,
  createTickets,
  markTicketAsRead,
} from "@/services/tickets/ticketsService";
import { getUsers } from "@/services/teams/teamServices";
import { toast } from "sonner";
import { useUserStore } from "@/utils/store";
import Loading from "@/app/loading";

// --- Interfaces ---
interface Ticket {
  ticket_id: string;
  assigned_user_id: number | null;
  conversations: { text: string }[];
  created_at: string;
  customer: { email: string };
  id: number;
  is_new: boolean;
  organization_id: number;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
  subject: string;
  updated_at: string;
}

const AllTickets = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { setTicketType } = useTicketStore();
  const { isSupportOpen, setIsSupportOpen } = useSidebar();

  const orgId = useUserStore((s) => s.userData.orgId);
  const chatbotId = useUserStore((s) => s.userData.chatbotId);
  const { userData, setUserData } = useUserStore.getState();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const [createTicketModalOpen, setCreateTicketModalOpen] = useState(false);
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketCustomerName, setTicketCustomerName] = useState("");
  const [ticketReference, setTicketReference] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [ticketStatus, setTicketStatus] = useState("Open");
  const [ticketService, setTicketService] = useState("");
  const [ticketAssignee, setTicketAssignee] = useState<any>("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketText, setTicketText] = useState("");
  const [ticketCreating, setTicketCreating] = useState(false);

  //  Fetch on load only
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Fetch tickets independently
      try {
        const ticketResponse = await fetchTickets();
        setTickets(ticketResponse);
        // Remove localStorage data after successful fetch
        localStorage.removeItem("ticketContent");
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setTickets([]); // Set empty array on error
      }

      // Fetch users independently (always needed for assignee dropdown)
      try {
        const userResponse = await getUsers();
        setAvailableUsers(userResponse.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setAvailableUsers([]);
      }

      setLoading(false);
    };

    init();
  }, []);

  // SOCKET REALTIME UPDATES
  useEffect(() => {
    const socket = getSocket();

    // new ticket created
    socket.on("ticket:created", ({ ticket }) => {
      // if new ticket and not resolved → increase new count
      if (ticket.is_new && ticket.status.toLowerCase() !== "resolved") {
        setUserData({
          newTicketCount: (userData.newTicketCount || 0) + 1,
        });
      }

      setTickets((prev) => [ticket, ...prev]);
    });

    // ticket updated
    socket.on("ticket:updated", ({ ticketId, updatedTicket }) => {
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === ticketId ? updatedTicket : t))
      );
    });

    return () => {
      socket.off("ticket:created");
      socket.off("ticket:updated");
    };
  }, []);

  // filter
  const filteredTickets = useMemo(() => {
    const type = (params.type as string)?.toLowerCase();
    if (!type || type === "all") return tickets;
    return tickets.filter(
      (t) => t.status.toLowerCase().replace(" ", "_") === type
    );
  }, [tickets, params]);

  useEffect(() => {
    if (params.type) setTicketType(params.type as any);
  }, [params]);

  useEffect(() => {
    setIsSupportOpen(true);
  }, []);

  const handleTicketClick = async (ticketId: string) => {
    const basePath = pathname.split("/filter")[0];
    await markTicketAsRead(ticketId);
    router.push(`${basePath}/${ticketId}`);
  };

  const getPriorityColor = (priority: string) =>
    priority === "High"
      ? "text-red-500"
      : priority === "Medium"
        ? "text-yellow-500"
        : "text-green-500";

  const getStatusBadge = (status: string) => {
    const map: any = {
      open: "bg-blue-100 text-blue-800",
      "in progress": "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
    };
    return map[status.toLowerCase()] || "";
  };

  // Create ticket (no refetch needed)
  const submitTicket = async () => {
    try {
      setTicketCreating(true);
      await createTickets({
        chatbot_id: chatbotId,
        organization_id: orgId,
        customer_email: ticketEmail,
        subject: ticketSubject,
        conversations: [{ role: "customer", text: ticketText }],
        status: ticketStatus,
        priority: ticketPriority,
        assigned_user_id: ticketAssignee || null,
        custom_data: {
          customer_name: ticketCustomerName,
          reference_number: ticketReference,
          service_type: ticketService,
        },
      });

      toast.success("Ticket created!");
      setCreateTicketModalOpen(false);

      // reset
      setTicketEmail("");
      setTicketCustomerName("");
      setTicketReference("");
      setTicketPriority("Medium");
      setTicketStatus("Open");
      setTicketService("");
      setTicketAssignee("");
      setTicketSubject("");
      setTicketText("");
    } catch (err) {
      toast.error("Error creating ticket");
    } finally {
      setTicketCreating(false);
    }
  };

  if (loading)
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
        <Loading areaOnly />
      </div>
    );

  return (
    <>
      <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full rounded-lg border bg-background overflow-hidden">
        <div className="flex flex-1 flex-col">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b h-[60px] px-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSupportOpen((p) => !p)}
                className="h-8 w-8">
                {isSupportOpen ? <PanelLeft /> : <PanelRight />}
              </Button>

              <h2 className="text-lg font-semibold">All Tickets</h2>
              <p className="text-sm text-muted-foreground">
                Current Filter: {params.type || "all"}
              </p>
            </div>

            <Button
              onClick={() => setCreateTicketModalOpen(true)}
              className="text-sm flex items-center gap-1">
              <UserPlus className="h-4 w-4" /> Create Ticket
            </Button>
          </div>

          {/* TICKET LIST */}
          <ScrollArea className="flex-1 h-0 p-4">
            {filteredTickets.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center py-12 px-4 bg-white dark:bg-background/30 backdrop-blur-sm transition-colors duration-300 rounded-2xl border border-border/30">
                <div className="w-full flex justify-center">
                  <Image
                    src={workPlaceholder}
                    alt="No tickets illustration"
                    width={180}
                    height={180}
                    className="object-contain h-[180px] w-auto rounded-lg opacity-90 dark:opacity-80 transition-opacity duration-300"
                  />
                </div>

                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 leading-snug mt-6">
                  No tickets found
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto transition-colors">
                  {params.type && params.type !== "all"
                    ? `No ${params.type} tickets available. Try changing the filter or create a new ticket.`
                    : "Get started by creating your first support ticket to track customer inquiries and issues."}
                </p>

                <div className="mt-6 flex gap-3 flex-wrap justify-center">
                  <Button
                    onClick={() => setCreateTicketModalOpen(true)}
                    className="rounded-md px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                  {params.type && params.type !== "all" && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(pathname.split("/filter")[0] + "/filter/all")}
                      className="rounded-md px-6 border-border/40 hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors">
                      View All Tickets
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleTicketClick(ticket.ticket_id)}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors relative">
                    {/* NEW BADGE */}
                    {ticket.is_new && (
                      <span className="absolute top-0 right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        <span
                          className={`text-xs font-medium ${getPriorityColor(
                            ticket.priority
                          )}`}>
                          {ticket.priority}
                        </span>
                      </div>

                      <span
                        className={`text-xs px-2 py-1 rounded ${getStatusBadge(
                          ticket.status
                        )}`}>
                        {ticket.status}
                      </span>
                    </div>

                    {/* <div
                      className="text-sm text-muted-foreground line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html:
                          ticket.conversations?.[0]?.text || "No description",
                      }}
                    /> */}

                    <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                      <p>From: {ticket.customer?.email}</p>
                      <p>{ticket.conversations?.length} replies</p>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      Updated: {new Date(ticket.updated_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* CREATE TICKET DIALOG (unchanged) */}


      <Dialog
        open={createTicketModalOpen}
        onOpenChange={setCreateTicketModalOpen}
      >
        <DialogContent className="sm:max-w-5xl max-w-[90vw] max-h-[85vh] p-0">
          <ScrollArea className="max-h-[85vh] px-6">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create Ticket
              </DialogTitle>
              <DialogDescription>
                Submit a support ticket on behalf of a user.
              </DialogDescription>
            </DialogHeader>

            {/* SCROLLABLE AREA */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
              <div className="grid gap-2">
                <Label>Customer Email *</Label>
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  value={ticketEmail}
                  onChange={(e) => setTicketEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Customer Name</Label>
                <Input
                  placeholder="John Doe"
                  value={ticketCustomerName}
                  onChange={(e) => setTicketCustomerName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Reference Number</Label>
                <Input
                  placeholder="REF-12345"
                  value={ticketReference}
                  onChange={(e) => setTicketReference(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={ticketPriority} onValueChange={setTicketPriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Low", "Medium", "High", "Critical"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={ticketStatus} onValueChange={setTicketStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Open", "In Progress", "Resolved"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Service Type</Label>
                <Select value={ticketService} onValueChange={setTicketService}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Email",
                      "Refund",
                      "Account and login",
                      "Billing and payments",
                      "Service issue",
                      "Technical support",
                      "Feature request",
                      "Training",
                      "Business partnership",
                    ].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Assignee</Label>
                <Select value={ticketAssignee} onValueChange={setTicketAssignee}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.user_id}>
                        {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label>Subject *</Label>
                <Input
                  placeholder="Brief description of the issue"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label>Description *</Label>
                <textarea
                  rows={5}
                  className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Provide detailed information about the ticket..."
                  value={ticketText}
                  onChange={(e) => setTicketText(e.target.value)}
                />
              </div>
            </div>


            <DialogFooter className="p-6 pt-2">
              <Button variant="outline" onClick={() => setCreateTicketModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitTicket}
                disabled={!ticketEmail || !ticketSubject || !ticketText || ticketCreating}
              >
                {ticketCreating ? "Creating..." : "Submit Ticket"}
              </Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>

    </>
  );
};

export default AllTickets;
