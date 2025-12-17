import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, X, MessageCircle } from "lucide-react";
import { TbPin } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { ChatSkeleton } from "@/components/Common/Skeleton/Skeleton";
import Loading from "@/app/loading";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: any[];
  selectedConversation: any;
  onSelectConversation: (conv: any) => void;
  loading: boolean;
}

export function ChatSidebar({
  isOpen,
  onClose,
  conversations,
  selectedConversation,
  onSelectConversation,
  loading,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const extractText = (html: string): string => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const timeAgo = (timestamp: string | number | Date): string => {
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
  };

  const filteredConversations = conversations.filter((c) => {
    const email = (c.user_email || "").toLowerCase();
    const search = searchQuery.toLowerCase();
    return email.includes(search);
  });

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-muted/30 transition-all duration-300 ease-in-out",
        isOpen ? "w-72" : "w-0 overflow-hidden"
      )}>
      {isOpen && (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loading areaOnly />
            </div>
          ) : (
            <>
              {/* Sidebar Header */}
              <div className="flex items-center justify-between h-[60px] px-4 border-b sticky top-0 z-10">
                <h2 className="text-lg font-semibold">Chats</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search Bar */}
              {conversations.length !== 0 && (
                <div className="px-5 py-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary text-sm shadow-sm transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Conversation List */}
              <ScrollArea className="flex-1 h-0">
                <div className="space-y-1 p-2">
                  {filteredConversations.map((c) => (
                    <div
                      key={c.id}
                      className={cn(
                        "flex cursor-pointer relative items-center gap-3 rounded-xl px-3 py-3 transition-all group hover:border-primary/20 hover:bg-primary/5",
                        selectedConversation?.id === c.id && "bg-primary/15"
                      )}
                      onClick={() => onSelectConversation(c)}>
                      <div className="relative">
                        <Avatar className="h-11 w-11 bg-primary/5">
                          <AvatarImage src={c.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="font-semibold bg-primary/5">
                            {c.user_email?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {c.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500 shadow" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className="font-medium truncate max-w-[140px] text-sm"
                            title={c.user_email}>
                            {c.user_email || ""}
                          </p>
                          <div className="flex items-center gap-1">
                            {c.is_pinned && (
                              <TbPin className="h-3.5 w-3.5 text-primary/60" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <p className="text-xs text-muted-foreground truncate max-w-[80px] mt-0.5">
                            {extractText(
                              c.messages[c.messages.length - 1].text
                            )}
                          </p>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {timeAgo(
                              c.messages[c.messages.length - 1].timestamp
                            )}
                          </span>
                        </div>
                      </div>

                      {c.is_new && (
                        <Badge
                          variant="default"
                          className="h-5 absolute right-[10px] top-[14px] min-w-5 text-xs">
                          New
                        </Badge>
                      )}
                      {c.has_whatsapp_unread && (
                        <div className="absolute right-[45px] top-[14px] bg-[#25D366] text-white rounded-full p-1" title="New WhatsApp Message">
                          <MessageCircle className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
                  {conversations.length === 0 && <ChatSkeleton />}
                </div>
              </ScrollArea>
            </>
          )}
        </>
      )}
    </div>
  );
}
