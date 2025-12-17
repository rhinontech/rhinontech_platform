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
import { fetchSupportEmails } from "@/services/tickets/ticketsService";
import { PanelLeft, PanelRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Loading from "@/app/loading";
import Image from "next/image";
import workPlaceholder from "@/assets/placeholders/workimg4.png";

const SupportEmails = () => {
  const router = useRouter();
  const { isSupportOpen, toggleSupportSidebar } = useSidebar();

  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"GMAIL" | "SUPPORT">("SUPPORT");
  const role = Cookies.get("currentRole");

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const supportEmails = await fetchSupportEmails();
      setEmails(supportEmails);
    } catch (err) {
      console.error("Error fetching support emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleEmailClick = (emailId: string | number) => {
    router.push(`/${role}/inbox/emails/support/${emailId}`);
  };

  const handleSourceChange = (value: "GMAIL" | "SUPPORT") => {
    if (value === "GMAIL") router.push(`/${role}/inbox/emails`);
    else setSource(value);
  };

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

            <Button onClick={() => fetchEmails()} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0 p-4">
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
                No support emails found
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto transition-colors">
                Support emails from your customers will appear here. Check back later or refresh to see new messages.
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
                  onClick={() => handleSourceChange("GMAIL")}
                  className="rounded-md px-6 border-border/40 hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors">
                  Switch to Gmail
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
                    {email.email?.replace(/"/g, "")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated: {new Date(email.updated_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    <span
                      dangerouslySetInnerHTML={{
                        __html:
                          email.conversations?.[0]?.text ||
                          "No content available",
                      }}
                    />
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default SupportEmails;
