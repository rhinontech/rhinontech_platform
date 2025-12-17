"use client";

import KbaseSidebar from "@/components/Common/Navigation/KbaseSidebar/KbaseSidebar";
import SupportSidebar from "@/components/Common/Navigation/SupportSidebar/SupportSidebar";
import { ChatbotProvider } from "@/context/ChatbotContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { useBannerStore } from "@/store/useBannerStore";

export default function KnowledgeBaseLayout({
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
          <KbaseSidebar>{children}</KbaseSidebar>
        </ChatbotProvider>
      </SidebarProvider>
    </div>
  );
}
