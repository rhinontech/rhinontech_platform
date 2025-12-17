"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { CampaignList } from "@/components/Pages/Engage/Campaigns/EmailCampaign/Landing/CampaignList";
import { CampaignFilters } from "@/components/Pages/Engage/Campaigns/EmailCampaign/Landing/CampaignFilters";


export default function EmailCampaign() {
    const { toggleAutomateSidebar } = useSidebar();
    return (
        <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
            <div className="flex flex-1 flex-col w-full gap-2">
                <div className="flex items-center justify-between border-b h-[60px] p-4">
                    <div className="flex items-center gap-4">
                        <PanelLeft onClick={toggleAutomateSidebar} className="h-4 w-4" />
                        <h2 className="text-base font-bold">Email Campaign</h2>
                    </div>
                </div>
                <ScrollArea className="flex-1 h-0 p-4">
                    <CampaignFilters />
                    <CampaignList />
                </ScrollArea>
            </div>
        </div>
    );
}
