"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import ChatbotPreview from "@/components/Common/ChatbotPreview/ChatbotPreview";
import { useEffect, useState } from "react";
import { fetchChatbotConfig } from "@/services/chatbot/chatbotService";
import { useUserStore } from "@/utils/store";
import Loading from "@/app/loading";
import Cookies from "js-cookie";


interface ThemeSettings {
    isBgFade: boolean;
    primaryColor: string;
    secondaryColor: string;
    isBackgroundImage: boolean;
    backgroundImage: string;
    chatbotName: string;
    navigationOptions: string[];
    popupMessage: string;
    greetings: string[];
    primaryLogo: string;
    secondaryLogo: string;
    selectedPage: string;
    theme?: 'light' | 'dark' | 'system';
}

export default function KnowledgeHubLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
        isBgFade: true,
        primaryColor: "#1403ac",
        secondaryColor: "#f3f6ff",
        isBackgroundImage: false,
        backgroundImage: "",
        chatbotName: "Rhinon",
        navigationOptions: ["Home", "Messages"],
        popupMessage: "Hey, I am Rhinon AI Assistant, How can I help you?",
        greetings: ["Hi there👋", "How can we help?"],
        primaryLogo:
            "https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_White.png",
        secondaryLogo:
            "https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_Dark+2.png",
        selectedPage: "chats",
        theme: "light",
    });
    const [fetching, setFetching] = useState(true);
    const userEmail = useUserStore((state) => state.userData.userEmail);
    Cookies.set("userEmail", userEmail);

    

    const getChatbotConfig = async () => {
        try {
            setFetching(true);
            const response = await fetchChatbotConfig();
            const config = response.chatbot_config;

            setThemeSettings({
                isBgFade: config.isBgFade ?? true,
                primaryColor: config.primaryColor ?? "#1403ac",
                secondaryColor: config.secondaryColor ?? "#f3f6ff",
                isBackgroundImage: config.isBackgroundImage ?? false,
                backgroundImage: config.backgroundImage ?? "",
                chatbotName: config.chatbotName ?? "Rhinon",
                navigationOptions: ["Messages"],
                popupMessage:
                    config.popupMessage ??
                    "Hey, I am Rhinon AI Assistant, How can I help you?",
                greetings: config.greetings ?? ["Hi there👋", "How can we help?"],
                primaryLogo:
                    config.primaryLogo ??
                    "https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_White.png",
                secondaryLogo:
                    config.secondaryLogo ??
                    "https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_Dark+2.png",
                selectedPage: "chats",
                theme: config.theme ?? "light",
            });
        } catch (error) {
            console.error("Failed to fetch chatbot config:", error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        getChatbotConfig();
    }, []);

    if (fetching) {
        return (
            <div className="flex relative items-center justify-center h-full w-full">
                <Loading areaOnly />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
            <div className="flex flex-1 flex-col w-full h-full overflow-hidden">
                {children}
            </div>
            <div className="flex flex-col w-[600px] border-l-2 h-full">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 h-[60px] p-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-base font-bold">Preview</h2>
                    </div>

                </div>

                {/* Scrollable Preview Area */}
                <ScrollArea className="flex-1 h-0">
                    <ChatbotPreview
                        isBgFade={themeSettings.isBgFade}
                        primaryColor={themeSettings.primaryColor}
                        secondaryColor={themeSettings.secondaryColor}
                        isBackgroundImage={themeSettings.isBackgroundImage}
                        backgroundImage={themeSettings.backgroundImage}
                        navigationOptions={themeSettings.navigationOptions}
                        primaryLogo={themeSettings.primaryLogo}
                        secondaryLogo={themeSettings.secondaryLogo}
                        chatbotName={themeSettings.chatbotName}
                        popupMessage={themeSettings.popupMessage}
                        greetings={themeSettings.greetings}
                        selectedPage={themeSettings.selectedPage}
                        theme={themeSettings.theme}
                    />
                </ScrollArea>
            </div>
        </div>
    );
}
