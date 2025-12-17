"use client";

import { SettingSidebar } from "@/components/Common/Navigation/SettingSidebar/SettingSidebar";
import { ChatbotProvider } from "@/context/ChatbotContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { useBannerStore } from "@/store/useBannerStore";

export default function AutomateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isVisible = useBannerStore((state) => state.isVisible);
  return (
    <div className={cn(
      isVisible
        ? "[--header-height:calc(--spacing(28))]"
        : "[--header-height:calc(--spacing(14))]"
    )}>
      <SidebarProvider>
        <ChatbotProvider>
          <SettingSidebar>{children}</SettingSidebar>
        </ChatbotProvider>
      </SidebarProvider>
    </div>
  );
}
