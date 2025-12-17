"use client";

import { ArrowRight, Bot, Check, ChevronDown, Paperclip, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { uploadFileAndGetFullUrl } from "@/services/fileUploadService";
import { toast } from "sonner";
import { useUserStore } from "@/utils/store";
import { getWhatsAppConfigStatus } from "@/services/chats/chatsService";

type InputProps = {
  onSubmit: (value: string, model: string) => void;
  isDummyData: boolean;
  conversationEmail?: string;
  onWhatsAppTrigger?: () => void;
};

export default function AI_Prompt({ onSubmit, isDummyData, conversationEmail, onWhatsAppTrigger }: InputProps) {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });
  const [selectedModel, setSelectedModel] = useState("GPT-4-1 Mini");
  const [uploading, setUploading] = useState(false);
  const [showWhatsAppConfirm, setShowWhatsAppConfirm] = useState(false);
  const [isWhatsAppActive, setIsWhatsAppActive] = useState(false);

  const chatbot_id = useUserStore((state) => state.userData.chatbotId);

  useEffect(() => {
    const checkWhatsAppStatus = async () => {
      if (!chatbot_id) return;
      try {
        const response = await getWhatsAppConfigStatus(chatbot_id);
        if (response && response.isConnected) {
          setIsWhatsAppActive(true);
        } else {
          setIsWhatsAppActive(false);
        }
      } catch (error) {
        console.error("Failed to check WhatsApp status", error);
        setIsWhatsAppActive(false);
      }
    };

    checkWhatsAppStatus();
  }, [chatbot_id]);

  const AI_MODELS = [
    "o3-mini",
    "Gemini 2.5 Flash",
    "Claude 3.5 Sonnet",
    "GPT-4-1 Mini",
    "GPT-4-1",
  ];

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed, selectedModel);
    setValue("");
    adjustHeight(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // handle file selection + upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isDummyData) {
      //  use local URL for dummy conversations
      const fileUrl = URL.createObjectURL(file);
      const fileName = file.name;

      // Construct clickable <a> for chat
      const fileMessage = `<a href="${fileUrl}" target="_blank">${fileName}</a>`;

      onSubmit(fileMessage, selectedModel);

      e.target.value = ""; // reset input
      return;
    }

    // Real upload for normal conversations
    try {
      setUploading(true);

      const result = await uploadFileAndGetFullUrl(file);
      const fileUrl = result?.fileUrl || result?.url;
      const fileName = file.name;

      const fileMessage = `<a href="${fileUrl}" target="_blank">${fileName}</a>`;
      onSubmit(fileMessage, selectedModel);
    } catch (err) {
      console.error("File upload failed:", err);
      toast.error("File upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  return (
    <div className="bg-black/5 dark:bg-white/5 rounded-2xl w-[80%] p-1.5 mx-auto">
      <div className="relative flex flex-col">
        <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
          <Textarea
            id="ai-input-15"
            value={value}
            placeholder={"What can I do for you?"}
            className={cn(
              "w-full rounded-xl rounded-b-none px-4 py-3 bg-black/5 dark:bg-white/5 border-none dark:text-white placeholder:text-black/70 dark:placeholder:text-white/70 resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
              "min-h-[72px]"
            )}
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setValue(e.target.value);
              adjustHeight();
            }}
          />
        </div>

        <div className="h-14 bg-black/5 dark:bg-white/5 rounded-b-xl flex items-center">
          <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between w-[calc(100%-24px)]">
            <div className="flex items-center gap-2">
              {/* Model Selector Dropdown */}
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 h-8 pl-1 pr-2 text-xs rounded-md dark:text-white hover:bg-black/10 dark:hover:bg-white/10">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedModel}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1">
                        {selectedModel}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </motion.div>
                    </AnimatePresence>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {AI_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model}
                      onSelect={() => setSelectedModel(model)}>
                      {model}
                      {selectedModel === model && (
                        <Check className="w-4 h-4 text-blue-500 ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu> */}

              {/* Divider */}
              {/* <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5" /> */}

              {/* File Upload */}
              <label
                className={cn(
                  "rounded-lg p-2 bg-black/5 dark:bg-white/5 cursor-pointer",
                  "hover:bg-black/10 dark:hover:bg-white/10",
                  uploading && "opacity-50 pointer-events-none"
                )}
                aria-label="Attach file">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Paperclip className="w-4 h-4" />
              </label>

              {/* WhatsApp Trigger Button */}
              {/* {conversationEmail && onWhatsAppTrigger && isWhatsAppActive && (
                <button
                  type="button"
                  onClick={() => setShowWhatsAppConfirm(true)}
                  className={cn(
                    "rounded-lg p-2 bg-black/5 dark:bg-white/5 cursor-pointer",
                    "hover:bg-black/10 dark:hover:bg-white/10"
                  )}
                  aria-label="Send WhatsApp trigger"
                  title="Send WhatsApp connection to customer"
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                </button>
              )} */}
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className={cn(
                "rounded-lg p-2 bg-black/5 dark:bg-white/5",
                "hover:bg-black/10 dark:hover:bg-white/10"
              )}
              aria-label="Send message"
              disabled={!value.trim() || uploading}>
              <ArrowRight
                className={cn(
                  "w-4 h-4 transition-opacity duration-200",
                  value.trim() ? "opacity-100" : "opacity-30"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Confirmation Dialog */}
      {showWhatsAppConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Send WhatsApp Connection</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will send a WhatsApp connection request to the customer. They will be able to continue the conversation on WhatsApp.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWhatsAppConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowWhatsAppConfirm(false);
                  onWhatsAppTrigger?.();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
              >
                Send WhatsApp Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
