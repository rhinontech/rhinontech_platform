import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowUp, Loader2, Sparkles, User, Bot } from "lucide-react";
import Cookies from "js-cookie";

interface Message {
  role: "ai" | "user";
  text: string;
  timestamp?: Date;
  isStreaming?: boolean;
}

interface ContextData {
  past_emails?: Array<{
    subject: string;
    content: string;
  }>;
  past_chats?: Array<{
    role: string;
    message: string;
  }>;
  ticket_info?: {
    id: string;
    subject: string;
    status: string;
    priority: string;
  };
}

const Copilot = ({ ticketDetails }: { ticketDetails: any }) => {
  const [input, setInput] = useState("");
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "👋 Hello! I'm your co-pilot assistant. I can help you draft emails, provide suggestions based on context, and assist with ticket management. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [contextData, setContextData] = useState<ContextData | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (sessionId && aiMessages.length > 0) {
      localStorage.setItem("copilot_messages", JSON.stringify(aiMessages));
    }
  }, [aiMessages, sessionId]);

  useEffect(() => {
    const existingSessionId = Cookies.get("sessionId");
    if (existingSessionId) {
      setSessionId(existingSessionId);
      const savedMessages = localStorage.getItem("copilot_messages");
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        const restored = parsed.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
        }));
        setAiMessages(restored);
      }
    }
  }, []);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_AI_URL;

  const sampleContextData: ContextData = {
    past_emails: ticketDetails.conversations,
    ticket_info: {
      id: ticketDetails.ticket_id,
      subject: ticketDetails.subject,
      status: ticketDetails.status,
      priority: ticketDetails.priority,
    },
  };

  const createNewSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/copilot/session/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to create session");
      const data = await response.json();
      setSessionId(data.session_id);
      Cookies.set("sessionId", data.session_id);
      return data.session_id;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  };

  const sendAiMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);

    setAiMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage, timestamp: new Date() },
    ]);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await createNewSession();
        if (!currentSessionId) throw new Error("Failed to create session");
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const aiMessageIndex = aiMessages.length + 1;
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", text: "", timestamp: new Date(), isStreaming: true },
      ]);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      abortControllerRef.current = controller;

      const response = await fetch(`${API_BASE_URL}/copilot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          session_id: currentSessionId,
          prompt: userMessage,
          context_data: contextData || sampleContextData,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body reader available");

      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              const data = JSON.parse(jsonStr);

              if (data.session_id && !sessionId) {
                setSessionId(data.session_id);
              }

              if (data.content !== undefined) {
                fullResponse += data.content;
                setAiMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex]?.role === "ai") {
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      text: fullResponse,
                      isStreaming: true,
                    };
                  }
                  return newMessages;
                });
              }

              if (data.error) {
                setAiMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex]?.role === "ai") {
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      text: `❌ Error: ${data.error}`,
                      isStreaming: false,
                    };
                  }
                  return newMessages;
                });
                return;
              }

              if (data.done) {
                setAiMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex]?.role === "ai") {
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      isStreaming: false,
                    };
                  }
                  return newMessages;
                });
                return;
              }
            } catch (e) {
              console.error("Error parsing streaming data:", e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error.name === "AbortError") return;

      setAiMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (newMessages[lastIndex]?.role === "ai") {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            text: "❌ Sorry, I encountered an error. Please try again.",
            isStreaming: false,
          };
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, sessionId, contextData, aiMessages.length]);

  const clearSession = async () => {
    if (sessionId) {
      try {
        await fetch(`${API_BASE_URL}/copilot/session/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch (error) {
        console.error("Error clearing session:", error);
      }
      localStorage.removeItem(`copilot_messages_${sessionId}`);
    }
    Cookies.remove("sessionId");
    setSessionId(null);
    setAiMessages([
      {
        role: "ai",
        text: "🔄 New session started! How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/10 to-orange-400/10 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />

      {/* Header */}
      {/* <div className="relative flex items-center justify-between px-4 py-3 border-b border-border/40 backdrop-blur-xl bg-background/80 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">
              AI Copilot
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Always here to help
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSession}
          disabled={isLoading}
          className="text-xs hover:bg-accent/50"
        >
          New Chat
        </Button>
      </div> */}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative z-10">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {aiMessages.map((msg, index) => (
              <div
                key={index}
                className="flex gap-3 items-start group animate-in fade-in slide-in-from-bottom-3 duration-500"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                  {msg.role === "ai" ? (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow">
                      <Bot size={16} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {msg.role === "ai" ? "Copilot" : "You"}
                    </span>
                    {msg.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 shadow-sm transition-all duration-200",
                      msg.role === "ai"
                        ? "bg-muted/60 backdrop-blur-sm border border-border/50 group-hover:bg-muted/80"
                        : "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                    )}
                  >
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </div>

                    {/* Streaming Indicator */}
                    {msg.isStreaming && (
                      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/30">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-pink-500 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                        <span className="text-xs ml-2 opacity-70">
                          Thinking...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="relative border-t border-border/40 bg-background/90 backdrop-blur-xl z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isLoading ? "Copilot is thinking..." : "Ask me anything..."
              }
              className="w-full h-14 pl-5 pr-14 rounded-2xl border-2 border-border/60 bg-muted/30 hover:bg-muted/50 focus:bg-background focus:border-purple-500/50 transition-all text-base shadow-sm placeholder:text-muted-foreground/60"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendAiMessage();
                }
              }}
            />
            <button
              onClick={sendAiMessage}
              disabled={isLoading || !input.trim()}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg",
                input.trim() && !isLoading
                  ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:shadow-purple-500/50 hover:scale-105 text-white"
                  : "bg-muted/80 text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground/60 text-center mt-3">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Copilot;
