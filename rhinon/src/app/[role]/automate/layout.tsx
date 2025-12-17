"use client";

import { AutomateSidebar } from "@/components/Common/Navigation/AutomateSidebar/AutomateSidebar";
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
        <AutomateSidebar>{children}</AutomateSidebar>
      </SidebarProvider>
    </div>
  );
}
