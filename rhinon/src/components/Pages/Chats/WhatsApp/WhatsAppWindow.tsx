"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PanelRight, PanelLeft, PanelLeftOpen, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import workPlaceholder from "@/assets/placeholders/workimg4.png";
import {
  type WhatsAppContact,
  type WhatsAppMessage,
} from "@/services/settings/whatsappServices";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WhatsAppWindowProps {
  selectedContact: WhatsAppContact | null;
  messages: WhatsAppMessage[];
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  onSendMessage: (input: string) => void;
  onSendTemplate: (
    templateName: string,
    params: Record<string, string>
  ) => void;
  templates: any[];
}

export function WhatsAppWindow({
  selectedContact,
  messages,
  leftSidebarOpen,
  rightSidebarOpen,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onSendMessage,
  onSendTemplate,
  templates,
}: WhatsAppWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<"text" | "template">("text");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateParams, setTemplateParams] = useState<Record<string, string>>(
    {}
  );
  const [templatePreview, setTemplatePreview] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Parse template parameters and generate preview
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
    }
  }, [selectedTemplate, templateParams]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current?.value) {
      onSendMessage(inputRef.current.value);
      inputRef.current.value = "";
    }
  };

  const handleTemplateSubmit = () => {
    if (!selectedTemplate) return;

    const bodyComponent = selectedTemplate.components?.find(
      (c: any) => c.type === "BODY"
    );
    const paramMatches = bodyComponent?.text?.match(/\{\{(\d+)\}\}/g);

    // Validate all params are filled
    if (paramMatches) {
      const allFilled = paramMatches.every((match: string) => {
        const paramNum = match.match(/\d+/)?.[0];
        return paramNum && templateParams[paramNum]?.trim();
      });

      if (!allFilled) {
        alert("Please fill all template parameters");
        return;
      }
    }

    onSendTemplate(selectedTemplate.name, templateParams);
    setSelectedTemplate(null);
    setTemplateParams({});
    setInputMode("text");
  };

  const getTemplateParamCount = (template: any) => {
    const bodyComponent = template.components?.find(
      (c: any) => c.type === "BODY"
    );
    const matches = bodyComponent?.text?.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.length : 0;
  };

  if (!selectedContact) {
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
          Select a contact to start chatting
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto transition-colors">
          You can send messages or use templates to initiate conversations.
        </p>
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
              <AvatarFallback>
                {(selectedContact.profile_name ||
                  selectedContact.name ||
                  selectedContact.phone_number)?.[0]?.toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h3 className="font-semibold">
              {selectedContact.profile_name ||
                selectedContact.name ||
                selectedContact.phone_number}
            </h3>
            <p className="text-sm text-muted-foreground">
              WhatsApp • {selectedContact.phone_number}
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

      {/* Messages */}
      <ScrollArea className="flex-1 h-0 p-4 bg-[#efeae2]">
        <div className="space-y-4">
          {messages.map((msg, i) => {
            const isOutbound = msg.direction === "outbound";

            return (
              <div
                key={msg.id || i}
                className={cn(
                  "flex",
                  !isOutbound ? "justify-start" : "justify-end"
                )}>
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2 shadow-sm",
                    !isOutbound
                      ? "bg-white text-gray-900"
                      : "bg-[#d9fdd3] text-gray-900"
                  )}>
                  {msg.message_type === "image" && msg.media_url && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                      <img
                        src={msg.media_url}
                        alt="Media"
                        className="max-w-full h-auto"
                      />
                    </div>
                  )}

                  <div className="text-sm whitespace-pre-wrap">
                    {msg.content}
                    {msg.caption && (
                      <p className="mt-1 italic opacity-80">{msg.caption}</p>
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-1 mt-1 text-[10px] justify-end",
                      !isOutbound ? "text-gray-500" : "text-gray-500"
                    )}>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isOutbound && (
                      <span>
                        {msg.status === "read" && (
                          <span className="text-blue-500">✓✓</span>
                        )}
                        {msg.status === "delivered" && (
                          <span className="text-gray-400">✓✓</span>
                        )}
                        {msg.status === "sent" && (
                          <span className="text-gray-400">✓</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-white">
        {/* Mode Toggle */}
        <div className="px-4 pt-3">
          <Tabs
            value={inputMode}
            onValueChange={(v) => setInputMode(v as "text" | "template")}
            className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Text Message</TabsTrigger>
              <TabsTrigger value="template">Template Message</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Text Input */}
        {inputMode === "text" && (
          <div className="p-1 flex justify-between">
            <div className="w-full px-3 pb-2">
              <form
                onSubmit={handleTextSubmit}
                className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  className="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="Type a message..."
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-[#25D366] hover:bg-[#128C7E] h-10 w-10 rounded-full">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Template Input */}
        {inputMode === "template" && (
          <div className="p-4 space-y-3">
            {/* Template Selector */}
            <div>
              <Label className="text-xs text-gray-600 mb-1">
                Select Template
              </Label>
              <select
                value={selectedTemplate?.name || ""}
                onChange={(e) => {
                  const tmpl = templates.find((t) => t.name === e.target.value);
                  setSelectedTemplate(tmpl);
                  setTemplateParams({});
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Choose a template...</option>
                {templates
                  .filter((t) => t.status === "APPROVED")
                  .map((tmpl) => (
                    <option key={tmpl.name} value={tmpl.name}>
                      {tmpl.name}{" "}
                      {getTemplateParamCount(tmpl) > 0 &&
                        `(${getTemplateParamCount(tmpl)} params)`}
                    </option>
                  ))}
              </select>
            </div>

            {/* Template Parameters */}
            {selectedTemplate &&
              getTemplateParamCount(selectedTemplate) > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">
                    Template Parameters
                  </Label>
                  {Array.from(
                    { length: getTemplateParamCount(selectedTemplate) },
                    (_, i) => i + 1
                  ).map((num) => (
                    <Input
                      key={num}
                      placeholder={`Parameter ${num}`}
                      value={templateParams[num.toString()] || ""}
                      onChange={(e) =>
                        setTemplateParams({
                          ...templateParams,
                          [num.toString()]: e.target.value,
                        })
                      }
                      className="text-sm"
                    />
                  ))}
                </div>
              )}

            {/* Template Preview */}
            {selectedTemplate && templatePreview && (
              <div className="bg-gray-50 rounded-lg p-3 border">
                <Label className="text-xs text-gray-600 mb-2 block">
                  Preview
                </Label>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {templatePreview.split("**").map((part, i) =>
                    i % 2 === 0 ? (
                      part
                    ) : (
                      <strong key={i} className="text-primary">
                        {part}
                      </strong>
                    )
                  )}
                </p>
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleTemplateSubmit}
              disabled={!selectedTemplate}
              className="w-full bg-[#25D366] hover:bg-[#128C7E]">
              Send Template
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
