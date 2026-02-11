import { useRef, useEffect } from "react";
import { SecureImage } from "@/components/Common/SecureImage";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PanelRight, PanelLeftOpen, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import AI_Prompt from "@/components/Common/ai-prompt";
import Image from "next/image";
import workPlaceholder from "@/assets/placeholders/workimg4.png";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface ChatWindowProps {
  selectedConversation: any;
  messages: any[];
  isOnline: boolean;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  readOnlyConversation: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  onSendMessage: (input: string, provider: string) => void;
  onOpenFile: (file: {
    url: string;
    name: string;
    type: "image" | "pdf";
  }) => void;
}

export function ChatWindow({
  selectedConversation,
  messages,
  isOnline,
  leftSidebarOpen,
  rightSidebarOpen,
  readOnlyConversation,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onSendMessage,
  onOpenFile,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const role = Cookies.get("currentRole");

  const router = useRouter();
  const getFileType = (fileName: string, fileUrl: string): "image" | "pdf" => {
    const extension = fileName.toLowerCase().split(".").pop();
    if (
      extension &&
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)
    ) {
      return "image";
    }
    if (extension === "pdf" || fileUrl.includes(".pdf")) {
      return "pdf";
    }
    return "image";
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center py-12 px-4 bg-white dark:bg-background/30 backdrop-blur-sm transition-colors duration-300 rounded-2xl border border-border/30">
        <div className="w-full flex justify-center">
          <Image
            src={workPlaceholder}
            alt="Empty chat illustration"
            width={180}
            height={180}
            className="object-contain h-[180px] w-auto rounded-lg opacity-90 dark:opacity-80 transition-opacity duration-300"
          />
        </div>

        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 leading-snug">
          Install chat widget to start chatting
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto transition-colors">
          Add a chat widget to your website to connect with visitors browsing
          your website.
        </p>

        <div className="mt-6 flex gap-3 flex-wrap justify-center">
          <Button
            onClick={() => router.push(`/${role}/settings/messenger`)}
            className="rounded-md px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Install Widget
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col w-full">
      <div className="flex items-center justify-between border-b h-[60px] p-4">
        <div className="flex items-center gap-3">
          {!leftSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleLeftSidebar}
              className="h-8 w-8">
              <PanelRight className="h-4 w-4" />
            </Button>
          )}
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={selectedConversation.avatar || "/placeholder.svg"}
              />
              <AvatarFallback>
                {selectedConversation.user_email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{selectedConversation.user_email}</h3>
            <p
              className="text-sm text-muted-foreground"
              style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleRightSidebar}
            className="h-8 w-8">
            {rightSidebarOpen ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 h-0 p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => {
            if (msg.role === "separator") {
              return (
                <div
                  key={i}
                  className="flex items-center my-4 text-center text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-muted" />
                  <span className="px-2 whitespace-nowrap">
                    Connected to Support
                  </span>
                  <div className="flex-1 h-px bg-muted" />
                </div>
              );
            }

            if (msg.role === "whatsapp_trigger") {
              return (
                <div key={i} className="flex justify-center">
                  <div className="rounded-md bg-amber-100 text-amber-800 px-4 py-2 text-center">
                    <p className="text-sm font-medium">WhatsApp connection sent</p>
                  </div>
                </div>
              );
            }

            if (msg.role === "trigger") {
              return (
                <div key={i} className="flex justify-center">
                  <div className="rounded-md bg-amber-100 text-amber-800 px-4 py-2 text-center">
                    <p className="text-sm font-medium">{msg.text}</p>
                  </div>
                </div>
              );
            }

            const isUser = msg.role === "user";

            return (
              <div
                key={i}
                className={cn(
                  "flex",
                  isUser ? "justify-start" : "justify-end"
                )}>
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2",
                    isUser
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  )}>
                  <div className="text-sm">
                    {/<a\s+href=.*<\/a>/i.test(msg.text) ? (
                      (() => {
                        const match = msg.text.match(
                          /href="([^"]+)".*>(.*?)<\/a>/i
                        );
                        const fileUrl = match ? match[1] : "";
                        const fileName = match ? match[2] : "Download file";
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                          fileName
                        );

                        return isImage ? (
                          <div
                            onClick={() =>
                              onOpenFile({
                                url: fileUrl,
                                name: fileName,
                                type: getFileType(fileName, fileUrl),
                              })
                            }
                            className="cursor-pointer block max-w-xs rounded-lg overflow-hidden border shadow-sm hover:opacity-90">
                            <SecureImage
                              src={fileUrl}
                              alt={fileName}
                              className="w-full h-auto"
                            />
                            <p className="text-xs text-gray-600 text-center truncate p-1 bg-gray-50">
                              {fileName}
                            </p>
                          </div>
                        ) : (
                          <div
                            onClick={() =>
                              onOpenFile({
                                url: fileUrl,
                                name: fileName,
                                type: getFileType(fileName, fileUrl),
                              })
                            }
                            className="cursor-pointer flex items-center gap-2 p-2 border rounded-lg bg-white shadow-sm hover:bg-gray-50">
                            📎
                            <div className="flex-1 truncate">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {fileName}
                              </p>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-sm">{msg.text}</p>
                    )}
                  </div>

                  <p
                    className={cn(
                      "mt-1 text-xs",
                      isUser
                        ? "text-muted-foreground"
                        : "text-primary-foreground/70"
                    )}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {selectedConversation.is_closed ? (
        <div className="p-2 text-center text-muted-foreground text-sm">
          This conversation is closed.
        </div>
      ) : readOnlyConversation ? (
        <div className="p-2 text-center text-muted-foreground text-sm">
          This is a past conversation (read-only).
        </div>
      ) : (
        <div className="p-1 flex justify-between">
          <div className="w-full">
            <AI_Prompt
              onSubmit={onSendMessage}
              isDummyData={false}
              conversationEmail={selectedConversation?.user_email}
              onWhatsAppTrigger={() => {
                // Send WhatsApp trigger message
                onSendMessage("whatsapp_trigger", "system");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
