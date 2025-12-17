"use client";

import Copilot from "@/components/Common/Copilot/Copilot";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { ChevronRight, PanelLeft, PanelRight, Loader2 } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ReplyComposer } from "./ReplyComposer/ReplyComposer";
import {
  fetchSupportByEmailID,
  mergeSupportEmailToTicket,
} from "@/services/tickets/ticketsService";
import TICKET_INPUT from "@/components/Common/ticket-input";
import { fetchTickets } from "@/services/tickets/ticketsService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Loading from "@/app/loading";

const SupportEmailDetail = () => {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const emailId = params.id as string;

  const { setIsSupportOpen } = useSidebar();
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  const [emailData, setEmailData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set()
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFetchingTickets, setIsFetchingTickets] = useState(false);

  //  Fetch support email data
  const fetchEmailThread = useCallback(async () => {
    if (!emailId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSupportByEmailID(Number(emailId));
      setEmailData(data);

      if (data?.conversations?.length > 0) {
        const lastConv =
          data.conversations[data.conversations.length - 1].messageId;
        setExpandedMessages(new Set([lastConv]));
      }
    } catch (err) {
      console.error("Error fetching support email:", err);
      setError("Failed to load support email");
    } finally {
      setLoading(false);
    }
  }, [emailId]);

  useEffect(() => {
    setIsSupportOpen(false);
    fetchEmailThread();
  }, [fetchEmailThread]);

  const loadTickets = async () => {
    try {
      setIsFetchingTickets(true);
      const response = await fetchTickets();
      setTickets(response || []);
      setFilteredTickets(response || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setIsFetchingTickets(false);
    }
  };

  const handleMerge = async (emailId: number, ticketId?: string | null) => {
    try {
      await mergeSupportEmailToTicket(emailId, ticketId);
      console.log(emailId, ticketId);

      // Update state instantly so UI shows merged status
      setEmailData((prev: any) => ({
        ...prev,
        ticket_id: ticketId || "NEW_TICKET_CREATED",
      }));

      toast.success(
        ticketId ? "Merged to existing ticket" : "New ticket created"
      );
    } catch (err) {
      console.error("Merge failed:", err);
      toast.error("Failed to merge email");
    }
  };

  const toggleMessage = (id: string) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    setFilteredTickets(
      tickets.filter(
        (t) =>
          t.subject?.toLowerCase().includes(value) ||
          t.ticket_id?.toLowerCase().includes(value)
      )
    );
  };

  const basePath = pathname.split("/").slice(0, -1).join("/");

  // --- RENDER ---
  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b h-[60px] px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span
                className="text-primary hover:underline cursor-pointer"
                onClick={() => router.push(basePath)}>
                Support Emails
              </span>
              <ChevronRight size={20} />
              {loading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                <span className="truncate max-w-md">
                  {emailData?.subject || "Email"}
                </span>
              )}
            </h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="h-8 w-8">
            {rightSidebarOpen ? (
              <PanelRight className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 h-0 p-4">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <Loading areaOnly />
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {!loading && !error && emailData && (
              <div className="space-y-6">
                {emailData.conversations?.map((conv: any, index: number) => {
                  const isExpanded = expandedMessages.has(conv.messageId);
                  const isLatest = index === emailData.conversations.length - 1;

                  return (
                    <div
                      key={conv.messageId}
                      className={cn(
                        "border rounded-lg overflow-hidden",
                        isLatest ? "bg-accent/30" : ""
                      )}>
                      <div
                        className="p-4 cursor-pointer hover:bg-accent/50"
                        onClick={() => toggleMessage(conv.messageId)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold capitalize">
                                {emailData.email?.replace(/"/g, "")}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Message ID:{" "}
                              {conv.messageId
                                ? `${conv.messageId.slice(0, 25)}...`
                                : "N/A"}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(conv.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <ChevronRight
                            className={cn(
                              "h-5 w-5 text-muted-foreground transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 pt-0 space-y-4 border-t">
                          <div
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: conv.text }}
                          />

                          {conv.attachments?.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">
                                Attachments ({conv.attachments.length})
                              </h4>
                              {conv.attachments.map((a: any, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 p-2 border rounded-md">
                                  <span className="text-sm">
                                    📎 {a.filename}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {(a.size / 1024).toFixed(2)} KB
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex gap-4 mt-4">
                  {emailData.ticket_id ? (
                    <div className="flex flex-col items-start gap-2 border rounded-md p-3 bg-green-50 dark:bg-green-900/20">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        This email has been merged with ticket:
                      </p>
                      <p className="text-sm text-foreground font-semibold">
                        #{emailData.ticket_id}
                      </p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(true);
                        loadTickets();
                      }}>
                      Add To Ticket
                    </Button>
                  )}
                </div>

                {/* Reply + Note Buttons */}
                {/* <div className="flex gap-4 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowReplyComposer(!showReplyComposer)}>
                    Reply
                  </Button>
                  <Button variant="outline">Note</Button>
                </div>

                {showReplyComposer && (
                  <TICKET_INPUT onSubmit={()=>console.log("click")} setAttachment={setActiveTab}/>
                )} */}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col transition-all duration-300 ease-in-out",
          rightSidebarOpen ? "w-96 border-l" : "w-0 overflow-hidden",
          activeTab === "details" && " bg-muted/30",
          activeTab === "copilot" && "bg-background"
        )}>
        {rightSidebarOpen && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-full gap-0">
            <div className="flex items-center justify-between border-b h-[60px] p-4 w-full">
              <TabsList className="w-full">
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
            </div>

            {/* Details Sidebar */}
            <TabsContent value="details" className="flex-1 overflow-auto p-4">
              <ScrollArea>
                {emailData && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Email ID</h4>
                      <p className="text-sm text-muted-foreground break-all">
                        {emailData.id}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Thread ID</h4>
                      <p className="text-sm text-muted-foreground break-all">
                        {emailData.email_thread_id}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Subject</h4>
                      <p className="text-sm text-muted-foreground">
                        {emailData.subject}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Messages</h4>
                      <p className="text-sm text-muted-foreground">
                        {emailData.conversations?.length}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Created At</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(emailData.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Updated</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(emailData.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Ticket to Merge</DialogTitle>
          </DialogHeader>

          {isFetchingTickets ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Search bar */}
              <Input
                placeholder="Search by ticket ID or subject..."
                value={searchTerm}
                onChange={handleSearch}
                className="mb-4"
              />

              {/* Ticket list */}
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {/* Create new ticket option */}
                <div
                  onClick={() => {
                    setIsDialogOpen(false);
                    handleMerge(emailData.id, null);
                    // TODO: mergeSupportEmailToTicket(emailData.id, null)
                  }}
                  className="p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors text-center text-primary font-medium">
                  ➕ Create New Ticket
                </div>

                {/* Existing tickets */}
                {filteredTickets.filter((t) => t.status !== "Resolved")
                  .length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    No active tickets found
                  </p>
                ) : (
                  filteredTickets
                    .filter((t) => t.status !== "Resolved") //  filter out resolved tickets
                    .map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setIsDialogOpen(false);
                          handleMerge(emailData.id, t.ticket_id);
                          // TODO: mergeSupportEmailToTicket(emailData.id, t.ticket_id)
                        }}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">{t.subject}</p>
                          <span className="text-xs text-muted-foreground">
                            {t.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          #{t.ticket_id} — {t.priority}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportEmailDetail;
