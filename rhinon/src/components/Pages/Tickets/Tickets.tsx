"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Lock,
  Clock,
  LineChart,
  CheckCircle,
  RefreshCcw,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { createTickets, fetchTickets } from "@/services/tickets/ticketsService";
import { usePathname, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserStore } from "@/utils/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getSocket } from "@/services/webSocket";
import { getUsers } from "@/services/teams/teamServices";
import Loading from "@/app/loading";
import { toast } from "sonner";
import Image from "next/image";
import workPlaceholder from "@/assets/placeholders/workimg4.png";

// Define the Ticket interface based on the provided API response structure
interface Conversation {
  role: string;
  text: string;
  timestamp: string;
}

interface Customer {
  id: number;
  organization_id: number;
  email: string;
  custom_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Ticket {
  ticket_id: string;
  assigned_user_id: number | null;
  conversations: Conversation[];
  created_at: string;
  custom_data: Record<string, any>;
  customer: Customer;
  customer_id: number;
  id: number;
  is_new: boolean;
  organization_id: number;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
  subject: string;
  tags: string[];
  updated_at: string;
  user: {
    id: number;
    name: string;
    avatar: string;
  } | null;
}

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
}

function CircularProgress({
  value,
  max = 100,
  strokeWidth = 8,
  trackColor = "hsl(var(--muted))",
  progressColor = "hsl(var(--primary))",
  className,
  children,
  ...props
}: CircularProgressProps) {
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = value / max;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      {...props}
    >
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke={trackColor}
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <circle
          className="transition-all duration-300 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={progressColor}
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute">{children}</div>
    </div>
  );
}

