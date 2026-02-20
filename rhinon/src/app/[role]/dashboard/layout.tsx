"use client";

import BillingSidebar from "@/components/Common/Navigation/BillingSidebar/BillingSidebar";
import { SidebarProvider } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { useBannerStore } from "@/store/useBannerStore";

export default function BillingLayout({
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
        {/* <BillingSidebar> */}
          {children}

        {/* </BillingSidebar> */}
      </SidebarProvider>
    </div>
  );
}
