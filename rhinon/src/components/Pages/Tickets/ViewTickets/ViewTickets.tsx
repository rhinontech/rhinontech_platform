"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Info,
  Menu,
  Search,
  X,
  UserPlus,
  MapPin,
  History,
  Plus,
  PanelLeft,
  PanelLeftOpen,
  PanelRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import TICKET_INPUT from "@/components/Common/ticket-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createTickets,
  fetchTickets,
  markTicketAsRead,
  sendTicketEmail,
  Ticket,
  updateTicket,
} from "@/services/tickets/ticketsService";
import { io } from "socket.io-client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUsers } from "@/services/teams/teamServices";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { useUserStore } from "@/utils/store";
import { getSocket } from "@/services/webSocket";
import { usePathname } from "next/navigation";
import { getVisitorsIpAddressForTickets } from "@/services/engage/trafficServices";
import Copilot from "@/components/Common/Copilot/Copilot";
import { Badge } from "@/components/ui/badge";
import Loading from "@/app/loading";
import "./ticket-input.css";

export default function ViewTickets() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const chatbot_id = useUserStore((state) => state.userData.chatbotId);
  const [searchQuery, setSearchQuery] = useState("");

  const [attachment, setAttachment] = useState("");
  // History-related state - only for closed tickets
  const [closedTicketsByCustomer, setClosedTicketsByCustomer] = useState<
    Record<string, Ticket[]>
  >({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentCustomerClosedTickets, setCurrentCustomerClosedTickets] =
    useState<Ticket[]>([]);
  const [readOnlyTicket, setReadOnlyTicket] = useState<boolean>(false);
  const [viewTicket, setViewTicket] = useState<any>(null);
  const userId = useUserStore((state) => state.userData.userId);
  const [location, setLocation] = useState<{
    lat: number;
    lon: number;
    city: string;
    country: string;
    region: string;
  } | null>(null);

  // const [isOnline, setIsOnline] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const handleOpen = (att: any) => {
    setSelectedFile(att);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFile(null);
  };

  const messages = selectedTicket?.conversations ?? [];
  type TicketField = "status" | "priority" | "assignee_id";

  // Utility function to group tickets by customer email
  const groupTicketsByCustomer = (tickets: Ticket[]) => {
    return tickets.reduce((acc: Record<string, Ticket[]>, ticket) => {
      const email = ticket.customer.email;
      if (!acc[email]) {
        acc[email] = [];
      }
      acc[email].push(ticket);
      return acc;
    }, {});
  };

  // Sort tickets with latest first
  const sortTickets = (tickets: Ticket[]) => {
    return tickets.sort((a, b) => {
      const aTime = new Date(a.updated_at).getTime();
      const bTime = new Date(b.updated_at).getTime();
      return bTime - aTime;
    });
  };

  // Filter tickets by status
  const filterTicketsByStatus = (tickets: Ticket[], status: string) => {
    return tickets.filter(
      (ticket) =>
        ticket.status.toLowerCase().trim() === status.toLowerCase().trim()
    );
  };

  const handleSubmit = async (input: string, provider: string) => {
    try {
      if (!selectedTicket?.ticket_id || readOnlyTicket) {
        console.error("No ticket selected or ticket is read-only.");
        return;
      }

      const value = {
        provider,
        message: input,
        subject: selectedTicket.subject,
        attachment: attachment,
      };

      console.log("Value", value);
      const ticketId = selectedTicket.ticket_id;

      await sendTicketEmail(ticketId, value);
      const newMessage = {
        role: "support",
        text: input,
        attachments: [],
        timestamp: new Date().toISOString(),
      };

      setSelectedTicket((prev) =>
        prev && prev.ticket_id === ticketId
          ? {
            ...prev,
            conversations: [...(prev.conversations || []), newMessage],
          }
          : prev
      );

      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.ticket_id === ticketId
            ? {
              ...ticket,
              conversations: [...(ticket.conversations || []), newMessage],
            }
            : ticket
        )
      );

      // 2. Check if conversation is unassigned
      if (!selectedTicket.assigned_user_id) {
        // Reuse your handleTicketUpdate function
        await handleTicketUpdate(ticketId, "assignee_id", userId);
      }
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const handleTicketUpdate = async (
    ticketId: string,
    field: TicketField,
    value: string | number
  ) => {
    try {
      if (readOnlyTicket) {
        console.error("Cannot update read-only ticket");
        return;
      }

      // Update on server
      await updateTicket(ticketId, { [field]: value });

      // Decide which key to update in local state
      const fieldKey = field === "assignee_id" ? "assigned_user_id" : field;

      // Update tickets list
      setTickets((prevTickets) => {
        let updatedTickets = prevTickets.map((ticket) =>
          ticket.ticket_id === ticketId
            ? { ...ticket, [fieldKey]: value }
            : ticket
        );

        // Handle reassignment
        if (field === "assignee_id") {
          if (value === userId) {
            // Assigned to me → keep ticket, update selectedTicket
            setSelectedTicket((prev) =>
              prev?.ticket_id === ticketId
                ? { ...prev, assigned_user_id: userId }
                : prev
            );
          } else {
            // Assigned away → remove ticket & auto-select next
            updatedTickets = updatedTickets.filter(
              (ticket) => ticket.ticket_id !== ticketId
            );
            setSelectedTicket(updatedTickets[0] || null);
          }
        } else {
          // For status, priority, etc. → sync selectedTicket too
          setSelectedTicket((prev) =>
            prev?.ticket_id === ticketId ? { ...prev, [fieldKey]: value } : prev
          );
        }

        return updatedTickets;
      });

      // Handle closed/resolved tickets
      if (
        field === "status" &&
        ["closed", "resolved"].includes(value.toString().toLowerCase().trim())
      ) {
        // Decrease new ticket count if needed
        const resolvedTicket = tickets.find((t) => t.ticket_id === ticketId);
        if (resolvedTicket?.is_new) {
          const { userData, setUserData } = useUserStore.getState();
          const current = userData.newTicketCount || 0;
          setUserData({
            newTicketCount: current > 0 ? current - 1 : 0,
          });
        }

        setTimeout(() => {
          reorganizeTicketsAfterStatusChange();
        }, 100);
      }
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    }
  };

  // Reorganize tickets when status changes
  const reorganizeTicketsAfterStatusChange = async () => {
    try {
      const allTickets = await fetchTickets();
      if (allTickets && allTickets.length > 0) {
        processTicketsData(allTickets);

        // If the currently selected ticket is now closed, handle it appropriately
        if (
          selectedTicket &&
          selectedTicket.status.toLowerCase().trim() === "resolved"
        ) {
          console.log("Selected ticket is now resolved");
          // You might want to clear selection or switch to another active ticket
        }
      }
    } catch (error) {
      console.error("Error reorganizing tickets:", error);
    }
  };

  const fetchIp = async () => {
    try {
      const response = await getVisitorsIpAddressForTickets(
        chatbot_id,
        selectedTicket?.customer?.email!
      );
      // setIsOnline(!!response.is_online);
      return response.ip_address;
    } catch (error) {
      // setIsOnline(false);
      console.error("Error fetching the ip Address", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!selectedTicket) return;

        const ipAddress = await fetchIp();
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
      } catch (err) {
        console.error("Failed to fetch location:", err);
      }
    };

    fetchData();
  }, [selectedTicket]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("ticket:created", ({ ticket }) => {
      // Only add to main list if not Resolved
      if (ticket.is_new && ticket.status.toLowerCase().trim() !== "resolved") {
        const { userData, setUserData } = useUserStore.getState();
        setUserData({
          newTicketCount: (userData.newTicketCount || 0) + 1,
        });
      }
    });

    socket.on("ticket:updated", ({ ticketId, newMessage, updatedTicket }) => {
      // Update main tickets list
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === ticketId ? updatedTicket : t))
      );

      // Update selected ticket if it matches
      setSelectedTicket((prev) => {
        if (!prev || prev.ticket_id !== ticketId) return prev;
        return {
          ...updatedTicket,
          conversations: [...(prev.conversations ?? []), newMessage],
        };
      });

      // If ticket was closed, reorganize
      if (updatedTicket.status.toLowerCase().trim() === "resolved") {
        setTimeout(() => {
          reorganizeTicketsAfterStatusChange();
        }, 100);
      }
    });

    return () => {
      socket.off("ticket:created");
      socket.off("ticket:updated");
    };
  }, []);

  useEffect(() => {
    const updateAsRead = async () => {
      if (selectedTicket && selectedTicket.is_new && !readOnlyTicket) {
        try {
          await markTicketAsRead(selectedTicket.ticket_id);

          setTickets((prev) =>
            prev.map((t) =>
              t.ticket_id === selectedTicket.ticket_id
                ? { ...t, is_new: false }
                : t
            )
          );

          setSelectedTicket((prev) =>
            prev ? { ...prev, is_new: false } : prev
          );

          //  Decrease global unread count
          const { userData, setUserData } = useUserStore.getState();
          const current = userData.newTicketCount || 0;
          setUserData({
            newTicketCount: current > 0 ? current - 1 : 0,
          });
        } catch (err) {
          console.error("Failed to mark ticket as read", err);
        }
      }
    };

    updateAsRead();
  }, [selectedTicket, readOnlyTicket]);

  // Process tickets data to separate active and closed tickets
  const processTicketsData = (allTickets: Ticket[]) => {
    // Group all tickets by customer
    const groupedByCustomer = groupTicketsByCustomer(allTickets);

    const activeTickets: Ticket[] = [];
    const closedTicketsByCustomerMap: Record<string, Ticket[]> = {};

    // Process each customer's tickets
    Object.entries(groupedByCustomer).forEach(
      ([customerEmail, customerTickets]) => {
        const sortedCustomerTickets = sortTickets(customerTickets);

        // Separate closed and active tickets for this customer
        const customerClosedTickets = sortedCustomerTickets.filter(
          (ticket) => ticket.status.toLowerCase().trim() === "resolved"
        );

        const customerActiveTickets = sortedCustomerTickets.filter(
          (ticket) => ticket.status.toLowerCase().trim() !== "resolved"
        );

        //  Filter active tickets: only show if unassigned or assigned to current user
        const filteredActiveTickets = customerActiveTickets.filter(
          (ticket) =>
            !ticket.assigned_user_id || ticket.assigned_user_id === userId
        );

        if (filteredActiveTickets.length > 0) {
          activeTickets.push(...filteredActiveTickets);
        } else if (customerClosedTickets.length > 0) {
          // If no active tickets (after filtering) but closed tickets exist,
          // show the most recent closed ticket in the main list
          activeTickets.push(customerClosedTickets[0]);
        }

        // Closed history: keep ALL closed tickets
        if (customerClosedTickets.length > 0) {
          closedTicketsByCustomerMap[customerEmail] = customerClosedTickets;
        }
      }
    );

    // Sort all active tickets by updated_at
    const sortedActiveTickets = sortTickets(activeTickets);

    setTickets(sortedActiveTickets);
    setClosedTicketsByCustomer(closedTicketsByCustomerMap);

    return sortedActiveTickets;
  };

  const pathname = usePathname().split("/").pop();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [ticketResponse, usersResponse] = await Promise.all([
          fetchTickets(),
          getUsers(),
        ]);

        if (ticketResponse?.length) {
          const activeTickets = processTicketsData(ticketResponse);
          const unreadCount = activeTickets.filter((t) => t.is_new).length;

          //  Set initial count
          const { setUserData } = useUserStore.getState();
          setUserData({ newTicketCount: unreadCount });

          // Continue your existing selection logic
          const selected =
            activeTickets.find(
              (ticket: any) => ticket.ticket_id === pathname
            ) ||
            activeTickets[0] ||
            null;

          setSelectedTicket(selected);
          setReadOnlyTicket(false);
        }

        setAvailableUsers(usersResponse.data || []);
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (pathname) init();
  }, [pathname]);

  const openHistory = () => {
    if (!selectedTicket) return;

    const customerEmail = selectedTicket.customer.email;
    const customerClosedTickets = closedTicketsByCustomer[customerEmail] || [];

    // Filter to ensure we only have closed tickets
    const confirmedClosedTickets = customerClosedTickets.filter(
      (ticket) => ticket.status.toLowerCase().trim() === "resolved"
    );

    setCurrentCustomerClosedTickets(confirmedClosedTickets);
    setIsHistoryOpen(true);
  };

  const selectTicket = (ticket: Ticket, isReadOnly = false) => {
    setReadOnlyTicket(isReadOnly);
    setSelectedTicket(ticket);

    if (ticket.is_new && !isReadOnly) {
      markTicketAsRead(ticket.ticket_id);
      setTickets((prev) =>
        prev.map((t) =>
          t.ticket_id === ticket.ticket_id ? { ...t, is_new: false } : t
        )
      );

      // Decrease global unread count
      const { userData, setUserData } = useUserStore.getState();
      const current = userData.newTicketCount || 0;
      setUserData({
        newTicketCount: current > 0 ? current - 1 : 0,
      });
    }
  };

  // Add ticket creation modal state and handlers
  const [createTicketModalOpen, setCreateTicketModalOpen] = useState(false);
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketText, setTicketText] = useState("");
  const [ticketStatus, setTicketStatus] = useState("");
  const [ticketPriority, setTicketPriority] = useState("");
  const [ticketService, setTicketService] = useState("");
  const [ticketCustomerName, setTicketCustomerName] = useState("");
  const [ticketReference, setTicketReference] = useState("");
  const [ticketAssignee, setTicketAssignee] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const orgId = useUserStore((state) => state.userData.orgId);

  // Add submitTicket function
  const submitTicket = async (
    ticketEmail: string,
    ticketSubject: string,
    ticketText: string,
    ticketCustomerName: string,
    ticketReference: string,
    ticketPriority: string,
    ticketStatus: string,
    ticketService: string,
    ticketAssignee: string
  ) => {
    try {
      setTicketLoading(true);
      const payload = {
        chatbot_id: chatbot_id,
        organization_id: orgId,
        customer_email: ticketEmail,
        subject: ticketSubject,
        conversations: [
          {
            role: "customer",
            text: ticketText,
          },
        ],
        status: ticketStatus,
        priority: ticketPriority,
        assigned_user_id: ticketAssignee || null,
        custom_data: {
          customer_name: ticketCustomerName,
          reference_number: ticketReference,
          service_type: ticketService,
        },
      };
      await createTickets(payload);
      // Optionally, refresh tickets list here
    } catch (error) {
      console.error("create ticket failed..", error);
    } finally {
      setCreateTicketModalOpen(false);
      setTicketLoading(false);
      setTicketEmail("");
      setTicketSubject("");
      setTicketText("");
      setTicketCustomerName("");
      setTicketPriority("");
      setTicketReference("");
      setTicketService("");
      setTicketStatus("");
      setTicketAssignee("");
    }
  };
  function extractText(html: string): string {
    // Create a temporary DOM element
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  function timeAgo(timestamp: string | number | Date): string {
    const now = new Date();
    const past = new Date(timestamp);
    let seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const isFuture = seconds < 0;
    seconds = Math.abs(seconds);

    const units = [
      { label: "year", seconds: 365 * 24 * 60 * 60 },
      { label: "month", seconds: 30 * 24 * 60 * 60 },
      { label: "week", seconds: 7 * 24 * 60 * 60 },
      { label: "day", seconds: 24 * 60 * 60 },
      { label: "hour", seconds: 60 * 60 },
      { label: "min", seconds: 60 },
      { label: "sec", seconds: 1 },
    ];

    for (const unit of units) {
      const value = Math.floor(seconds / unit.seconds);
      if (value >= 1) {
        return isFuture
          ? `in ${value} ${unit.label}${value > 1 ? "s" : ""}`
          : `${value} ${unit.label}${value > 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading areaOnly />
      </div>
    );
  }
  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border bg-background">
      {/* Left Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-muted/30 transition-all duration-300 ease-in-out",
          leftSidebarOpen ? "w-[310px]" : "w-0 overflow-hidden"
        )}>
        {leftSidebarOpen && (
          <>
            <div className="flex items-center justify-between border-b h-[60px] p-4">
              <h2 className="text-lg font-semibold">Tickets</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftSidebarOpen(false)}
                className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="bg-[#063268] text-white mt-2 rounded-lg mx-4 "
              onClick={() => setCreateTicketModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create new ticket
            </Button>

            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 h-0">
              <div className="space-y-1 p-2">
                {tickets
                  .filter((t) => {
                    const email = (t.customer.email || "").toLowerCase();
                    const search = searchQuery.toLowerCase();
                    return email.includes(search);
                  })
                  .map((ticket) => (
                    <div
                      key={ticket.id}
                      className={cn(
                        "flex flex-col relative sm:flex-row sm:items-center sm:gap-3 gap-2 cursor-pointer rounded-lg p-3 transition-colors hover:bg-accent",
                        selectedTicket?.ticket_id === ticket.ticket_id &&
                        "bg-accent"
                      )}
                      onClick={() => selectTicket(ticket)}>
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={"/placeholder.svg"} />
                          <AvatarFallback>
                            {ticket.customer.email
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <p className="font-medium text-sm truncate">
                            {ticket.customer.email}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <p className="text-xs max-w-[140px] text-muted-foreground truncate line-clamp-1">
                            {extractText(
                              ticket.conversations[
                                ticket.conversations.length - 1
                              ]?.text
                            ) || ""}
                          </p>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {timeAgo(ticket.updated_at)}
                          </span>
                        </div>
                      </div>
                      {ticket.is_new && (
                        <Badge
                          variant="default"
                          className="h-5 absolute right-[10px] top-[14px] min-w-5 text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col w-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b h-[60px] p-4">
          <div className="flex items-center gap-3">
            {!leftSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftSidebarOpen(true)}
                className="h-8 w-8">
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            {selectedTicket && (
              <>
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={"/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedTicket.customer.email
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {/*                   
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                    )}
                   */}
                </div>
                <div>
                  <h3 className="font-semibold">
                    <h3 className="font-semibold">
                      {selectedTicket?.custom_data?.name ||
                        selectedTicket?.customer?.email
                          ?.split("@")[0]
                          ?.split(/[._]/)
                          .map(
                            (part) =>
                              part.charAt(0).toUpperCase() + part.slice(1)
                          )
                          .join(" ") ||
                        "No Name"}
                    </h3>
                  </h3>
                  {/* <p className="text-sm text-muted-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </p> */}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="h-8 w-8">
              {/* <Info className="h-4 w-4" /> */}
              {rightSidebarOpen ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 h-0 p-4 pb-0">
          <div className="space-y-4">
            {messages.map((message, index) => {
              // Split HTML into first part + quoted part
              const [mainText, ...quotedParts] = message.text.split(
                /(<div class="gmail_quote[\s\S]*)/i
              );
              const quotedHtml = quotedParts.join("");

              return (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "support"
                      ? "justify-end"
                      : message.role === "note"
                        ? "justify-center"
                        : "justify-start"
                  )}>
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg px-3 py-2",
                      message.role === "support"
                        ? "bg-primary text-primary-foreground"
                        : message.role === "note"
                          ? "bg-yellow-200 text-yellow-900 text-center"
                          : "bg-muted"
                    )}>
                    {/* Main text */}
                    <div
                      className="text-sm ProseMirror prose"
                      dangerouslySetInnerHTML={{ __html: mainText }}
                    />

                    {/* Attachments directly below main text */}
                    {message.attachments?.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((att: any, i: number) => (
                          <div
                            key={i}
                            onClick={() => handleOpen(att)}
                            className="flex items-center gap-2 p-2 border rounded-lg bg-white shadow-sm hover:bg-gray-50 cursor-pointer">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7v10M17 7v10M4 17h16M4 7h16"
                              />
                            </svg>
                            <div className="flex-1 truncate">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {att.filename}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(att.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quoted email content */}
                    {quotedHtml && (
                      <div
                        className="mt-2 text-xs opacity-70 ProseMirror prose"
                        dangerouslySetInnerHTML={{ __html: quotedHtml }}
                      />
                    )}

                    {/* Timestamp */}
                    {message.timestamp && (
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          message.role === "support"
                            ? "text-primary-foreground/70"
                            : message.role === "note"
                              ? "text-yellow-700"
                              : "text-muted-foreground"
                        )}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Message Input */}
        {!readOnlyTicket && selectedTicket?.status !== "Resolved" ? (
          <div className="p-2 flex items-center justify-center">
            <div className="w-6/5">
              <TICKET_INPUT
                onSubmit={handleSubmit}
                setAttachment={setAttachment}
              />
            </div>
          </div>
        ) : selectedTicket?.status === "Resolved" ? (
          <div className="p-2 text-center text-muted-foreground text-sm">
            This ticket is closed.
          </div>
        ) : (
          <div className="p-2 text-center text-muted-foreground text-sm">
            This is a past conversation (read-only).
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div
        className={cn(
          "flex flex-col border-l transition-all duration-300 ease-in-out",
          rightSidebarOpen ? "w-96" : "w-0 overflow-hidden",
          activeTab === "details" && " bg-muted/30",
          activeTab === "copilot" && "bg-background"
        )}>
        {rightSidebarOpen && selectedTicket && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-full gap-0">
            <div className="flex items-center justify-between border-b h-[60px] p-4 w-full">
              <TabsList className="w-full">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="copilot">Co-Pilot</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="flex-1 overflow-auto">
              <ScrollArea>
                <div className="p-4 space-y-6">
                  <div className="text-center">
                    <Avatar className="h-20 w-20 mx-auto mb-3">
                      <AvatarImage src={"/placeholder.svg"} />
                      <AvatarFallback className="text-lg">
                        {selectedTicket.customer.email
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">
                      {selectedTicket.customer.email}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        selectedTicket.conversations?.[
                          selectedTicket.conversations.length - 1
                        ]?.timestamp
                      ).toLocaleString()}
                    </p>
                    {/* <p className="text-sm text-muted-foreground">
                      {isOnline ? "Online" : "Offline"}
                    </p> */}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Ticket Info</h4>
                    <div className="space-y-2">
                      {/* Ticket id */}
                      <div className="flex flex-col gap-2">
                        {/* Ticket Id */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">
                            Ticket Id:
                          </Label>
                          <h3 className="font-semibold text-l">
                            {selectedTicket.ticket_id}
                          </h3>
                        </div>

                        {/* Custom Data (each key-value on its own line) */}
                        {selectedTicket.custom_data &&
                          Object.entries(selectedTicket.custom_data).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2">
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
                          {selectedTicket.rating == null ? (
                            <h3 className="font-semibold text-l">Not Rated</h3>
                          ) : (
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={
                                    i < selectedTicket.rating
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

                      {/* Status Dropdown */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">
                          Status
                        </Label>
                        <Select
                          value={selectedTicket.status}
                          onValueChange={(value) =>
                            handleTicketUpdate(
                              selectedTicket.ticket_id,
                              "status",
                              value
                            )
                          }>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Open", "In Progress", "Resolved"].map(
                              (status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Priority Dropdown */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">
                          Priority
                        </Label>
                        <Select
                          value={selectedTicket.priority}
                          onValueChange={(value) =>
                            handleTicketUpdate(
                              selectedTicket.ticket_id,
                              "priority",
                              value
                            )
                          }>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Low", "Medium", "High", "Critical"].map(
                              (priority) => (
                                <SelectItem key={priority} value={priority}>
                                  {priority}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Assignee Dropdown */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">
                          Assignee
                        </Label>
                        <Select
                          value={
                            selectedTicket.assigned_user_id?.toString() || ""
                          }
                          onValueChange={(value) =>
                            handleTicketUpdate(
                              selectedTicket.ticket_id,
                              "assignee_id",
                              parseInt(value)
                            )
                          }>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Assign to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUsers.map((user: any) => (
                              <SelectItem
                                key={user.id}
                                value={user.user_id.toString()}>
                                {user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Ticket Settings</h4>
                    <div className="space-y-2">
                      {(() => {
                        const customerEmail = selectedTicket.customer.email;
                        const customerClosedTickets =
                          closedTicketsByCustomer[customerEmail] || [];
                        const closedCount = customerClosedTickets.filter(
                          (ticket) =>
                            ticket.status.toLowerCase().trim() === "resolved"
                        ).length;

                        // Only show history button if there are actually closed tickets

                        return (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            size="sm"
                            onClick={openHistory}>
                            <History className="h-4 w-4 mr-2" />
                            Ticket History ({closedCount})
                          </Button>
                        );

                        return null;
                      })()}
                    </div>
                  </div>

                  <Separator />

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

            <TabsContent
              value="copilot"
              className="flex-1 flex flex-col overflow-hidden">
              <Copilot ticketDetails={selectedTicket} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dialog for preview */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl bg-white rounded-xl shadow-xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full hover:bg-gray-100 absolute right-4 top-4 z-10">
            <X className="w-5 h-5 text-gray-600" />
          </Button>

          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {selectedFile?.filename}
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-center items-center mt-4">
            {selectedFile &&
              (() => {
                const fileType = selectedFile.url
                  .split(".")
                  .pop()
                  ?.toLowerCase();

                if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileType)) {
                  return (
                    <img
                      src={selectedFile.url}
                      alt="attachment"
                      className="max-h-[70vh] rounded-lg"
                    />
                  );
                }

                if (["mp4", "webm", "ogg"].includes(fileType)) {
                  return (
                    <video
                      src={selectedFile.url}
                      controls
                      className="max-h-[70vh] rounded-lg"
                    />
                  );
                }

                if (["pdf"].includes(fileType)) {
                  return (
                    <iframe
                      src={selectedFile.url}
                      className="w-full h-[70vh] rounded-lg border"></iframe>
                  );
                }

                return (
                  <a
                    href={selectedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline">
                    Open file
                  </a>
                );
              })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat History Modal - Now shows only selected user's closed tickets */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogOverlay className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />
        <DialogContent className="fixed left-1/2 top-1/2 z-[110] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-6 shadow-lg">
          {viewTicket ? (
            <div>
              <DialogHeader>
                <DialogTitle>
                  Ticket #{viewTicket.ticket_id} -{" "}
                  {selectedTicket?.customer.email}
                </DialogTitle>
              </DialogHeader>
              <div className="my-4 max-h-[300px] overflow-y-auto space-y-4">
                {viewTicket.conversations?.length > 0 ? (
                  viewTicket.conversations.map((message: any, idx: number) => {
                    const [mainText, ...quotedParts] = message.text.split(
                      /(<div class="gmail_quote[\s\S]*)/i
                    );
                    const quotedHtml = quotedParts.join("");
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex",
                          message.role === "support"
                            ? "justify-end"
                            : message.role === "note"
                              ? "justify-center"
                              : "justify-start"
                        )}>
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-3 py-2",
                            message.role === "support"
                              ? "bg-primary text-primary-foreground"
                              : message.role === "note"
                                ? "bg-yellow-200 text-yellow-900 text-center"
                                : "bg-muted"
                          )}>
                          <div
                            className="text-sm ProseMirror prose"
                            dangerouslySetInnerHTML={{ __html: mainText }}
                          />
                          {message.attachments?.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((att: any, i: any) => (
                                <a
                                  key={i}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 border rounded-lg bg-white shadow-sm hover:bg-gray-50">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 7v10M17 7v10M4 17h16M4 7h16"
                                    />
                                  </svg>
                                  <div className="flex-1 truncate">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {att.filename}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {(att.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                          {quotedHtml && (
                            <div
                              className="mt-2 text-xs opacity-70 ProseMirror prose"
                              dangerouslySetInnerHTML={{ __html: quotedHtml }}
                            />
                          )}
                          {message.timestamp && (
                            <p
                              className={cn(
                                "mt-1 text-xs",
                                message.role === "support"
                                  ? "text-primary-foreground/70"
                                  : message.role === "note"
                                    ? "text-yellow-700"
                                    : "text-muted-foreground"
                              )}>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          )}
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
                  onClick={() => setViewTicket(null)}
                  className="mr-2">
                  Back
                </Button>
              </DialogFooter>
            </div>
          ) : (
            (() => {
              const confirmedClosedTickets =
                currentCustomerClosedTickets.filter(
                  (ticket) => ticket.status.toLowerCase().trim() === "resolved"
                );
              if (confirmedClosedTickets.length > 0) {
                return (
                  <div>
                    <DialogHeader>
                      <DialogTitle>
                        Resolved Ticket History -{" "}
                        {selectedTicket?.customer.email}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto mt-4">
                      {confirmedClosedTickets.map((conv, index) => (
                        <div
                          key={conv.id}
                          className="p-3 rounded-md border cursor-pointer hover:bg-accent"
                          onClick={() => setViewTicket(conv)}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  Ticket #{conv.ticket_id}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  Resolved
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-muted-foreground mt-1">
                                {conv.subject} →{" "}
                                {availableUsers.find(
                                  (user: any) =>
                                    user.user_id === conv.assigned_user_id
                                )?.email || "Unassigned"}
                              </p>
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
                        Resolved Ticket History -{" "}
                        {selectedTicket?.customer.email}
                      </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      No resolved tickets found for{" "}
                      {selectedTicket?.customer.email}
                    </p>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsHistoryOpen(false)}
                        className="mr-2 ">
                        Back
                      </Button>
                    </DialogFooter>
                  </div>
                );
              }
            })()
          )}
        </DialogContent>
      </Dialog>

      {/* Ticket Creation Modal */}
      <Dialog
        open={createTicketModalOpen}
        onOpenChange={setCreateTicketModalOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create Ticket
            </DialogTitle>
            <DialogDescription>
              Submit a support ticket on behalf of a user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Customer Email */}
            <div className="grid gap-2">
              <Label htmlFor="ticket-email">Customer Email</Label>
              <Input
                id="ticket-email"
                type="email"
                placeholder="Enter customer email"
                value={ticketEmail}
                onChange={(e) => setTicketEmail(e.target.value)}
              />
            </div>
            {/* customer Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="ticket-assignee">Customer Full Name</Label>
              <Input
                id="ticket-customer-name"
                placeholder="Enter customer full name"
                value={ticketCustomerName}
                onChange={(e) => setTicketCustomerName(e.target.value)}
              />
            </div>
            {/* Reference Number (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="ticket-reference">
                Reference Number (optional)
              </Label>
              <Input
                id="ticket-reference"
                placeholder="Enter reference number (if any)"
                value={ticketReference}
                onChange={(e) => setTicketReference(e.target.value)}
              />
            </div>
            {/* Priority */}
            <div className="grid gap-2">
              <Label htmlFor="ticket-priority">Priority</Label>
              <Select
                value={ticketPriority}
                onValueChange={(value) => setTicketPriority(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High", "Critical"].map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="ticket-status">Status</Label>
              <Select
                value={ticketStatus}
                onValueChange={(value) => setTicketStatus(value)}>
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
            {/* Type of Service */}
            <div className="grid gap-2">
              <Label htmlFor="ticket-service">Type of Service</Label>
              <Select
                value={ticketService}
                onValueChange={(value) => setTicketService(value)}>
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
                  ].map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* assignee */}
            <div className="grid gap-2">
              <Label htmlFor="ticket-assignee">Assignee</Label>
              <Select
                value={ticketAssignee}
                onValueChange={(value) => setTicketAssignee(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user: any) => (
                    <SelectItem key={user.id} value={user.user_id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Subject */}
            <div className="grid gap-2">
              <Label htmlFor="ticket-subject">Subject</Label>
              <Input
                id="ticket-subject"
                placeholder="Enter subject"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
              />
            </div>
            {/* Message */}
            <div className="grid gap-2">
              <Label htmlFor="ticket-text">Description</Label>
              <textarea
                id="ticket-text"
                rows={4}
                className="w-full border rounded-md p-2"
                placeholder="Enter HTML description"
                value={ticketText}
                onChange={(e) => setTicketText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateTicketModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                submitTicket(
                  ticketEmail,
                  ticketSubject,
                  ticketText,
                  ticketCustomerName,
                  ticketReference,
                  ticketPriority,
                  ticketStatus,
                  ticketService,
                  ticketAssignee
                );
              }}
              disabled={!ticketEmail || !ticketSubject || !ticketText}>
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
