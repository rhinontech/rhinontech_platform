"use client";
import React, { createContext, useContext, useState } from "react";

type SidebarContextType = {
  isAutomateOpen: boolean;
  toggleAutomateSidebar: () => void;
  isSupportOpen: boolean;
  toggleSupportSidebar: () => void;
  setIsSupportOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBillingOpen: boolean;
  toggleBillingSidebar: () => void;
  isSettingOpen: boolean;
  toggleSettingSidebar: () => void;
  isKnowledgeBaseOpen: boolean;
  toggleKnowledgeBaseSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isAutomateOpen, setIsAutomateOpen] = useState(true);
  const [isSupportOpen, setIsSupportOpen] = useState(true);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isSettingOpen, setIsSettingOpen] = useState(true);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(true);

  const toggleAutomateSidebar = () => setIsAutomateOpen((prev) => !prev);
  const toggleSupportSidebar = () => setIsSupportOpen((prev) => !prev);
  const toggleBillingSidebar = () => setIsBillingOpen((prev) => !prev);
  const toggleSettingSidebar = () => setIsSettingOpen((prev) => !prev);
  const toggleKnowledgeBaseSidebar = () =>
    setIsKnowledgeBaseOpen((prev) => !prev);

  return (
    <SidebarContext.Provider
      value={{
        isAutomateOpen,
        toggleAutomateSidebar,
        isSupportOpen,
        toggleSupportSidebar,
        setIsSupportOpen,
        isBillingOpen,
        toggleBillingSidebar,
        isSettingOpen,
        toggleSettingSidebar,
        isKnowledgeBaseOpen,
        toggleKnowledgeBaseSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};
