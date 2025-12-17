"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  CheckCircle,
  BarChart3,
  Globe,
  X,
  Download,
  Plus,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KeywordInsights } from "./KeywordInsights/KeywordInsights";
import { PerformanceAudit } from "./PerformanceAudit/PerformanceAudit";
import { SEOCompliance } from "./SEOCompliance/SEOCompliance";
import { TrafficAnalytics } from "./TrafficAnalytics/TrafficAnalytics";
import images from "@/components/Constants/Images";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useUserStore } from "@/utils/store";
// import { fetchAllChatbots } from "@/services/chatbot/chatbotService";

const Seo = () => {
  const [activeTab, setActiveTab] = useState("traffic");
  // const [availableChatbots, setAvailableChatbots] = useState<any>([]);
  // const [selectedChatbot, setSelectedChatbot] = useState<any>("");
  // const [loading, setLoading] = useState(true);
  const currentRole = Cookies.get("currentRole");
  const router = useRouter();
  const [showHero, setShowHero] = useState(true);
  const storedData = localStorage.getItem("user-data");

  const onboarding = useUserStore((state) => state.userData.onboarding);
  const chatbotInstalled = onboarding?.chatbot_installed || false;

  const chatbot_id = useUserStore((state) => state.userData.chatbotId);
  // useEffect(() => {
  //   const fetchAvailableChatbot = async () => {
  //     try {
  //       const response = await fetchAllChatbots();
  //       setAvailableChatbots(response.chatbots);
  //       setSelectedChatbot(response.chatbots[0].chatbot_id);
  //     } catch (error) {
  //       console.error("Failed to fetch chatbots data", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchAvailableChatbot();
  // }, []);

  // if (loading) return <>loading....</>;
  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border-2 bg-background">
      {/* Main Content */}
      <div className="flex flex-1 flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 h-[60px] px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">SEO Analytics</h2>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-0">
          {(showHero && !chatbotInstalled) && (
            <div className="flex flex-col items-center justify-center h-full p-8 pb-0">
              <div className="flex w-full p-5 rounded-lg bg-gradient-to-r from-transparent to-secondary h-[300px]">
                <div className="flex-1 flex flex-col gap-[12px] justify-center items-start">
                  <p className="font-semibold text-2xl">
                    Install our chatbot to see SEO Analytics
                  </p>
                  <p className="text-base text-muted-foreground">
                    Track performance, view live data, and gain full visibility
                    all in one place.
                  </p>
                  <div className="flex items-center gap-5">
                    <Button
                      onClick={() =>
                        router.push(`/${currentRole}/settings/messenger`)
                      }
                    >
                      <Download /> Install Chatbot
                    </Button>
                    <Button
                      onClick={() =>
                        router.push(`/${currentRole}/teams?createrole`)
                      }
                    >
                      <Plus /> Invite Developer
                    </Button>
                  </div>
                </div>
                <div className="flex-shrink-0 flex gap-[9px]">
                  <Image
                    src={images.seoAnalytics}
                    width={235}
                    height={203}
                    alt={""}
                  />
                  <X
                    onClick={() => setShowHero(false)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <p className="text-muted-foreground">
                Comprehensive overview of your website's performance and SEO
                health
              </p>

              {/* Date Range Picker */}
              {/* <div className="flex items-center space-x-4">
                <Select
                  value={selectedChatbot}
                  onValueChange={setSelectedChatbot}>
                  <SelectTrigger className="w-full">
                    <CalendarIcon className="h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>

                  {availableChatbots.map((chatbot: any) => (
                    <SelectContent>
                      <SelectItem value={chatbot.chatbot_id}>
                        {chatbot.chatbot_base_url}
                      </SelectItem>
                    </SelectContent>
                  ))}
                </Select>
              </div> */}
            </div>

            {/* Tab Navigation */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
                <TabsTrigger
                  value="traffic"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Traffic Analytics
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  SEO Compliance
                </TabsTrigger>
                {/* <TabsTrigger
                  value="keywords"
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Keyword Insights
                </TabsTrigger> */}
                <TabsTrigger
                  value="performance"
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Performance Audit
                </TabsTrigger>
              </TabsList>

              <TabsContent value="traffic">
                <TrafficAnalytics chatbotId={chatbot_id} />
              </TabsContent>

              <TabsContent value="seo">
                <SEOCompliance chatbotId={chatbot_id} />
              </TabsContent>
              {/* 
              <TabsContent value="keywords">
                <KeywordInsights dateRange={dateRange} />
              </TabsContent> */}

              <TabsContent value="performance">
                <PerformanceAudit chatbotId={chatbot_id} />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Seo;
