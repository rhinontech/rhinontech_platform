import BillingSidebar from "@/components/Common/Navigation/BillingSidebar/BillingSidebar";
import { SidebarProvider } from "@/context/SidebarContext";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rhinontech - Dashboard",
  description:
    "Rhinontech is your one-stop solution for all your business needs, offering a wide range of services to help you succeed.",
};

export default function BillingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider>
        <BillingSidebar>{children}</BillingSidebar>
      </SidebarProvider>
    </div>
  );
}
