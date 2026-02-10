"use client"

import type * as React from "react"
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar"
import {
  BookOpenIcon,
  ChatIcon,
  CreditCardIcon,
  CrmIcon,
  LayoutDashboardIcon,
  MouseClickIcon,
  s3BucketIcon,
  seoAnalyticsIcon,
  SettingsIcon,
  SupportIcon,
  UsersIcon,
  ZapIcon,
} from "@/components/Constants/SvgIcons"
import { usePathname } from "next/navigation"
import { NavMain, type NavItem } from "./NavMain"
import { Mail } from "lucide-react"

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
      id: "s3-file-manager",
      title: "S3 File Manager",
      path: "s3-bucket",
      icon: s3BucketIcon,
      isExternal: false,
    },
    {
      id: "email-templates",
      title: "Email Templates",
      path: "email-templates",
      icon: Mail,
      isExternal: false,
    },
  ],
  navFooter: [
    {
      id: "manage_settings",
      title: "Settings",
      path: "settings",
      icon: SettingsIcon,
      isExternal: false,
    },
  ],
}

export function RootSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const role = pathname.split("/")[1]

  const filterNavItems = (items: typeof allNavItems.navMain | typeof allNavItems.navFooter): NavItem[] => {
    return items.map((item) => ({
      title: item.title,
      url: item.isExternal ? item.path : `/${role}/${item.path}`,
      icon: <item.icon isActive={!item.isExternal && pathname.includes(`/${role}/${item.path}`)} />,
      isActive: !item.isExternal && pathname.includes(`/${role}/${item.path}`),
      isExternal: item.isExternal,
    }))
  }

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
      collapsible="icon"
      variant="inset"
    >
      <SidebarContent>
        <NavMain items={filterNavItems(allNavItems.navMain)} />
      </SidebarContent>
      <SidebarFooter>
        <NavMain items={filterNavItems(allNavItems.navFooter)} />
      </SidebarFooter>
    </Sidebar>
  )
}
