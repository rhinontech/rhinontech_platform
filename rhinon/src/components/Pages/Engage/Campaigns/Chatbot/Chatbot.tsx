"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft, RefreshCw, Calendar } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useRouter, useParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignList } from "./CampaignList";
import { CampaignFilters } from "./CampaignFilters";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import images from "@/components/Constants/Images";
import { useEffect, useState } from "react";
import { log } from "console";

interface ChatbotProps {
    activeTab: "recurring" | "one-time";
}

export default function Chatbot({ activeTab }: ChatbotProps) {
    const { toggleAutomateSidebar } = useSidebar();
    const router = useRouter();
    const params = useParams();
    const role = params.role as string;
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const handleTabChange = (value: string) => {
        router.push(`/${role}/engage/campaigns/chatbot/${value}`);
    };

    const handleAddCampaign = () => {
        router.push(`/${role}/engage/campaigns/chatbot/${activeTab}/templates`);
    };

    return (
        <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
            <div className="flex flex-1 flex-col w-full">
                <div className="flex items-center justify-between border-b h-[60px] px-4">
                    <div className="flex items-center gap-4">
                        <PanelLeft onClick={toggleAutomateSidebar} className="h-4 w-4 cursor-pointer" />
                        <h2 className="text-base font-bold">Campaigns</h2>
                    </div>
                </div>

                <ScrollArea className="flex-1 h-0">
                    <div className="p-6 space-y-6">
                        {/* Featured Banner */}
                        <div className="flex w-full rounded-lg overflow-hidden bg-gradient-to-r from-transparent to-secondary">
                            <div className="flex-1 flex flex-col gap-3 justify-center items-start p-6">
                                <p className="font-semibold text-2xl">New: exit intent campaign</p>
                                <p className="text-base text-muted-foreground">
                                    Capture visitors with exit intent by offering a special discount
                                    before they leave your site.
                                </p>
                            </div>
                            <div className="flex-shrink-0 flex items-center">
                                <img
                                    src="https://cdn.livechat-static.com/api/file/lc/img/targeted-messages/exit-intent-promo-banner.png"
                                    alt="Exit intent campaign"
                                    className="h-48 w-auto object-contain"
                                />
                            </div>
                        </div>


                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="grid w-fit grid-cols-2 mb-6">
                                <TabsTrigger value="recurring" className="gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Recurring
                                </TabsTrigger>
                                <TabsTrigger value="one-time" className="gap-2">
                                    <Calendar className="h-4 w-4" />
                                    One-time
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Campaign List */}
                        <div className="space-y-4">
                            <CampaignFilters filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} onAddCampaign={handleAddCampaign} />
                            <CampaignList filter={filter} search={search} campaignType={activeTab} />
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
