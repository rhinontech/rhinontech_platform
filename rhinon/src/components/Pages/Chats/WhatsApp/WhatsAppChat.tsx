"use client";

import { useState, useEffect } from "react";
import {
  getWhatsAppContacts,
  getWhatsAppMessages,
  sendWhatsAppMessage,
  getWhatsAppTemplates,
  type WhatsAppAccount,
  type WhatsAppContact,
  type WhatsAppMessage,
} from "@/services/settings/whatsappServices";
import { getSocket } from "@/services/webSocket";
import { useUserStore } from "@/utils/store";
import { WhatsAppSidebar } from "./WhatsAppSidebar";
import { WhatsAppWindow } from "./WhatsAppWindow";
import { WhatsAppInfoSidebar } from "./WhatsAppInfoSidebar";

interface WhatsAppChatProps {
  accounts: WhatsAppAccount[];
}

export default function WhatsAppChat({ accounts }: WhatsAppChatProps) {
  // If no accounts are provided, show the empty state
  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-100px)] items-center justify-center bg-gray-50 rounded-lg translate-y-2">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.688" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          No WhatsApp Account Connected
        </h3>
        <p className="text-gray-500 mb-4">
          Connect your WhatsApp Business account in Settings to start messaging.
        </p>
        <a
          href="/admin/settings?tab=whatsapp-account"
          className="text-blue-600 hover:text-blue-700 font-medium">
          Go to Settings →
        </a>
      </div>
    );
  }

  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [selectedContact, setSelectedContact] =
    useState<WhatsAppContact | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Sidebar State
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Template State
  const [templates, setTemplates] = useState<any[]>([]);

  // Account Selection
  const [selectedAccount, setSelectedAccount] = useState<number>(
    accounts[0]?.id || 0
  );

  const { userData } = useUserStore();
  const socket = getSocket();

  // Join Organization Room
  useEffect(() => {
    if (userData?.orgId && socket) {
      socket.emit("join_org", { organization_id: userData.orgId });

      const handleMessage = (data: { message: WhatsAppMessage }) => {
        // If message belongs to selected contact, add it
        if (
          selectedContact &&
          (data.message.from_number === selectedContact.phone_number ||
            data.message.to_number === selectedContact.phone_number)
        ) {
          setMessages((prev) => [...prev, data.message]);
        }
        // Refresh contacts to update last message/order
        if (selectedAccount) loadContacts();
      };

      const handleStatusKey = (data: any) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.message_id ? { ...msg, status: data.status } : msg
          )
        );
      };

      socket.on("whatsapp:message:received", handleMessage);
      socket.on("whatsapp:message:sent", handleMessage);
      socket.on("whatsapp:message:status", handleStatusKey);

      return () => {
        socket.off("whatsapp:message:received", handleMessage);
        socket.off("whatsapp:message:sent", handleMessage);
        socket.off("whatsapp:message:status", handleStatusKey);
      };
    }
  }, [userData?.orgId, socket, selectedContact, selectedAccount]);

  // Load Contacts
  const loadContacts = async () => {
    if (!selectedAccount) return;
    try {
      setLoadingContacts(true);
      const data = await getWhatsAppContacts(selectedAccount);
      setContacts(data);
    } catch (error) {
      console.error("Failed to load contacts", error);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Load Templates
  const loadTemplates = async () => {
    if (!selectedAccount) return;
    try {
      const data = await getWhatsAppTemplates(selectedAccount);
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates", error);
    }
  };

  useEffect(() => {
    if (selectedAccount) {
      // Clear templates first when account changes
      setTemplates([]);
      loadContacts();
      loadTemplates();
    }
  }, [selectedAccount]);

  // Load Messages
  useEffect(() => {
    if (selectedContact) {
      const loadMessages = async () => {
        try {
          const data = await getWhatsAppMessages(selectedContact.id);
          setMessages(data.messages);
        } catch (error) {
          console.error("Failed to load messages", error);
        }
      };
      loadMessages();
    }
  }, [selectedContact]);

  // Send Message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !selectedContact || !selectedAccount) return;

    try {
      setIsSending(true);
      await sendWhatsAppMessage({
        account_id: selectedAccount,
        to: selectedContact.phone_number,
        type: "text",
        text: { body: text },
      });
      // Message will be added via socket event "whatsapp:message:sent"
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Send Template with Parameters
  const handleSendTemplate = async (
    templateName: string,
    params: Record<string, string>
  ) => {
    if (!selectedContact || !selectedAccount) return;

    try {
      setIsSending(true);

      // Find the template to get its actual language code
      const template = templates.find((t) => t.name === templateName);
      if (!template) {
        alert("Template not found");
        return;
      }

      // Build template parameters array
      const paramArray = Object.keys(params)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map((key) => ({ type: "text", text: params[key] }));

      await sendWhatsAppMessage({
        account_id: selectedAccount,
        to: selectedContact.phone_number,
        type: "template",
        template: {
          name: templateName,
          language: { code: template.language }, // Use actual template language
          components:
            paramArray.length > 0
              ? [
                  {
                    type: "body",
                    parameters: paramArray,
                  },
                ]
              : undefined,
        },
      });
      // Message will be added via socket event
    } catch (error) {
      console.error("Failed to send template", error);
      alert("Failed to send template");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border bg-background">
      <WhatsAppSidebar
        isOpen={leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
        contacts={contacts}
        selectedContact={selectedContact}
        onSelectContact={setSelectedContact}
        loading={loadingContacts}
        accounts={accounts}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
      />

      <WhatsAppWindow
        selectedContact={selectedContact}
        messages={messages}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
        onToggleLeftSidebar={() => setLeftSidebarOpen(true)}
        onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
        onSendMessage={handleSendMessage}
        onSendTemplate={handleSendTemplate}
        templates={templates}
      />

      <WhatsAppInfoSidebar
        isOpen={rightSidebarOpen}
        onClose={() => setRightSidebarOpen(false)}
        selectedContact={selectedContact}
        messages={messages}
      />
    </div>
  );
}
