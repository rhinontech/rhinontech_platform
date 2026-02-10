"use client"

import type React from "react"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import Link from "next/link"

export interface NavItem {
  title: string
  url: string
  icon: React.ReactNode
  isActive?: boolean
  isExternal?: boolean
  items?: {
    title: string
    url: string
  }[]
}

interface NavMainProps {
  items: NavItem[]
}

export function NavMain({ items }: NavMainProps) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
            <Link
              href={item.url}
              target={item.isExternal ? "_blank" : undefined}
              rel={item.isExternal ? "noopener noreferrer" : undefined}
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
