"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

export default function Goals() {
  const { toggleAutomateSidebar } = useSidebar();
  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        <div className="flex items-center justify-between border-b h-[60px] p-4">
          <div className="flex items-center gap-4">
            <PanelLeft onClick={toggleAutomateSidebar} className="h-4 w-4" />
            <h2 className="text-base font-bold">Goals</h2>
          </div>
        </div>
        <ScrollArea className="flex-1 h-0 p-4">
          <p>The content here</p>
        </ScrollArea>
      </div>
    </div>
  );
}