export default function Tickets() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[] | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [creationDateFilter, setCreationDateFilter] = useState<string>("all");

  // Summary card counts
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [pendingTicketsCount, setPendingTicketsCount] = useState(0);
  const [resolvedTicketsCount, setResolvedTicketsCount] = useState(0);
  const [createTicketModalOpen, setCreateTicketModalOpen] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);

  //create new ticket
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketText, setTicketText] = useState("");
  const [ticketStatus, setTicketStatus] = useState("");
  const [ticketPriority, setTicketPriority] = useState("");
  const [ticketService, setTicketService] = useState("");
  const [ticketCustomerName, setTicketCustomerName] = useState("");
  const [ticketReference, setTicketReference] = useState("");
  const [ticketAssignee, setTicketAssignee] = useState("");

  const [availableUsers, setAvailableUsers] = useState<any>([]);

  const orgId = useUserStore((state) => state.userData.orgId);
  const chatbotId = useUserStore((state) => state.userData.chatbotId);

  useEffect(() => {
    if (!pathname) return;

    // Extract the last part of the path
    const parts = pathname.split("/");
    const lastSegment = parts[parts.length - 1];

    // Map URL segment to filter value
    let status = "all";
    if (lastSegment === "in_progress") status = "In Progress";
    else if (lastSegment === "resolved") status = "resolved";
    else if (lastSegment === "open") status = "open";
    else status = "all";

    setStatusFilter(status);
  }, [pathname]);

  useEffect(() => {
    const init1 = async () => {
      setLoading(true);
      try {
        const ticketResponse = await fetchTickets();

        if (!ticketResponse || ticketResponse.length === 0) {
          console.warn("No tickets found.");
          setTickets(null);
        } else {
          setTickets(ticketResponse);
          countTheTicket(ticketResponse);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    const init2 = async () => {
      try {
        const usersResponse = await getUsers();
        setAvailableUsers(usersResponse.data || []);
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    init1();
    init2();
  }, []);

  const countTheTicket = (ticketResponse: any) => {
    // Calculate initial counts based on fetched data
    const openCount = ticketResponse.filter(
      (t: any) => t.status === "Open"
    ).length;
    const pendingCount = ticketResponse.filter(
      (t: any) => t.status === "In Progress"
    ).length;
    const resolvedCount = ticketResponse.filter(
      (t: any) => t.status === "Resolved"
    ).length;
    setOpenTicketsCount(openCount);
    setPendingTicketsCount(pendingCount);
    setResolvedTicketsCount(resolvedCount);
  };

  // Filter tickets whenever tickets or filter states change
  useEffect(() => {
    if (!tickets) {
      setFilteredTickets(null);
      return;
    }

    let tempFilteredTickets = [...tickets];

    if (statusFilter !== "all") {
      tempFilteredTickets = tempFilteredTickets.filter(
        (ticket) => ticket.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (priorityFilter !== "all") {
      tempFilteredTickets = tempFilteredTickets.filter(
        (ticket) =>
          ticket.priority.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    if (assigneeFilter !== "all") {
      tempFilteredTickets = tempFilteredTickets.filter((ticket) => {
        const assigneeName = ticket.user?.name?.toLowerCase() || "unassigned";
        return assigneeName === assigneeFilter;
      });
    }

    if (creationDateFilter !== "all") {
      const now = new Date();
      tempFilteredTickets = tempFilteredTickets.filter((ticket) => {
        const createdAt = new Date(ticket.created_at);
        if (creationDateFilter === "today") {
          return createdAt.toDateString() === now.toDateString();
        } else if (creationDateFilter === "yesterday") {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return createdAt.toDateString() === yesterday.toDateString();
        } else if (creationDateFilter === "last-week") {
          const lastWeek = new Date(now);
          lastWeek.setDate(now.getDate() - 7);
          return createdAt >= lastWeek;
        }
        return true;
      });
    }

    setFilteredTickets(tempFilteredTickets);
  }, [
    tickets,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    creationDateFilter,
  ]);

  useEffect(() => {
    const socket = getSocket();

    // When a new ticket is created
    socket.on("ticket:created", ({ ticket }) => {
      setTickets((prev) => {
        const updated = [ticket, ...(prev ?? [])]; // fallback if prev is null/undefined
        countTheTicket(updated);
        return updated;
      });
    });

    // When an existing ticket is updated
    socket.on("ticket:updated", ({ ticketId, updatedTicket }) => {
      setTickets((prev) => {
        const updated = (prev ?? []).map((t) =>
          t.ticket_id === ticketId ? updatedTicket : t
        );
        countTheTicket(updated);
        return updated;
      });
    });

    return () => {
      socket.off("ticket:created");
      socket.off("ticket:updated");
    };
  }, []);

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to format time
  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Extract unique assignees from tickets for the filter dropdown
  const uniqueAssignees = useMemo(() => {
    if (!tickets) return [];
    const assignees = new Set<string>();
    tickets.forEach((ticket) => {
      if (ticket.user?.name) {
        assignees.add(ticket.user.name);
      } else {
        assignees.add("Unassigned");
      }
    });
    return Array.from(assignees).sort();
  }, [tickets]);

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
        chatbot_id: chatbotId,
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

      console.log("Creating ticket:", {
        ticketEmail,
        ticketSubject,
        ticketText,
        ticketCustomerName,
        ticketReference,
        ticketPriority,
        ticketStatus,
        ticketService,
        ticketAssignee,
      });
      toast.success("Ticket created successfully!");
    } catch (error) {
      toast.error("Failed to create ticket. Please try again.");
      console.error("create ticket failed..");
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

  if (loading) {
    return (
      <div className="flex relative items-center justify-center h-full w-full">
        <Loading />
      </div>
    );
  }

  const basePath = pathname.split("/filter")[0];

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b-1 h-[60px] px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Tickets</h2>
          </div>
          <div className="px-2">
            <Button
              className="w-full"
              onClick={() => setCreateTicketModalOpen(true)}
              disabled={ticketLoading}
            >
              {ticketLoading ? "Loading..." : "Create Ticket"}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0 p-4">
          {tickets && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="rounded-xl shadow-sm  bg-[#E5ECF6] border-gray-200 dark:bg-card dark:border-gray-700 ">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-white text-[#1546BC] dark:bg-blue-900 dark:text-blue-300">
                      <Lock className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Open Tickets
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <CircularProgress
                    value={openTicketsCount}
                    max={tickets?.length || 100}
                    className="w-34 h-34  rounded-2xl"
                    progressColor="#063268"
                    trackColor="#FFFFFF"
                    strokeWidth={10}
                  >
                    <span className="text-3xl font-semibold text-black dark:text-blue-400">
                      {openTicketsCount}
                    </span>
                  </CircularProgress>
                </CardContent>
              </Card>
              <Card className="rounded-xl shadow-sm bg-[#E5ECF6] border-gray-200 dark:bg-card dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-white text-[#1546BC] dark:bg-blue-900 dark:text-blue-300">
                      <LineChart className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Pending Tickets
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <CircularProgress
                    value={pendingTicketsCount}
                    className="w-34 h-34  rounded-2xl"
                    progressColor="#063268"
                    trackColor="#FFFFFF"
                    strokeWidth={10}
                  >
                    <span className="text-3xl font-semibold text-black dark:text-blue-400">
                      {pendingTicketsCount}
                    </span>
                  </CircularProgress>
                </CardContent>
              </Card>
              <Card className="rounded-xl shadow-sm bg-[#E5ECF6] border-gray-200 dark:bg-card dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-white text-[#1546BC] dark:bg-blue-900 dark:text-blue-300">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Resolved Tickets
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <CircularProgress
                    value={resolvedTicketsCount}
                    className="w-34 h-34  rounded-2xl"
                    progressColor="#063268"
                    trackColor="#FFFFFF"
                    strokeWidth={10}
                  >
                    <span className="text-3xl font-semibold text-black dark:text-blue-400">
                      {resolvedTicketsCount}
                    </span>
                  </CircularProgress>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Filters */}
          {tickets && (
            <section className="bg-white sticky top-[0px] z-10 p-6 rounded-xl shadow-sm mb-8 border border-gray-200 dark:bg-card dark:border-gray-700">
              <div className="flex gap-4 items-center justify-between w-full">
                {/* <div className="flex flex-col w-full">
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                  >
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger
                      id="status"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
                <div className="flex flex-col w-full">
                  <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                  >
                    Priority
                  </label>
                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger
                      id="priority"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col w-full">
                  <label
                    htmlFor="assignee"
                    className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                  >
                    Assignee
                  </label>
                  <Select
                    value={assigneeFilter}
                    onValueChange={setAssigneeFilter}
                  >
                    <SelectTrigger
                      id="assignee"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <SelectValue placeholder="Select Assignee" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                      <SelectItem value="all">All</SelectItem>
                      {uniqueAssignees.map((assignee) => (
                        <SelectItem
                          key={assignee}
                          value={assignee.toLowerCase()}
                        >
                          {assignee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col w-full">
                  <label
                    htmlFor="creation-date"
                    className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                  >
                    Creation Date
                  </label>
                  <Select
                    value={creationDateFilter}
                    onValueChange={setCreationDateFilter}
                  >
                    <SelectTrigger
                      id="creation-date"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <SelectValue placeholder="Select Date" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last-week">Last Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          )}

          {/* Ticket List */}
          {tickets && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 dark:bg-card dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 text-sm font-semibold text-gray-500 pb-4 dark:text-gray-400 dark:border-gray-600">
                <div className="col-span-2">Title</div>
                <div>Status</div>
                <div>Priority</div>
                <div>Assignee</div>
                <div>Updated</div>
                <div>Created at</div>
              </div>
              {filteredTickets &&
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() =>
                      router.push(`${basePath}/${ticket.ticket_id}`)
                    }
                    className="grid grid-cols-1 md:grid-cols-7 gap-1 items-center py-1 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-accent/50 cursor-pointer text-black dark:text-blue-400"
                  >
                    <div className="col-span-2 flex items-center gap-2">
                      <Avatar className="w-14 h-14 border dark:border-gray-600 ml-2">
                        <AvatarImage
                          src={
                            ticket.user?.avatar ||
                            `/placeholder.svg?height=40&width=40&query=${encodeURIComponent(
                              ticket.user?.name || ticket.customer.email
                            )}`
                          }
                          alt={ticket.user?.name || ticket.customer.email}
                        />
                        <AvatarFallback className="dark:bg-gray-600 dark:text-gray-200">
                          {ticket.user?.name?.charAt(0).toUpperCase() ||
                            ticket.customer.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <div className="font-semibold text-gray-800 dark:text-gray-100">
                          {ticket.subject}
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          ID: {ticket.ticket_id}
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block w-fit dark:bg-blue-900 dark:text-blue-300">
                          {ticket.customer.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      {ticket.status}{" "}
                      {/*<ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />*/}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span
                        className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          ticket.priority === "High"
                            ? "bg-orange-500"
                            : ticket.priority === "Low"
                              ? "bg-green-500"
                              : "bg-gray-400"
                        )}
                      ></span>
                      {ticket.priority}{" "}
                      {/*<ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />*/}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      {ticket.user?.name || "Unassigned"}{" "}
                      {/*<ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />*/}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <RefreshCcw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      {formatDate(ticket.updated_at)}{" "}
                      {formatTime(ticket.updated_at)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      {formatDate(ticket.created_at)}{" "}
                      {formatTime(ticket.created_at)}
                    </div>
                  </div>
                ))}
            </section>
          )}

          {!tickets && (
            <div className="h-[76vh] flex flex-1 flex-col items-center justify-center text-center bg-background  backdrop-blur-sm transition-colors duration-300 ">
              {/* Image */}
              <div className="w-full flex justify-center">
                <Image
                  src={workPlaceholder}
                  alt="Empty chat illustration"
                  width={180}
                  height={180}
                  className="object-contain h-[180px] w-auto rounded-lg opacity-90 dark:opacity-80 transition-opacity duration-300"
                />
              </div>

              {/* Text */}
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 leading-snug">
                No Tickets Available
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto transition-colors">
                You dont have any support tickets yet. Once customers reach out
                through your chat widget, their inquiries will appear here.
              </p>
            </div>
          )}

          <Dialog
            open={createTicketModalOpen}
            onOpenChange={setCreateTicketModalOpen}
          >
            <DialogContent className="sm:max-w-5xl max-w-[90vw] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Create Ticket
                </DialogTitle>
                <DialogDescription>
                  Submit a support ticket on behalf of a user.
                </DialogDescription>
              </DialogHeader>

              {/* FORM GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
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

                {/* Customer Full Name */}
                <div className="grid gap-2">
                  <Label htmlFor="ticket-customer-name">
                    Customer Full Name
                  </Label>
                  <Input
                    id="ticket-customer-name"
                    placeholder="Enter customer full name"
                    value={ticketCustomerName}
                    onChange={(e) => setTicketCustomerName(e.target.value)}
                  />
                </div>

                {/* Reference Number */}
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
                    onValueChange={(value) => setTicketPriority(value)}
                  >
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
                    onValueChange={(value) => setTicketStatus(value)}
                  >
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
                    onValueChange={(value) => setTicketService(value)}
                  >
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

                {/* Assignee */}
                <div className="grid gap-2">
                  <Label htmlFor="ticket-assignee">Assignee</Label>
                  <Select
                    value={ticketAssignee}
                    onValueChange={(value) => setTicketAssignee(value)}
                  >
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
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="ticket-subject">Subject</Label>
                  <Input
                    id="ticket-subject"
                    placeholder="Enter subject"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="ticket-text">Description</Label>
                  <textarea
                    id="ticket-text"
                    rows={5}
                    className="w-full border rounded-md p-2"
                    placeholder="Enter HTML description"
                    value={ticketText}
                    onChange={(e) => setTicketText(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateTicketModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
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
                    )
                  }
                  disabled={!ticketEmail || !ticketSubject || !ticketText}
                >
                  Submit Ticket
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ScrollArea>
      </div>
    </div>
  );
}
