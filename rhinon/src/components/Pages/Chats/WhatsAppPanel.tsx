"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Phone,
  Send,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  FileIcon,
  AudioLines,
  Download,
  ExternalLink,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getWhatsAppMessages,
  sendWhatsAppMessage,
  getWhatsAppContacts,
  getWhatsAppAccounts,
  getWhatsAppTemplates,
  getWhatsAppMediaUrl,
  uploadWhatsAppMedia,
  type WhatsAppAccount,
  type WhatsAppMessage
} from "@/services/settings/whatsappServices";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSocket } from "@/services/webSocket";
import { useUserStore } from "@/utils/store";
import { FileViewerModal } from "@/components/Common/FileViewerModal/FileViewerModal";

interface WhatsAppPanelProps {
  selectedConversation: any;
  isOnline: boolean;
}

export function WhatsAppPanel({ selectedConversation, isOnline }: WhatsAppPanelProps) {
  // core
  const [whatsappMessages, setWhatsappMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contactId, setContactId] = useState<number | null>(null);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // accounts & templates
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);

  // input state
  const [inputMode, setInputMode] = useState<"text" | "template">("text");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // template input state
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});
  const [templatePreview, setTemplatePreview] = useState("");

  // file viewer
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string; type: "image" | "pdf" | "video" } | null>(null);

  const { userData } = useUserStore();
  const socket = getSocket();


  const normalizePhone = (phone: string) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  };

  const fetchWhatsAppHistory = async (phoneNumber: string, accountId: number) => {
    setLoading(true);
    setWaitingForUser(false);
    setWhatsappMessages([]);
    try {
      // Pass accountId to getWhatsAppContacts to filter by default account
      const contacts = await getWhatsAppContacts(accountId);

      const normalizedInput = normalizePhone(phoneNumber);

      const contact = contacts.find((c: any) => {
        const normalizedContact = normalizePhone(c.phone_number);
        if (normalizedInput.length > 6 && normalizedContact.length > 6) {
          return normalizedInput.endsWith(normalizedContact) || normalizedContact.endsWith(normalizedInput);
        }
        return normalizedInput === normalizedContact;
      });

      if (contact) {
        setContactId(contact.id);
        const data = await getWhatsAppMessages(contact.id);
        if (data && data.messages && data.messages.length > 0) {
          setWhatsappMessages(data.messages);
        } else {
          setWaitingForUser(true);
        }
      } else {
        setWaitingForUser(true);
      }
    } catch (error) {
      console.error("Failed to fetch WhatsApp history", error);
      setWaitingForUser(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAccount || !selectedConversation) return;

    try {
      setIsSending(true);

      // Determine WhatsApp message type based on MIME type
      let type: "image" | "video" | "document" | "audio" = "document";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";
      else if (file.type.startsWith("audio/")) type = "audio";

      // 1. Upload Media to get ID
      const uploadRes = await uploadWhatsAppMedia(file, selectedAccount);

      if (uploadRes && uploadRes.media_id) {
        // 2. Send Message with Media ID
        await sendWhatsAppMessage({
          account_id: selectedAccount,
          to: selectedConversation.phone_number,
          type: type,
          media: {
            link: uploadRes.media_id, // We pass the ID as the 'link' for the API to use
            caption: file.name
          }
        });

        // Clear input
        if (fileInputRef.current) fileInputRef.current.value = "";
      }

    } catch (error) {
      console.error("Failed to send media:", error);
      // You might want to show a toast error here
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation?.phone_number || !selectedAccount) return;

    try {
      setIsSending(true);
      await sendWhatsAppMessage({
        account_id: selectedAccount,
        to: selectedConversation.phone_number,
        type: "text",
        text: { body: message }
      });

      // Optimistic update
      const tempId = Date.now();
      const newMessage = {
        id: tempId,
        content: message,
        direction: "outbound",
        created_at: new Date().toISOString(),
        status: "sent"
      };
      setWhatsappMessages(prev => [...prev, newMessage]);
      setMessage("");
    } catch (error) {
      console.error("Send failed", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !selectedAccount || !selectedConversation?.phone_number) return;

    const bodyComponent = selectedTemplate.components?.find((c: any) => c.type === "BODY");
    const paramMatches = bodyComponent?.text?.match(/\{\{(\d+)\}\}/g);

    // Validation
    if (paramMatches) {
      const allFilled = paramMatches.every((match: string) => {
        const paramNum = match.match(/\d+/)?.[0];
        return paramNum && templateParams[paramNum]?.trim();
      });
      if (!allFilled) {
        toast.error("Please fill all template parameters");
        return;
      }
    }

    try {
      setIsSending(true);
      // Build params
      const paramArray = Object.keys(templateParams)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => ({ type: "text", text: templateParams[key] }));

      await sendWhatsAppMessage({
        account_id: selectedAccount,
        to: selectedConversation.phone_number,
        type: "template",
        template: {
          name: selectedTemplate.name,
          language: { code: selectedTemplate.language },
          components: paramArray.length > 0 ? [{ type: "body", parameters: paramArray }] : undefined
        }
      });

      toast.success("Template sent!");

      // Optimistic update for template? Harder to visualize without parsing, maybe just wait for socket or re-fetch.
      // For now let's just clear inputs.
      setSelectedTemplate(null);
      setTemplateParams({});
      setInputMode("text");
      // Trigger a refresh after a delay or optimistically add a placeholder

      const tempId = Date.now();
      const newMessage = {
        id: tempId,
        content: `Template: ${selectedTemplate.name}`, // Simple placeholder
        direction: "outbound",
        created_at: new Date().toISOString(),
        status: "sent"
      };
      setWhatsappMessages(prev => [...prev, newMessage]);

    } catch (error) {
      console.error("Failed to send template", error);
      toast.error("Failed to send template");
    } finally {
      setIsSending(false);
    }
  };

  const getTemplateParamCount = (tmpl: any) => {
    const bodyComponent = tmpl.components?.find((c: any) => c.type === "BODY");
    const matches = bodyComponent?.text?.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.length : 0;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Check className="h-3 w-3 text-muted-foreground" />;
      case "delivered": return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "read": return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Select a conversation</p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // EFFECTS (Moved to bottom to access hoisted functions)
  // ------------------------------------------------------------------

  // 1. Fetch Accounts on Mount
  useEffect(() => {
    const initAccounts = async () => {
      try {
        const data = await getWhatsAppAccounts();
        const activeAccounts = (data || []).filter(acc => acc.status === "active");
        setAccounts(activeAccounts);

        // Find default
        const def = activeAccounts.find(a => a.is_default) || activeAccounts[0];
        if (def) {
          setSelectedAccount(def.id);
        }
      } catch (e) {
        console.error("Failed to load WhatsApp accounts", e);
      }
    };
    initAccounts();
  }, []);

  // 2. Fetch Templates when Account Changes
  useEffect(() => {
    if (selectedAccount) {
      const fetchTemplates = async () => {
        try {
          const data = await getWhatsAppTemplates(selectedAccount);
          // Filter approved templates
          setTemplates((data || []).filter((t: any) => t.status === "APPROVED"));
        } catch (e) {
          console.error("Failed to load templates", e);
        }
      };
      fetchTemplates();
    }
  }, [selectedAccount]);

  // 3. Fetch History (scoped to Account & Conversation)
  useEffect(() => {
    if (selectedConversation?.phone_number && selectedAccount) {
      fetchWhatsAppHistory(selectedConversation.phone_number, selectedAccount);
    } else if (!selectedConversation?.phone_number) {
      setWaitingForUser(true);
    }
  }, [selectedConversation, selectedAccount]);


  // Socket: Real-time Messages
  useEffect(() => {
    if (userData?.orgId && socket) {
      socket.emit("join_org", { organization_id: userData.orgId });

      const handleMsg = (data: any) => {
        const msg = data.message;
        const phone = selectedConversation?.phone_number;

        if (!phone || !selectedAccount) return;

        // Strict account check
        if (msg.account_id !== selectedAccount) return;

        // Fuzzy match phone
        const normMsgFrom = normalizePhone(msg.from_number);
        const normMsgTo = normalizePhone(msg.to_number);
        const normSelected = normalizePhone(phone);

        const isMatch = (normMsgFrom && normSelected && (normMsgFrom.includes(normSelected) || normSelected.includes(normMsgFrom))) ||
          (normMsgTo && normSelected && (normMsgTo.includes(normSelected) || normSelected.includes(normMsgTo)));

        if (isMatch) {
          setWhatsappMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setWaitingForUser(false);
        }
      };

      socket.on("whatsapp:message:received", handleMsg);
      socket.on("whatsapp:message:sent", handleMsg);

      return () => {
        socket.off("whatsapp:message:received", handleMsg);
        socket.off("whatsapp:message:sent", handleMsg);
      };
    }
  }, [userData?.orgId, selectedConversation, selectedAccount]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [whatsappMessages, loading, waitingForUser, inputMode]);

  // Template Preview Generator
  useEffect(() => {
    if (selectedTemplate && selectedTemplate.components) {
      const bodyComponent = selectedTemplate.components.find(
        (c: any) => c.type === "BODY"
      );
      if (bodyComponent && bodyComponent.text) {
        let preview = bodyComponent.text;
        const paramMatches = preview.match(/\{\{(\d+)\}\}/g);

        if (paramMatches) {
          paramMatches.forEach((match: string) => {
            const paramNum = match.match(/\d+/)?.[0];
            if (paramNum && templateParams[paramNum]) {
              preview = preview.replace(
                match,
                `**${templateParams[paramNum]}**`
              );
            }
          });
        }
        setTemplatePreview(preview);
      }
    } else {
      setTemplatePreview("");
    }
  }, [selectedTemplate, templateParams]);

  return (
    <div
      className={cn(
        "flex flex-col border-l bg-muted/30 transition-all duration-300 ease-in-out h-full"
      )}>
      {/* WhatsApp Header */}
      <div className="p-4 border-b bg-[#075E54]/5">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedConversation.avatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-[#25D366] text-white">
              {selectedConversation.user_email?.[0]?.toUpperCase() || "W"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium text-sm truncate">{selectedConversation.user_email || "WhatsApp User"}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              {selectedConversation.phone_number || "No Number"}
              {selectedAccount && <span className="text-[10px] ml-1 opacity-70">(Default Acct)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 h-0 bg-[#e5ddd5]/30">
        <div className="space-y-3">
          {loading && (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && waitingForUser && (
            <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-muted-foreground opacity-70">
              <MessageCircle className="h-10 w-10 mb-2" />
              <p className="text-sm">No history found.</p>
              <p className="text-xs">Send a message or template to start.</p>
            </div>
          )}

          {!loading && !waitingForUser && whatsappMessages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={cn(
                "flex",
                msg.direction === "outbound" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 shadow-sm",
                  msg.direction === "outbound"
                    ? "bg-[#DCF8C6] text-gray-900 rounded-br-none"
                    : "bg-white text-gray-900 rounded-bl-none"
                )}
              >
                {msg.message_type === "image" && (
                  <div
                    className="mb-1 rounded overflow-hidden relative group cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => setViewerFile({
                      url: getWhatsAppMediaUrl(msg.media_url || msg.content, selectedAccount || msg.account_id),
                      name: "Image",
                      type: "image"
                    })}
                  >
                    <img
                      src={getWhatsAppMediaUrl(msg.media_url || msg.content, selectedAccount || msg.account_id)}
                      alt="Shared Image"
                      className="max-w-full h-auto object-cover rounded-md max-h-[300px]"
                      loading="lazy"
                    />
                  </div>
                )}

                {msg.message_type === "sticker" && (
                  <div className="mb-1">
                    <img
                      src={getWhatsAppMediaUrl(msg.media_url, selectedAccount || msg.account_id)}
                      alt="Sticker"
                      className="w-32 h-32 object-contain drop-shadow-sm"
                      loading="lazy"
                    />
                  </div>
                )}

                {msg.message_type === "video" && (
                  <div
                    className="mb-1 rounded-md overflow-hidden bg-black/5 relative max-w-[280px] group cursor-pointer"
                    onClick={() => setViewerFile({
                      url: getWhatsAppMediaUrl(msg.media_url, selectedAccount || msg.account_id),
                      name: "Video",
                      type: "video"
                    })}
                  >
                    <video
                      playsInline
                      preload="auto"
                      src={getWhatsAppMediaUrl(msg.media_url, selectedAccount || msg.account_id)}
                      className="max-w-full max-h-[300px] w-full bg-black/10 rounded-md"
                    >
                      Your browser does not support the video tag.
                    </video>
                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                      <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm">
                        <Play className="h-6 w-6 text-white fill-current" />
                      </div>
                    </div>
                  </div>
                )}

                {msg.message_type === "audio" && (
                  <div className="mb-1 min-w-[200px]">
                    <audio
                      controls
                      src={getWhatsAppMediaUrl(msg.media_url, selectedAccount || msg.account_id)}
                      className="max-w-full h-10"
                    />
                  </div>
                )}

                {msg.message_type === "document" && (
                  <div className="flex flex-col gap-2">
                    {/* Download/Preview Card - Clickable */}
                    <div
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border border-border/50 max-w-[240px] cursor-pointer hover:bg-muted/80 transition-colors group"
                      onClick={() => setViewerFile({
                        url: getWhatsAppMediaUrl(msg.media_url, selectedAccount || msg.account_id),
                        name: msg.caption || "Document",
                        type: "pdf"
                      })}
                    >
                      <div className="shrink-0 bg-red-100 p-2 rounded-full">
                        <FileIcon className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="text-sm font-medium truncate" title={msg.caption || "Document"}>
                          {msg.caption || "Document"}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">PDF / DOC</p>
                      </div>

                      {/* Direct Download Fallback - Click propagation stopped so it doesn't open viewer */}
                      <a
                        href={getWhatsAppMediaUrl(msg.media_url, selectedAccount || msg.account_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-1.5 hover:bg-black/10 rounded-full transition-colors"
                        title="Direct Download"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>
                  </div>
                )}

                {msg.content && msg.message_type !== "image" && <p className="text-sm break-words">{msg.content}</p>}

                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-gray-500">
                    {formatTime(msg.created_at)}
                  </span>
                  {msg.direction === "outbound" && getStatusIcon(msg.status)}
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="bg-background border-t">
        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)} className="w-full">
          <div className="px-3 pt-2">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="text" className="text-xs">Message</TabsTrigger>
              <TabsTrigger value="template" className="text-xs">Template</TabsTrigger>
            </TabsList>
          </div>

          {/* Text Input */}
          <TabsContent value="text" className="p-3 mt-0">
            <div className="flex gap-2 items-center">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
              >
                <Paperclip className="h-4 w-4 text-gray-500" />
              </Button>
              <Input
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 h-9 text-sm"
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 bg-[#075E54] hover:bg-[#064E45]"
                onClick={handleSendMessage}
                disabled={!message.trim() || isSending}
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>

          {/* Template Input */}
          <TabsContent value="template" className="p-3 mt-0 space-y-3">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Select Template</Label>
                <select
                  className="w-full text-sm border rounded-md p-2 bg-background"
                  value={selectedTemplate?.name || ""}
                  onChange={(e) => {
                    const t = templates.find(temp => temp.name === e.target.value);
                    setSelectedTemplate(t);
                    setTemplateParams({});
                  }}
                >
                  <option value="">Choose a template...</option>
                  {templates.map(t => (
                    <option key={t.name} value={t.name}>
                      {t.name} {getTemplateParamCount(t) > 0 ? `(${getTemplateParamCount(t)} params)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Params Input */}
              {selectedTemplate && getTemplateParamCount(selectedTemplate) > 0 && (
                <div className="space-y-2 bg-muted/30 p-2 rounded-md border">
                  <Label className="text-xs font-medium">Enter Parameters</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: getTemplateParamCount(selectedTemplate) }, (_, i) => i + 1).map(num => (
                      <div key={num} className="space-y-1">
                        <span className="text-[10px] text-muted-foreground ml-1">Variable {'{{' + num + '}}'}</span>
                        <Input
                          placeholder={`Value for {{${num}}}`}
                          className="h-8 text-xs bg-background"
                          value={templateParams[num] || ""}
                          onChange={(e) => setTemplateParams(prev => ({ ...prev, [num]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Preview */}
              {selectedTemplate && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Message Preview</Label>
                  <Textarea
                    className="min-h-[80px] text-sm bg-muted/10 resize-none focus-visible:ring-0"
                    value={templatePreview}
                    readOnly
                    placeholder="Template preview will appear here..."
                  />
                </div>
              )}

              <Button
                className="w-full h-9 text-xs bg-[#075E54] hover:bg-[#064E45] mt-2"
                disabled={!selectedTemplate || isSending}
                onClick={handleSendTemplate}
              >
                {isSending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Send className="h-3 w-3 mr-2" />}
                Send Template Message
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* File Viewer Modal */}
      {viewerFile && (
        <FileViewerModal
          isOpen={true}
          onClose={() => setViewerFile(null)}
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
          fileType={viewerFile.type}
        />
      )}
    </div >
  );
}
