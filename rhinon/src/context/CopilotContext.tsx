"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CopilotContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    initialPrompt: string;
    setInitialPrompt: (prompt: string) => void;
    autoSend: boolean;
    setAutoSend: (autoSend: boolean) => void;
    openCopilot: (prompt?: string, shouldAutoSend?: boolean) => void;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export function CopilotProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialPrompt, setInitialPrompt] = useState("");
    const [autoSend, setAutoSend] = useState(false);

    const openCopilot = (prompt?: string, shouldAutoSend: boolean = false) => {
        if (prompt) {
            setInitialPrompt(prompt);
            setAutoSend(shouldAutoSend);
        }
        setIsOpen(true);
    };

    return (
        <CopilotContext.Provider
            value={{
                isOpen,
                setIsOpen,
                initialPrompt,
                setInitialPrompt,
                autoSend,
                setAutoSend,
                openCopilot,
            }}
        >
            {children}
        </CopilotContext.Provider>
    );
}

export function useCopilot() {
    const context = useContext(CopilotContext);
    if (context === undefined) {
        throw new Error("useCopilot must be used within a CopilotProvider");
    }
    return context;
}
