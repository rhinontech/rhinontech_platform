"use client";

import Copilot from "@/components/Common/Copilot/Copilot";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import {
  gmailService,
  type GmailEmail,
  type GmailThread,
} from "@/services/inbox/emails/emailService";
import { ChevronRight, PanelLeft, PanelRight, Loader2 } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ReplyComposer } from "./ReplyComposer/ReplyComposer";
import { useTokenManager } from "@/hooks/userTokenManager";
import { getUser } from "@/services/settings/accountServices";
import {
  fetchTickets,
  mergeGmailEmailToTicket,
} from "@/services/tickets/ticketsService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Loading from "@/app/loading";

const EmailDetail = () => {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const emailId = params.id as string;

  const { setIsSupportOpen } = useSidebar();
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  const [thread, setThread] = useState<GmailThread | null>(null);
  const [email, setEmail] = useState<GmailEmail | null>(null);
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

  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState(false);

  // --- Auto-refresh expired token ---
  useTokenManager("GOOGLE", () => {
    console.log("Google token updated in EmailDetail");
    fetchUserTokens();
  });

  // --- Fetch token from backend ---
  const fetchUserTokens = useCallback(async () => {
    setIsFetchingToken(true);
    try {
      const googleRes = await getUser({ provider: "GOOGLE" });
      if (googleRes?.data?.access_token) {
        setGoogleToken(googleRes.data.access_token);
        localStorage.setItem(
          "googleRefreshToken",
          googleRes.data.refresh_token
        );
        localStorage.setItem("googleTokenExpiry", googleRes.data.expires_in);
        console.log("Google token fetched:", googleRes.data);
      } else {
        console.warn("No Google token found");
      }
    } catch (err) {
      console.error("Error fetching Google token:", err);
    } finally {
      setIsFetchingToken(false);
    }
  }, []);

  // --- Fetch email + thread ---
  const fetchEmailAndThread = useCallback(async () => {
    if (!googleToken || !emailId) return;

    setLoading(true);
    setError(null);
    try {
      const fetchedEmail = await gmailService.getEmailById(
        googleToken,
        emailId
      );
      setEmail(fetchedEmail);

      const fetchedThread = await gmailService.getThreadById(
        googleToken,
        fetchedEmail.threadId
      );
      setThread(fetchedThread);

      // Expand latest message
      if (fetchedThread.messages.length > 0) {
        const latestId =
          fetchedThread.messages[fetchedThread.messages.length - 1].id;
        setExpandedMessages(new Set([latestId]));
      }

      console.log("Email:", fetchedEmail);
      console.log("Thread:", fetchedThread);
    } catch (err) {
      setError("Failed to fetch email and thread");
      console.error("Error fetching email/thread:", err);
    } finally {
      setLoading(false);
    }
  }, [googleToken, emailId]);

  // --- Initial Mount ---
  useEffect(() => {
    setIsSupportOpen(false);
    fetchUserTokens();
  }, [fetchUserTokens]);

  // --- Refetch when token is ready ---
  useEffect(() => {
    if (googleToken) {
      fetchEmailAndThread();
    }
  }, [googleToken, fetchEmailAndThread]);

  const handleReplySend = async (content: string) => {
    console.log("Reply content:", content);
    setShowReplyComposer(false);
    await fetchEmailAndThread();
  };

  const basePath = pathname.split("/").slice(0, -1).join("/");

  const toggleMessage = (id: string) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleMerge = async (ticketId?: string | null) => {
    if (!thread) return;

    const conversations = thread.messages.map((msg) => ({
      role: "customer",
      text: msg.html || msg.snippet || "",
      timestamp: msg.date || new Date().toISOString(),
      attachments: msg.attachments || [],
    }));

    // Extract only the email address from "Name <email@domain.com>"
    const rawFrom = email?.from || "";
    const emailAddressMatch = rawFrom.match(/<([^>]+)>/);
    const senderEmail = emailAddressMatch
      ? emailAddressMatch[1]
      : rawFrom.replace(/['"]/g, "").trim(); // fallback if no <>

    try {
      await mergeGmailEmailToTicket(
        conversations,
        senderEmail,
        ticketId,
        email?.subject
      );
      console.log(ticketId, conversations, senderEmail);

      toast.success(
        ticketId ? "Merged to existing ticket" : "New ticket created"
      );
    } catch (err) {
      console.error("Merge failed:", err);
      toast.error("Failed to merge conversation");
    }
  };

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

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b-1 h-[60px] px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span
                className="text-primary hover:underline cursor-pointer"
                onClick={() => router.push(basePath)}>
                Emails
              </span>
              <ChevronRight size={20} />
              {loading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                <span className="truncate max-w-md">
                  {email?.subject || "Email"}
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
            {(loading || isFetchingToken) && (
              <div className="flex items-center justify-center h-full">
                <Loading areaOnly />
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {!loading && !error && thread && (
              <div className="space-y-6">
                {thread.messages.map((msg, index) => {
                  const isExpanded = expandedMessages.has(msg.id);
                  const isLatest = index === thread.messages.length - 1;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "border rounded-lg overflow-hidden",
                        isLatest ? "bg-accent/30" : ""
                      )}>
                      <div
                        className="p-4 cursor-pointer hover:bg-accent/50"
                        onClick={() => toggleMessage(msg.id)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{msg.subject}</h3>
                              {msg.attachments.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  📎 {msg.attachments.length}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              From: {msg.from}
                            </p>
                            {msg.date && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.date).toLocaleDateString()}{" "}
                                {new Date(msg.date).toLocaleTimeString()}
                              </span>
                            )}
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
                        <div className="p-4 pt-0 space-y-4">
                          {(msg.to || msg.cc) && (
                            <div className="text-sm space-y-1">
                              {msg.to && (
                                <p className="text-muted-foreground">
                                  To: {msg.to}
                                </p>
                              )}
                              {msg.cc && (
                                <p className="text-muted-foreground">
                                  Cc: {msg.cc}
                                </p>
                              )}
                            </div>
                          )}
                          {msg.attachments.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">
                                Attachments ({msg.attachments.length})
                              </h4>
                              {msg.attachments.map((a, i) => (
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
                          {msg.html ? (
                            <iframe
                              srcDoc={msg.html}
                              className="w-full min-h-[400px] border-0 bg-white rounded"
                              sandbox="allow-same-origin"
                              title={`Email ${index + 1}`}
                            />
                          ) : (
                            <p className="text-muted-foreground">No content</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(true);
                    loadTickets();
                  }}>
                  Add To Ticket
                </Button>

                {/* <div className="flex gap-4 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowReplyComposer(!showReplyComposer)}>
                    Reply
                  </Button>
                  <Button variant="outline">Note</Button>
                </div>

                {showReplyComposer && email && (
                  <TICKET_INPUT
                    onSubmit={() => console.log("click")}
                    setAttachment={setActiveTab}
                  />
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

            <TabsContent value="details" className="flex-1 overflow-auto p-4">
              <ScrollArea>
                {thread && email && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Thread ID</h4>
                      <p className="text-sm text-muted-foreground break-all">
                        {thread.id}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Messages in Thread
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {thread.messages.length}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Current Email ID
                      </h4>
                      <p className="text-sm text-muted-foreground break-all">
                        {email.id}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">From</h4>
                      <p className="text-sm text-muted-foreground">
                        {email.from}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Subject</h4>
                      <p className="text-sm text-muted-foreground">
                        {email.subject}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Date</h4>
                      <p className="text-sm text-muted-foreground">
                        {email.date
                          ? new Date(email.date).toLocaleString()
                          : "No date"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Total Attachments
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {thread.messages.reduce(
                          (acc, msg) => acc + msg.attachments.length,
                          0
                        )}{" "}
                        file(s)
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
              <Input
                placeholder="Search by ticket ID or subject..."
                value={searchTerm}
                onChange={handleSearch}
                className="mb-4"
              />

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {/* Create new ticket option */}
                <div
                  onClick={() => {
                    setIsDialogOpen(false);
                    handleMerge(null);
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
                    .filter((t) => t.status !== "Resolved")
                    .map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setIsDialogOpen(false);
                          handleMerge(t.ticket_id);
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

export default EmailDetail;
