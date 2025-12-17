"use client";

import { useState, useEffect } from "react";
import {
  sendWhatsAppMessage,
  getWhatsAppTemplates,
  type WhatsAppAccount,
} from "@/services/settings/whatsappServices";

interface MessageSenderProps {
  accounts: WhatsAppAccount[];
}

export default function MessageSender({ accounts }: MessageSenderProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | string>(
    ""
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [messageType, setMessageType] = useState<"text" | "template">(
    "template"
  );
  const [templateName, setTemplateName] = useState("");
  const [languageCode, setLanguageCode] = useState("en_US");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Template fetching state
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Set default account
  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Fetch templates when account changes
  useEffect(() => {
    const fetchTemplates = async () => {
      const accountId = selectedAccountId
        ? Number(selectedAccountId)
        : accounts[0]?.id;
      if (!accountId) return;

      try {
        setIsLoadingTemplates(true);
        const data = await getWhatsAppTemplates(accountId);
        setTemplates(data);

        // Auto-select first template if available and none selected
        if (data.length > 0 && !templateName) {
          setTemplateName(data[0].name);
          setLanguageCode(data[0].language);
        }
      } catch (err) {
        console.error("Failed to fetch templates", err);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    if (messageType === "template") {
      fetchTemplates();
    }
  }, [selectedAccountId, messageType, accounts]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const accountId = selectedAccountId
      ? Number(selectedAccountId)
      : accounts[0]?.id;

    if (!accountId) {
      setStatus({ type: "error", message: "No WhatsApp account selected" });
      return;
    }

    if (!phoneNumber) {
      setStatus({ type: "error", message: "Please enter a phone number" });
      return;
    }

    if (messageType === "text" && !message) {
      setStatus({ type: "error", message: "Please enter a message" });
      return;
    }

    if (messageType === "template" && !templateName) {
      setStatus({ type: "error", message: "Please select a template" });
      return;
    }

    setIsSending(true);
    setStatus(null);

    try {
      await sendWhatsAppMessage({
        account_id: accountId,
        to: phoneNumber,
        type: messageType,
        text: messageType === "text" ? { body: message } : undefined,
        template:
          messageType === "template"
            ? {
                name: templateName,
                language: { code: languageCode },
              }
            : undefined,
      });

      setStatus({ type: "success", message: "Message sent successfully!" });
      if (messageType === "text") setMessage("");
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Failed to send message",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Send Test Message</h3>

      <form onSubmit={handleSend} className="space-y-4">
        {accounts.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Account
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.verified_name} ({account.display_phone_number})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Phone Number
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. 15551234567"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter number with country code (no + symbol)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message Type
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="messageType"
                value="template"
                checked={messageType === "template"}
                onChange={() => setMessageType("template")}
              />
              <span className="ml-2">Template Message</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="messageType"
                value="text"
                checked={messageType === "text"}
                onChange={() => setMessageType("text")}
              />
              <span className="ml-2">Text Message</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use "Template Message" to start a conversation. Use "Text Message"
            only if the user has replied within 24 hours.
          </p>
        </div>

        {messageType === "template" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                {isLoadingTemplates ? (
                  <div className="text-sm text-gray-500 py-2">
                    Loading templates...
                  </div>
                ) : (
                  <select
                    value={templateName}
                    onChange={(e) => {
                      setTemplateName(e.target.value);
                      // Find language for selected template
                      const tmpl = templates.find(
                        (t) => t.name === e.target.value
                      );
                      if (tmpl) setLanguageCode(tmpl.language);
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select a template</option>
                    {templates.map((tmpl, idx) => (
                      <option key={`${tmpl.name}-${idx}`} value={tmpl.name}>
                        {tmpl.name} ({tmpl.language}) - {tmpl.status}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language Code
                </label>
                <input
                  type="text"
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  placeholder="en_US"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <p className="text-sm text-blue-800">
                Need a new template?{" "}
                <a
                  href="https://business.facebook.com/wa/manage/message-templates/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-blue-900">
                  Create one in WhatsApp Manager
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Body
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {status && (
          <div
            className={`p-3 rounded-md text-sm ${
              status.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}>
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center">
          {isSending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Send Message
            </>
          )}
        </button>
      </form>
    </div>
  );
}
