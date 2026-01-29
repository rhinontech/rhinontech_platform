import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles, X, Send, MoreHorizontal, RefreshCw } from "lucide-react";
import Cookies from "js-cookie";
import { useCopilot } from "@/context/CopilotContext";

const AiHelp = () => {
  const { isOpen, setIsOpen, initialPrompt, setInitialPrompt, autoSend, setAutoSend } = useCopilot();
  const [messages, setMessages] = useState<any[]>([
    {
      id: crypto.randomUUID(),
      type: "assistant",
      content:
        "👋 Hey there! I'm your AI Co-Pilot. I can help you with code, emails, or tickets — what would you like to do today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_AI_URL;

  // ====== Auto-scroll ======
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // ====== Get latest ticket from localStorage ======
  const getTicketDetails = () => {
    try {
      const data = localStorage.getItem("ticketContent");
      if (!data) return null;
      const tickets = JSON.parse(data);
      return Array.isArray(tickets)
        ? tickets[tickets.length - 1] || null
        : tickets;
    } catch {
      return null;
    }
  };

  // ====== Create new AI session ======
  const createNewSession = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/copilot/session/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Session creation failed");
      const data = await res.json();
      Cookies.set("sessionId", data.session_id);
      setSessionId(data.session_id);
      return data.session_id;
    } catch (err) {
      console.error("Error creating session:", err);
      return null;
    }
  };

  // ====== Stream AI response ======
  const sendAiMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput("");
    setIsTyping(true);

    // add user message
    const userMsg = {
      id: crypto.randomUUID(),
      type: "user",
      content: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      let currentSession = sessionId;
      if (!currentSession) {
        currentSession = await createNewSession();
        if (!currentSession) throw new Error("Failed to start session");
      }

      // ---- Prepare ticket context ----
      const ticketDetails = getTicketDetails();
      const contextData = ticketDetails
        ? {
          ticket_info: {
            id: ticketDetails.id,
            subject: ticketDetails.title,
            status: ticketDetails.status,
            priority: ticketDetails.priority,
          },
          past_emails:
            ticketDetails.replies?.map((r: any) => {
              const cleaned = (r.content || "")
                .replace(/<style[\s\S]*?<\/style>/gi, "")
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .replace(/<head[\s\S]*?<\/head>/gi, "")
                .replace(/<meta[\s\S]*?>/gi, "")
                .replace(/<[^>]+>/g, "")
                .replace(/&nbsp;/gi, " ")
                .replace(/&amp;/gi, "&")
                .replace(/&lt;/gi, "<")
                .replace(/&gt;/gi, ">")
                .replace(/&#39;/gi, "'")
                .replace(/&quot;/gi, '"')
                .replace(/\s{2,}/g, " ")
                .trim();
              return { role: r.from, message: cleaned };
            }) || [],
        }
        : {};

      if (process.env.NODE_ENV === "development") {
        console.log("🧠 Context Data:", {
          ticket_id: contextData.ticket_info?.id,
          past_emails: contextData.past_emails?.length,
        });
      }

      // ---- Send request ----
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch(`${API_BASE_URL}/copilot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          session_id: currentSession,
          prompt: userText,
          context_data: contextData,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Streaming failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      // placeholder AI message
      const aiMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, type: "assistant", content: "", timestamp: new Date() },
      ]);

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const json = JSON.parse(line.slice(5).trim());
            if (json.content) {
              fullResponse += json.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, content: fullResponse } : m
                )
              );
            }
            if (json.done) setIsTyping(false);
          } catch { }
        }
      }
    } catch (err) {
      console.error("AI stream error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "assistant",
          content: "❌ Something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      abortControllerRef.current = null;
      setIsTyping(false);
    }
  }, [input, sessionId, isTyping]);

  // ====== Restore session ======
  useEffect(() => {
    const existing = Cookies.get("sessionId");
    if (existing) setSessionId(existing);
  }, []);

  // ====== Handle initial prompt ======
  const shouldAutoSendRef = useRef(false);

  useEffect(() => {
    if (isOpen && initialPrompt && inputRef.current) {
      setInput(initialPrompt);
      inputRef.current.focus();

      // Store auto-send flag
      if (autoSend) {
        shouldAutoSendRef.current = true;
        setAutoSend(false); // Reset immediately
      }

      setInitialPrompt(""); // Clear after setting
    }
  }, [isOpen, initialPrompt, setInitialPrompt, autoSend, setAutoSend]);

  // Auto-send after input is set
  useEffect(() => {
    if (shouldAutoSendRef.current && input && !isTyping) {
      shouldAutoSendRef.current = false;
      // Small delay to ensure everything is ready
      setTimeout(() => {
        sendAiMessage();
      }, 150);
    }
  }, [input, isTyping, sendAiMessage]);

  // ====== Clear chat ======
  const clearChat = () => {
    setMessages([messages[0]]);
    setSessionId(null);
    Cookies.remove("sessionId");
  };

  // ====== UI ======
  return (
    <>
      {/* Floating Button */}
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div className="relative mr-2" onClick={() => setIsOpen(!isOpen)}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-50" />
              <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">Co Pilot</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-gradient-to-br from-background via-background to-muted/20 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
              }`}>
            {/* Header */}
            <div className="relative border-b bg-background/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
              <div className="relative px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-50" />
                    <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                      AI Co-Pilot
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full border border-green-500/30">
                        Online
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Your intelligent assistant
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={clearChat}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.type === "user" ? "flex-row-reverse" : "flex-row"
                    }`}>
                  {m.type === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`flex-1 px-4 py-3 rounded-2xl ${m.type === "user"
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-12"
                      : "bg-muted/50 border mr-12"
                      }`}>
                    <p className="text-sm leading-relaxed">{m.content}</p>
                    <span
                      className={`text-xs mt-2 block ${m.type === "user"
                        ? "text-blue-100"
                        : "text-muted-foreground"
                        }`}>
                      {m.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-muted/50 border">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-background/80 backdrop-blur-xl p-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="w-full px-4 py-3 pr-12 rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendAiMessage();
                      }
                    }}
                  />
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-lg">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button> */}
                </div>
                <Button
                  onClick={sendAiMessage}
                  disabled={!input.trim() || isTyping}
                  className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all hover:scale-105 text-white"
                  size="icon">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AiHelp;
