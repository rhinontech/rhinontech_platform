"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import ChatbotPreview from "@/components/Common/ChatbotPreview/ChatbotPreview";
import CollapsibleSection from "@/components/Common/CollapsibleSection/CollapsibleSection";
import { useEffect, useState } from "react";
import {
  fetchChatbotConfig,
  updateChatbotConfig,
} from "@/services/chatbot/chatbotService";
import { Button } from "@/components/ui/button"; // assuming shadcn/ui Button
import { useUserStore } from "@/utils/store";
import Loader from "@/components/Common/Loader/Loader";
import Loading from "@/app/loading";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  theme: 'light' | 'dark' | 'system';
  isChatHistory: boolean;
}

export default function Theme() {
  const { toggleSettingSidebar } = useSidebar();
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
    selectedPage: "Home",
    theme: "system",
    isChatHistory: true,
  });
  const [originalSettings, setOriginalSettings] = useState<ThemeSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const chatbotId = useUserStore((state) => state.userData.chatbotId);

  const getChatbotConfig = async () => {
    try {
      setFetching(true);
      const response = await fetchChatbotConfig();
      const config = response.chatbot_config;

      console.log(config);

      const settings = {
        isBgFade: config.isBgFade ?? true,
        primaryColor: config.primaryColor ?? "#1403ac",
        secondaryColor: config.secondaryColor ?? "#f3f6ff",
        isBackgroundImage: config.isBackgroundImage ?? false,
        backgroundImage: config.backgroundImage ?? "",
        chatbotName: config.chatbotName ?? "Rhinon",
        navigationOptions: config.navigationOptions ?? ["Home", "Messages"],
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
        selectedPage: "Home",
        theme: config.theme ?? "system",
        isChatHistory: config.isChatHistory ?? true,
      };

      setThemeSettings(settings);
      setOriginalSettings(settings);
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to fetch chatbot config:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    getChatbotConfig();
  }, []);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await updateChatbotConfig(chatbotId, themeSettings);
      setOriginalSettings(themeSettings);
      setIsDirty(false);
      toast.success("Theme settings updated successfully!");
    } catch (error) {
      toast.error(
        "Failed to update chatbot config. Check console for details."
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    if (originalSettings) {
      setThemeSettings(originalSettings);
      setIsDirty(false);
      toast.info("Changes discarded");
    }
  };

  const handleThemeUpdate = (value: React.SetStateAction<ThemeSettings>) => {
    setThemeSettings(value);
    setIsDirty(true);
  };

  console.log(themeSettings);

  if (fetching || !themeSettings) {
    return (
      <div className="flex relative items-center justify-center h-full w-full">
        <Loading areaOnly />
      </div>
    );
  }
  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b-2 h-[60px] p-4">
          <div className="flex items-center gap-4">
            <PanelLeft onClick={toggleSettingSidebar} className="h-4 w-4" />
            <h2 className="text-base font-bold">Theme</h2>
          </div>
          {/* <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button> */}
        </div>
        <ScrollArea className="flex-1 h-0 p-4">
          <CollapsibleSection
            themeSettings={themeSettings}
            setThemeSettings={handleThemeUpdate}
          />
        </ScrollArea>
      </div>
      <div className="flex flex-col w-[600px] border-l-2">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 h-[60px] p-4">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold">Preview</h2>
          </div>

          {/*  Page Selector Dropdown */}
          <Select
            value={
              themeSettings.selectedPage === "chats"
                ? "Messages"
                : themeSettings.selectedPage
            }
            onValueChange={(val) => {
              // Map "Messages" to "chats"
              const mappedValue = val === "Messages" ? "chats" : val;
              setThemeSettings((prev) => ({
                ...prev,
                selectedPage: mappedValue,
              }));
            }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select Page" />
            </SelectTrigger>
            <SelectContent className="z-[1000]">
              {themeSettings.navigationOptions.map((page) => (
                <SelectItem key={page} value={page}>
                  {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* Unsaved Changes Popup */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-foreground/95 backdrop-blur-md text-background px-2 py-2 rounded-full shadow-2xl flex items-center gap-2 pl-6 pr-2 border border-white/10">
            <span className="text-sm font-medium mr-2">Unsaved changes</span>
            <Button
              onClick={handleDiscard}
              variant="ghost"
              size="sm"
              className="h-8 rounded-full hover:bg-white/10 text-background hover:text-white"
            >
              Discard
            </Button>
            <Button
              onClick={handleSubmit}
              size="sm"
              className="h-8 rounded-full bg-background text-foreground hover:bg-background/90 font-semibold px-4"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
