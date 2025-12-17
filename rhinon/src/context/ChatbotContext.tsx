"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface ChatbotSettings {
  widgetStyle: "bar" | "bubble";
  theme: "light" | "dark";
  themeColor: string;
  websiteUrl: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  mobileEnabled: boolean;
}

interface ChatbotContextType {
  settings: ChatbotSettings;
  updateSettings: (updates: Partial<ChatbotSettings>) => void;
}

const defaultSettings: ChatbotSettings = {
  widgetStyle: "bubble",
  theme: "light",
  themeColor: "#3b82f6",
  websiteUrl: "",
  position: "bottom-right",
  mobileEnabled: true,
};

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ChatbotSettings>(defaultSettings);

  const updateSettings = (updates: Partial<ChatbotSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <ChatbotContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
}
