"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  BookOpenIcon,
  ChatIcon,
  CollaborationIcon,
  CreditCardIcon,
  CrmIcon,
  LayoutDashboardIcon,
  MouseClickIcon,
  seoAnalyticsIcon,
  SettingsIcon,
  SupportIcon,
  TicketIcon,
  UsersIcon,
  ZapIcon,
} from "@/components/Constants/SvgIcons";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { NavMain } from "./NavMain";
import { useUserStore } from "@/utils/store";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  title: string;
  path: string;
  icon: ({ isActive, ...props }: any) => React.ReactElement;
  isExternal?: boolean;
};
const allNavItems = {
  navMain: [
    {
      id: "access_dashboard",
      title: "Dashboard",
      path: "dashboard",
      icon: LayoutDashboardIcon,
      isExternal: false,
    },
    {
      id: "handle_chats",
      title: "Chats",
      path: "chats",
      icon: ChatIcon,
      isExternal: false,
    },
    {
      id: "handle_tickets",
      title: "Inbox",
      path: "inbox",
      icon: SupportIcon,
      isExternal: false,
    },
    {
      id: "automate_tasks",
      title: "Automate",
      path: "automate",
      icon: ZapIcon,
      isExternal: false,
    },
    {
      id: "engage_customers",
      title: "Engage",
      path: "engage",
      icon: MouseClickIcon,
      isExternal: false,
    },
    {
      id: "manage_crm",
      title: "Leads",
      path: "leads",
      icon: CrmIcon,
      isExternal: false,
    },
    {
      id: "view_seo_analytics",
      title: "SEO Analytics",
      path: "seo",
      icon: seoAnalyticsIcon,
      isExternal: false,
    },
    {
      id: "manage_users",
      title: "Teams",
      path: "teams",
      icon: UsersIcon,
      isExternal: false,
    },
    {
      id: "view_knowledge_base",
      title: "Knowledge Base",
      path: "knowledge-base",
      icon: BookOpenIcon,
      isExternal: false,
    },
    {
      id: "team_space",
      title: "Spaces",
      path: "spaces",
      icon: CollaborationIcon,
      isExternal: false,
    },
  ],
  navFooter: [
    {
      id: "billing_access",
      title: "Billing",
      path: "billings",
      icon: CreditCardIcon,
      isExternal: false,
    },
    {
      id: "manage_settings",
      title: "Settings",
      path: "settings",
      icon: SettingsIcon,
      isExternal: false,
    },
  ],
};

export function RootSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const role = Cookies.get("currentRole") || "";
  const {
    isPlanValid,
    orgRolesAccess,
    newTicketCount,
    newChatCount,
    trafficCount,
  } = useUserStore((state) => state.userData);

  const permissions =
    role === "superadmin" ? "ALL" : orgRolesAccess?.[role] ?? [];

  // If plan expired → restrict to only Dashboard, Billing, Settings
  const allowedWhenExpired = [
    "access_dashboard",
    "billing_access",
    // "manage_settings",
  ];

  const filterNavItems = (
    items: typeof allNavItems.navMain | typeof allNavItems.navFooter
  ) => {
    const filtered =
      permissions === "ALL"
        ? items
        : items.filter((item) => permissions.includes(item.id));

    // if plan expired, limit to allowed items
    const visibleItems =
      isPlanValid === false
        ? filtered.filter((item) => allowedWhenExpired.includes(item.id))
        : filtered;

    return visibleItems.map((item) => ({
      title: item.title,
      url: item.isExternal ? item.path : `/${role}/${item.path}`,
      icon: (
        <div className="relative flex items-center justify-center w-5 h-5">
          <item.icon
            isActive={
              !item.isExternal && pathname.includes(`/${role}/${item.path}`)
            }
          />
          {/* Notification badge */}
          {item.id === "handle_chats" && newChatCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-semibold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
              {newChatCount > 9 ? "9+" : newChatCount}
            </span>
          )}
          {item.id === "handle_tickets" && newTicketCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-semibold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
              {newTicketCount > 9 ? "9+" : newTicketCount}
            </span>
          )}
          {item.id === "engage_customers" && trafficCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-semibold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
              {trafficCount > 9 ? "9+" : trafficCount}
            </span>
          )}
        </div>
      ),

      isActive: !item.isExternal && pathname.includes(`/${role}/${item.path}`),
      isExternal: item.isExternal,
    }));
  };

  const data = {
    navMain: filterNavItems(allNavItems.navMain),
    navFooter: filterNavItems(allNavItems.navFooter),
  };

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
      collapsible="icon"
      variant="inset">
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavMain items={data.navFooter} />
      </SidebarFooter>
    </Sidebar>
  );
}
