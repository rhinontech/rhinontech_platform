"use client";

import { useUserStore } from "@/utils/store";
import { RhinonChatbot } from "@/components/Common/Chatbot/RhinonChatbot";

export default function ChatbotPreview({
  isBgFade,
  primaryColor,
  secondaryColor,
  isBackgroundImage,
  backgroundImage,
  navigationOptions,
  primaryLogo,
  secondaryLogo,
  chatbotName,
  popupMessage,
  greetings,
  selectedPage,
  theme,
  isChatHistory,
  adminTestingMode
}: {
  isBgFade?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  isBackgroundImage?: boolean;
  backgroundImage?: string;
  navigationOptions?: string[];
  primaryLogo?: string;
  secondaryLogo?: string;
  chatbotName?: string;
  popupMessage?: string;
  greetings?: string[];
  selectedPage: string;
  theme?: 'light' | 'dark' | 'system';
  isChatHistory?: boolean;
  adminTestingMode?: boolean;
}) {
  const chatbotId = useUserStore((state) => state.userData.chatbotId);

  // Build config object for the chatbot
  const chatbotConfig = {
    isBgFade,
    primaryColor,
    secondaryColor,
    isBackgroundImage,
    backgroundImage,
    navigationOptions,
    primaryLogo,
    secondaryLogo,
    chatbotName,
    popupMessage,
    greetings,
    selectedPage,
    theme,
    isChatHistory,
  };

  return (
    <div
      className="relative w-full h-full min-h-[700px] overflow-hidden"
      style={{
        position: "relative",
        transform: "translateZ(0)", // Creates a new stacking context and containing block for fixed children
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
        Chatbot Preview
      </div>

      {/* Admin/Testing Chatbot Instance */}
      <RhinonChatbot
        appId={chatbotId}
        admin={true}
        adminTestingMode={adminTestingMode}
        config={chatbotConfig}
      />
    </div>
  );
}
