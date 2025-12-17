"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebar } from "@/context/SidebarContext";
import { useTokenManager } from "@/hooks/userTokenManager";
import {
  gmailService,
  type GmailEmail,
} from "@/services/inbox/emails/emailService";
import { getUser } from "@/services/settings/accountServices";
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import Loading from "@/app/loading";
import Image from "next/image";
import workPlaceholder from "@/assets/placeholders/workimg4.png";

const Emails = () => {
  const router = useRouter();
  const { isSupportOpen, toggleSupportSidebar } = useSidebar();

  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const role = Cookies.get("currentRole");

  const [pageHistory, setPageHistory] = useState<string[]>([]); // stack of tokens
  const [currentPage, setCurrentPage] = useState(1);

  const emailsPerPage = 20; // same as Gmail default
  const [totalEmails, setTotalEmails] = useState<number | null>(null);

  const startIndex = (currentPage - 1) * emailsPerPage;
  const endIndex = Math.min(
    currentPage * emailsPerPage,
    totalEmails || startIndex + emails.length
  );

  const [source, setSource] = useState<"GMAIL" | "SUPPORT">("GMAIL");

  // Token manager
  useTokenManager("GOOGLE", fetchUserTokens);

  async function fetchUserTokens() {
    setLoading(true);
    try {
      const res = await getUser({ provider: "GOOGLE" });
      setGoogleToken(res?.data?.access_token || null);
    } catch (err) {
      console.error("Error fetching token:", err);
      setGoogleToken(null);
    } finally {
      setLoading(false);
    }
  }

  const fetchEmails = useCallback(
    async (pageToken?: string, isNext = false) => {
      if (!googleToken) return;
      if (pageToken) setIsFetchingMore(true);
      else setLoading(true);

      try {
        const {
          emails: fetchedEmails,
          nextPageToken,
          resultSizeEstimate,
        } = await gmailService.getAllEmails(googleToken, 20, pageToken);

        setEmails(fetchedEmails);
        setNextPageToken(nextPageToken || null);
        setTotalEmails(resultSizeEstimate || totalEmails);

        // Track pagination
        if (isNext) {
          setPageHistory((prev) => [...prev, pageToken || ""]);
          setCurrentPage((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Error fetching Gmail emails:", err);
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    },
    [googleToken, currentPage]
  );

  const handleNextPage = () => {
    if (nextPageToken) {
      fetchEmails(nextPageToken, true);
    }
  };

  const handlePrevPage = () => {
    if (pageHistory.length >= 1) {
      const newHistory = [...pageHistory];
      newHistory.pop(); // remove current
      const prevToken = newHistory[newHistory.length - 1];
      setPageHistory(newHistory);
      setCurrentPage((p) => Math.max(p - 1, 1));
      fetchEmails(prevToken);
    }
  };

  useEffect(() => {
    fetchUserTokens();
  }, []);

  useEffect(() => {
    if (googleToken) fetchEmails();
  }, [googleToken, fetchEmails]);

  const handleEmailClick = (emailId: string | number) => {
    router.push(`emails/${emailId}`);
  };

  const handleSourceChange = (value: "GMAIL" | "SUPPORT") => {
    if (value === "SUPPORT") router.push(`/${role}/inbox/emails/support`);
    else setSource(value);
  };

  const hasNoAccount = !googleToken && !loading;

  if (loading)
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
        <Loading areaOnly />
      </div>
    );

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b h-[60px] px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSupportSidebar}
              className="h-8 w-8">
              {isSupportOpen ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelRight className="h-4 w-4" />
              )}
            </Button>
            <h2 className="text-lg font-semibold">Emails</h2>
          </div>

          <div className="flex items-center gap-3">
            <Select value={source} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-[180px] border rounded-md text-sm">
                <SelectValue placeholder="Select Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GMAIL">Gmail</SelectItem>
                <SelectItem value="SUPPORT">Support Emails</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => fetchEmails()}
              disabled={loading || !googleToken}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Main Body */}
        <ScrollArea className="flex-1 h-0 p-4">
          {/* Show "No Connected Account" panel */}
          {hasNoAccount ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center py-12 px-4 bg-white dark:bg-background/30 backdrop-blur-sm transition-colors duration-300 rounded-2xl border border-border/30">
              <div className="w-full flex justify-center">
                <Image
                  src={workPlaceholder}
                  alt="No account connected illustration"
                  width={180}
                  height={180}
                  className="object-contain h-[180px] w-auto rounded-lg opacity-90 dark:opacity-80 transition-opacity duration-300"
                />
              </div>

              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 leading-snug mt-6">
                No Connected Account
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto transition-colors">
                Connect your Google or Microsoft account to access and manage your emails directly from here.
              </p>

              <div className="mt-6 flex gap-3 flex-wrap justify-center">
                <Button
                  onClick={() => router.push(`/${role}/settings/accounts`)}
                  className="rounded-md px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  Connect Account
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSourceChange("SUPPORT")}
                  className="rounded-md px-6 border-border/40 hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors">
                  View Support Emails
                </Button>
              </div>
            </div>
          ) : (
            <>
              {emails.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center py-12 px-4 bg-white dark:bg-background/30 backdrop-blur-sm transition-colors duration-300 rounded-2xl border border-border/30">
                  <div className="w-full flex justify-center">
                    <Image
                      src={workPlaceholder}
                      alt="No emails illustration"
                      width={180}
                      height={180}
                      className="object-contain h-[180px] w-auto rounded-lg opacity-90 dark:opacity-80 transition-opacity duration-300"
                    />
                  </div>

                  <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 leading-snug mt-6">
                    No emails found
                  </h1>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto transition-colors">
                    Your inbox is empty. New emails will appear here when they arrive.
                  </p>

                  <div className="mt-6 flex gap-3 flex-wrap justify-center">
                    <Button
                      onClick={() => fetchEmails()}
                      disabled={loading}
                      className="rounded-md px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      {loading ? "Refreshing..." : "Refresh"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSourceChange("SUPPORT")}
                      className="rounded-md px-6 border-border/40 hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors">
                      View Support Emails
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleEmailClick(email.id)}>
                      <h3 className="font-semibold">{email.subject}</h3>
                      <p className="text-sm text-muted-foreground">
                        {email.from}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {email.date
                          ? new Date(email.date).toLocaleString()
                          : "No date"}
                      </p>
                      {email.attachments?.length > 0 && (
                        <p className="text-xs text-blue-500 mt-1">
                          📎 {email.attachments.length} attachment(s)
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Gmail-style compact pagination */}
                  {(nextPageToken || currentPage > 1) && (
                    <div className="sticky bottom-0 flex items-center justify-end gap-3 px-4 py-2 border-t bg-background">
                      {/* Count Text */}
                      <span className="text-sm text-muted-foreground">
                        {startIndex + 1}–{endIndex} of {totalEmails ?? "…"}
                      </span>

                      {/* Prev Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1 || isFetchingMore}
                        className="h-8 w-8">
                        <ChevronLeft
                          className={`w-4 h-4 ${currentPage === 1
                            ? "text-muted-foreground/50"
                            : "text-foreground"
                            }`}
                        />
                      </Button>

                      {/* Next Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextPage}
                        disabled={!nextPageToken || isFetchingMore}
                        className="h-8 w-8">
                        <ChevronRight
                          className={`w-4 h-4 ${!nextPageToken
                            ? "text-muted-foreground/50"
                            : "text-foreground"
                            }`}
                        />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default Emails;
