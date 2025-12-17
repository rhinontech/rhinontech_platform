"use client";

import { useEffect, useRef, useState } from "react";

interface RhinonChatbotProps {
    appId: string;
    admin?: boolean;
    adminTestingMode?: boolean;
    container?: HTMLElement;
    config?: any;
    className?: string;
}

export function RhinonChatbot({
    appId,
    admin = false,
    adminTestingMode = false,
    container,
    config,
    className = "",
}: RhinonChatbotProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chatbotInstanceRef = useRef<any>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        const targetContainer = container || containerRef.current;
        if (!targetContainer) return;

        const initializeChatbot = async () => {
            try {
                const { default: Rhinontech } = await import("@rhinon/botsdk");

                // Remove existing instance if app_id changed
                if (chatbotInstanceRef.current) {
                    try {
                        chatbotInstanceRef.current.remove();
                    } catch (error) {
                        console.error("Error removing previous chatbot:", error);
                    }
                    chatbotInstanceRef.current = null;
                }

                // Create new instance
                chatbotInstanceRef.current = Rhinontech({
                    app_id: appId,
                    admin,
                    adminTestingMode,
                    container: targetContainer,
                    chatbot_config: config || {},
                } as any);

                console.log(`✅ Rhinonbot initialized (app_id: ${appId}, admin: ${admin})`);
            } catch (error) {
                console.error("Failed to load chatbot:", error);
            }
        };

        initializeChatbot();

        return () => {
            if (chatbotInstanceRef.current) {
                try {
                    chatbotInstanceRef.current.remove();
                    console.log(`🗑️ Rhinonbot removed (app_id: ${appId})`);
                } catch (error) {
                    console.error("Error removing chatbot:", error);
                }
                chatbotInstanceRef.current = null;
            }
        };
    }, [isClient, appId, admin, adminTestingMode, container]);

    // Update config when it changes (for admin/preview mode)
    useEffect(() => {
        if (!chatbotInstanceRef.current || !config) return;

        try {
            chatbotInstanceRef.current.setConfig({
                app_id: appId,
                admin,
                chatbot_config: config,
            });
        } catch (error) {
            console.error("Error updating chatbot config:", error);
        }
    }, [config, appId, admin]);

    // If using external container, don't render anything
    if (container) return null;

    // If not client-side yet, return null (no loading state needed for widget)
    if (!isClient) return null;

    return <div ref={containerRef} className={className} />;
}
